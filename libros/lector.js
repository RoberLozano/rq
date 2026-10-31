/*
 * Lector de ISBN: código de barras (Quagga), OCR (Tesseract.js bajo demanda)
 * e input manual. Guarda en Realtime Database con el esquema de Libros.mdb.
 *
 * Sin módulos ni bundler a propósito: se carga con <script> normal.
 */
'use strict';

var $ = function (id) { return document.getElementById(id); };

var CONFIG = window.FIREBASE_CONFIG || {};
var CONFIGURADO = typeof CONFIG.databaseURL === 'string' &&
  /^https:\/\//.test(CONFIG.databaseURL) &&
  CONFIG.databaseURL.indexOf('PEGA_') === -1;

var FIREBASE_VERSION = '10.14.1';
var OCR_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/tesseract.min.js';

var db = null;
var firebaseListo = null;
var ocrWorker = null;
var escaneando = false;
var camaraOcr = null;
var ocrOcupado = false;
var ultimoLibro = null;
var autoresCache = null; // lista de fichas de /autores, para no crear duplicados
var autorPreview = null; // { nombre, ficha } del autor nuevo que se enseña antes de guardar
var metaInicial = null;
var cacheLibros = null;
var cacheEdiciones = {};
var cacheObras = {};
var scripts = {};

// Para adivinar el idioma de una sinopsis sin librerías externas.
var PALABRAS_ES = ['el', 'la', 'los', 'las', 'de', 'del', 'que', 'y', 'en', 'un', 'una',
  'por', 'con', 'para', 'su', 'sus', 'al', 'se', 'es', 'no', 'más', 'como', 'pero', 'este',
  'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'hasta', 'desde', 'donde',
  'todo', 'todos', 'ser', 'fue', 'era', 'han', 'hay', 'sus', 'otro', 'otra', 'vida'];
var PALABRAS_EN = ['the', 'and', 'of', 'to', 'in', 'a', 'is', 'that', 'it', 'with', 'for',
  'as', 'was', 'on', 'this', 'are', 'be', 'by', 'from', 'an', 'his', 'her', 'their', 'they',
  'she', 'he', 'at', 'or', 'which', 'not', 'but', 'have', 'had', 'one', 'all', 'when',
  'there', 'who', 'has', 'can', 'more', 'about', 'its'];

/* ---------- utilidades ---------- */

function estado(texto, tipo) {
  var el = $('estado');
  el.textContent = texto || '';
  el.className = tipo || '';
}

function cargarScript(src) {
  if (!scripts[src]) {
    scripts[src] = new Promise(function (resolver, rechazar) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolver(); };
      s.onerror = function () { rechazar(new Error('No se pudo cargar ' + src)); };
      document.head.appendChild(s);
    });
  }
  return scripts[src];
}

function hoy() {
  var d = new Date();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mes + '-' + dia;
}

function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* ---------- campos editables de la ficha ---------- */

function valorTexto(id) {
  var el = $(id);
  return el ? el.value.trim() : '';
}

function valorNumero(id) {
  var texto = valorTexto(id);
  return texto === '' ? null : Number(texto);
}

/** Enlace al artículo de la Wikipedia española. */
function urlWikipedia(titulo) {
  return 'https://es.wikipedia.org/wiki/' +
    encodeURIComponent(String(titulo || '').replace(/ /g, '_'));
}

/** Nombre legible de un enlace .../wiki/El_jugador. */
function nombreArticuloWikipedia(url) {
  var partes = String(url || '').split('/wiki/');
  if (partes.length < 2) return '';
  try {
    return decodeURIComponent(partes[1]).replace(/_/g, ' ');
  } catch (e) {
    return partes[1].replace(/_/g, ' ');
  }
}

/** Comprueba un número opcional del formulario. Devuelve el error o ''. */
function validarNumero(valor, etiqueta, minimo, maximo, entero) {
  if (valor === null) return '';
  if (!isFinite(valor)) return etiqueta + ' no es un número válido.';
  if (entero && Math.floor(valor) !== valor) {
    return etiqueta + ' tiene que ser un número entero.';
  }
  if (valor < minimo || valor > maximo) {
    return etiqueta + ' tiene que estar entre ' + minimo + ' y ' + maximo + '.';
  }
  return '';
}

/** Valida lo que se va a guardar. Solo el título es obligatorio. */
function validarFicha(titulo, anio, anioEdicion, npaginas, nota) {
  if (!titulo) return 'El título no puede estar vacío.';
  return validarNumero(anio, 'El año de la obra', 1, 2100, true) ||
    validarNumero(anioEdicion, 'El año de la edición', 1, 2100, true) ||
    validarNumero(npaginas, 'El número de páginas', 1, 100000, true) ||
    validarNumero(nota, 'La nota media', 0, 10, false);
}

/**
 * Google Books devuelve la sinopsis con HTML (<p>, <b>, &amp;…). En el .mdb el
 * campo es texto plano, así que se guarda igual: sin etiquetas ni entidades.
 */
function textoPlano(html) {
  var texto = String(html || '');
  if (!texto) return '';

  // Primero se conservan los saltos de párrafo y se quitan las etiquetas.
  texto = texto
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|li|h[1-6]|blockquote|tr)\s*>/gi, '\n\n')
    .replace(/<\/?[a-zA-Z][^>]*>/g, '');

  // Después, el navegador decodifica las entidades (&amp;, &aacute;, &#39;…).
  texto = new DOMParser().parseFromString(texto, 'text/html').body.textContent || '';

  return texto
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\r?\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Descripción de Google Books u Open Library, que puede venir como objeto. */
function descripcionDe(valor) {
  if (!valor) return '';
  if (typeof valor === 'object') valor = valor.value || '';
  return textoPlano(valor);
}

/** Idioma probable de un texto: 'es', 'en' o '' si no está claro. */
function idiomaDeTexto(texto) {
  var palabras = String(texto || '').toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
  if (!palabras.length) return '';
  var es = 0;
  var en = 0;
  for (var i = 0; i < palabras.length; i++) {
    if (PALABRAS_ES.indexOf(palabras[i]) !== -1) es++;
    if (PALABRAS_EN.indexOf(palabras[i]) !== -1) en++;
  }
  if (es > 2 && es >= en * 1.3) return 'es';
  if (en > 2 && en >= es * 1.3) return 'en';
  return '';
}

function esEspanol(codigoIdioma, texto) {
  var codigo = String(codigoIdioma || '').toLowerCase();
  if (codigo === 'es' || codigo === 'spa') return true;
  if (codigo === 'en' || codigo === 'eng') return false;
  return idiomaDeTexto(texto) === 'es';
}

/** Primer año de cuatro cifras que aparezca ("1813", "1813-01-28", "marzo de 1813"). */
function primerAnio(texto) {
  var encontrado = String(texto || '').match(/\b(1\d{3}|20\d{2})\b/);
  return encontrado ? Number(encontrado[1]) : 0;
}

function idiomaEdicionOpenLibrary(edicion) {
  var claves = (edicion.languages || []).map(function (l) { return (l && l.key) || ''; });
  if (claves.indexOf('/languages/spa') !== -1) return 'spa';
  if (claves.indexOf('/languages/eng') !== -1) return 'eng';
  return '';
}

/* Open Library se consulta varias veces por ISBN: se guarda la promesa. */
function edicionOpenLibrary(isbn) {
  if (!cacheEdiciones[isbn]) {
    cacheEdiciones[isbn] = fetch('https://openlibrary.org/isbn/' + isbn + '.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  return cacheEdiciones[isbn];
}

function obraOpenLibrary(clave) {
  if (!clave) return Promise.resolve(null);
  if (!cacheObras[clave]) {
    cacheObras[clave] = fetch('https://openlibrary.org' + clave + '.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  return cacheObras[clave];
}

/* ---------- número de páginas ---------- */

var cacheEdicionesObra = {};

/** Ediciones de una obra: la edición escaneada casi nunca trae las páginas. */
function edicionesObraOpenLibrary(clave) {
  if (!clave) return Promise.resolve([]);
  if (!cacheEdicionesObra[clave]) {
    cacheEdicionesObra[clave] = fetch('https://openlibrary.org' + clave + '/editions.json?limit=200')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return (d && d.entries) || []; })
      .catch(function () { return []; });
  }
  return cacheEdicionesObra[clave];
}

function mediana(numeros) {
  var v = numeros.slice().sort(function (a, b) { return a - b; });
  if (!v.length) return 0;
  var medio = Math.floor(v.length / 2);
  return v.length % 2 ? v[medio] : Math.round((v[medio - 1] + v[medio]) / 2);
}

/** Código de idioma de Open Library («spa») de la edición, si se conoce. */
function idiomaOpenLibrary(info) {
  var codigos = idiomasDeLibro(info || {});
  // `idioma` ya viene calculado para el catálogo («castellano»).
  idiomasDeEtiqueta((info && info.idioma) || '').forEach(function (c) {
    if (codigos.indexOf(c) === -1) codigos.push(c);
  });
  for (var i = 0; i < codigos.length; i++) {
    if (IDIOMAS[codigos[i]]) return IDIOMAS[codigos[i]].ol;
  }
  return '';
}

/** ¿Los dos textos se refieren a lo mismo? «HarperCollins» ~ «HarperCollins Español». */
function mismoTexto(a, b) {
  var x = normalizarNombre(a);
  var y = normalizarNombre(b);
  if (!x || !y) return false;
  return x.indexOf(y) !== -1 || y.indexOf(x) !== -1;
}

/**
 * Mediana de las páginas de las ediciones de la obra. Primero las del mismo
 * idioma y, de esas, las de la misma editorial o año que la escaneada.
 */
async function paginasObraOpenLibrary(clave, info) {
  var ediciones = await edicionesObraOpenLibrary(clave);
  var conPaginas = ediciones.filter(function (e) {
    return Number(e.number_of_pages) > 0;
  });
  if (!conPaginas.length) return 0;

  var codigoOl = idiomaOpenLibrary(info);
  var delIdioma = conPaginas.filter(function (e) {
    return (e.languages || []).some(function (l) {
      return l && l.key === '/languages/' + codigoOl;
    });
  });
  var base = delIdioma.length ? delIdioma : conPaginas;

  var anio = primerAnio((info || {}).publishedDate);

  function cercania(e) {
    var puntos = 0;
    var editorial = (info || {}).publisher || '';
    if (editorial && (e.publishers || []).some(function (p) { return mismoTexto(p, editorial); })) {
      puntos += 2;
    }
    var suyo = primerAnio(e.publish_date);
    if (anio && suyo && Math.abs(suyo - anio) <= 1) puntos += 1;
    return puntos;
  }

  var mejor = 0;
  base.forEach(function (e) { mejor = Math.max(mejor, cercania(e)); });
  var cerca = mejor ? base.filter(function (e) { return cercania(e) === mejor; }) : base;

  return mediana(cerca.map(function (e) { return Number(e.number_of_pages); }));
}

/** Último recurso: ediciones con el mismo título y autor en Google Books. */
async function paginasGoogleBusqueda(info) {
  var titulo = tituloBase(info.title);
  if (!titulo) return 0;

  var autor = limpiarNombreAutor((info.authors || [])[0] || '');
  var consulta = 'intitle:' + encodeURIComponent('"' + titulo + '"');
  if (autor) consulta += '+inauthor:' + encodeURIComponent('"' + autor + '"');

  var respuesta = await fetch('https://www.googleapis.com/books/v1/volumes?q=' +
    consulta + '&maxResults=20&hl=es');
  if (!respuesta.ok) return 0;

  var json = await respuesta.json();
  var codigo = idiomasDeLibro(info)[0] || '';
  var todas = [];
  var delIdioma = [];

  (json.items || []).forEach(function (item) {
    var v = (item && item.volumeInfo) || {};
    if (!(Number(v.pageCount) > 0)) return;
    if (!titulosParecidos(titulo, v.title || '')) return;
    todas.push(Number(v.pageCount));
    if (!codigo || idiomasDeEtiqueta(v.language || '').indexOf(codigo) !== -1) {
      delIdioma.push(Number(v.pageCount));
    }
  });

  return mediana(delIdioma.length ? delIdioma : todas);
}

/**
 * Páginas de la edición escaneada. Google Books limita por IP y las ediciones
 * de Open Library casi nunca traen `number_of_pages`, así que si falta se
 * buscan en las demás ediciones de la misma obra, prefiriendo el mismo idioma.
 * Devuelve `{ paginas, estimada }`; `estimada` avisa de que no es esta edición.
 */
async function paginasDeLibro(isbn, info) {
  if (Number((info || {}).pageCount) > 0) {
    return { paginas: Number(info.pageCount), estimada: false };
  }

  var edicion = await edicionOpenLibrary(isbn);
  if (edicion && Number(edicion.number_of_pages) > 0) {
    return { paginas: Number(edicion.number_of_pages), estimada: false };
  }

  var obras = ((edicion && edicion.works) || [])
    .map(function (o) { return o && o.key; })
    .filter(Boolean);

  // Si el ISBN no está en Open Library, la búsqueda da la obra a la que ir.
  if (!obras.length) {
    try {
      var r = await fetch('https://openlibrary.org/search.json?q=isbn:' + isbn +
        '&fields=key&limit=1');
      if (r.ok) {
        var doc = ((await r.json()).docs || [])[0];
        if (doc && doc.key) obras = [doc.key];
      }
    } catch (e) { /* sin Open Library: se prueba Google */ }
  }

  for (var i = 0; i < obras.length; i++) {
    var paginas = await paginasObraOpenLibrary(obras[i], info || {});
    if (paginas) return { paginas: paginas, estimada: true };
  }

  try {
    var otras = await paginasGoogleBusqueda(info || {});
    if (otras) return { paginas: otras, estimada: true };
  } catch (e) { /* Google limita otra vez: se guarda sin páginas */ }

  return { paginas: 0, estimada: false };
}

/** Título de la obra (a veces traducido) para buscarla en la Wikipedia. */
async function tituloObraOpenLibrary(isbn) {
  var edicion = await edicionOpenLibrary(isbn);
  var obras = (edicion && edicion.works) || [];
  var obra = await obraOpenLibrary(obras[0] && obras[0].key);
  return (obra && obra.title) || '';
}

/** "Austen, Jane, 1775-1817." → "Jane Austen" (formato de Open Library). */
function limpiarNombreAutor(nombre) {
  var partes = String(nombre || '').split(',')
    .map(function (p) { return p.trim(); })
    .filter(function (p) { return p && !/^\d/.test(p); });
  if (partes.length >= 2) return partes.slice(1).join(' ') + ' ' + partes[0];
  return partes.join(' ');
}

function normalizarNombre(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trocea un nombre para compararlo: sin acentos, sin puntos y sin guiones. */
function tokensNombre(texto) {
  return normalizarNombre(texto).split(/[\s.\-]+/).filter(Boolean);
}

/** ¿Los tokens `a` aparecen en `b` en orden? Una inicial vale por el nombre entero. */
function tokensEncajan(a, b) {
  if (!a.length) return true;
  var i = 0;
  for (var j = 0; j < b.length && i < a.length; j++) {
    if (b[j] === a[i] || (a[i].length === 1 && b[j].charAt(0) === a[i])) i++;
  }
  return i === a.length;
}

/** Título comparable: sin acentos, sin subtítulo, sin signos y sin artículos. */
function normalizarTitulo(titulo) {
  return normalizarNombre(titulo)
    .replace(/[:;].*$/, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(el|la|los|las|un|una|unos|unas|the|a|an|le|les|il|lo)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ¿Dos títulos son la misma obra? Vale el título exacto (sin subtítulo) y que
 * el más corto esté contenido en el más largo, con al menos dos palabras: así
 * «El hobbit» empareja con «El hobbit ilustrado», pero «Casa» no vale por
 * «La casa de los espíritus».
 */
function titulosParecidos(a, b) {
  var x = normalizarTitulo(a);
  var y = normalizarTitulo(b);
  if (!x || !y) return false;
  if (x === y) return true;

  var tx = x.split(' ').filter(Boolean);
  var ty = y.split(' ').filter(Boolean);
  var corto = tx.length <= ty.length ? tx : ty;
  var largo = tx.length <= ty.length ? ty : tx;
  if (corto.length < 2) return false;

  return corto.every(function (palabra) { return largo.indexOf(palabra) !== -1; });
}

/* ---------- ISBN ---------- */

function isbn13Valido(s) {
  if (!/^\d{13}$/.test(s)) return false;
  var suma = 0;
  for (var i = 0; i < 13; i++) suma += Number(s[i]) * (i % 2 ? 3 : 1);
  return suma % 10 === 0;
}

function isbn10Valido(s) {
  if (!/^\d{9}[\dX]$/.test(s)) return false;
  var suma = 0;
  for (var i = 0; i < 10; i++) suma += (s[i] === 'X' ? 10 : Number(s[i])) * (10 - i);
  return suma % 11 === 0;
}

function isbn10a13(s) {
  var base = '978' + s.slice(0, 9);
  var suma = 0;
  for (var i = 0; i < 12; i++) suma += Number(base[i]) * (i % 2 ? 3 : 1);
  return base + ((10 - (suma % 10)) % 10);
}

function agregarVentanas(secuencia, salida) {
  for (var largo = 13; largo >= 10; largo -= 3) {
    for (var i = 0; i + largo <= secuencia.length; i++) {
      var trozo = secuencia.slice(i, i + largo);
      if (largo === 13) {
        if (isbn13Valido(trozo)) salida.push(trozo);
      } else if (isbn10Valido(trozo)) {
        salida.push(isbn10a13(trozo));
      }
    }
  }
}

/** Devuelve un ISBN-13 válido encontrado en el texto, o null. */
function resolverIsbn(texto) {
  var crudo = String(texto || '').toUpperCase();
  var candidatos = [];

  // Código de barras o texto OCR sin separadores.
  var secuencias = crudo.match(/[0-9X]+/g) || [];
  // ISBN impreso con guiones o espacios: "978-0-306-40615-7".
  secuencias.push(crudo.replace(/[^0-9X]/g, ''));

  for (var i = 0; i < secuencias.length; i++) agregarVentanas(secuencias[i], candidatos);

  for (var j = 0; j < candidatos.length; j++) {
    if (/^97[89]/.test(candidatos[j])) return candidatos[j];
  }
  return candidatos[0] || null;
}

function usarTexto(texto, origen) {
  var isbn = resolverIsbn(texto);
  if (!isbn) {
    estado('No encontré un ISBN válido en ' + origen + '.', 'error');
    return;
  }
  $('isbn').value = isbn;
  buscar(isbn);
}

/* ---------- búsqueda ---------- */

async function consultarGoogle(isbn) {
  var url = 'https://www.googleapis.com/books/v1/volumes?q=isbn:' +
    encodeURIComponent(isbn) + '&hl=es';
  var respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error('Google Books respondió ' + respuesta.status);
  var json = await respuesta.json();
  var item = json.items && json.items[0];
  return (item && item.volumeInfo) || null;
}

/** Alternativa cuando Google Books responde 429 (cuota) o no tiene el libro. */
async function consultarOpenLibrary(isbn) {
  var edicion = await edicionOpenLibrary(isbn);
  if (!edicion) return null;

  // La edición trae los nombres en `author` (a veces en `authors`).
  var nombres = edicion.authors || edicion.author || [];
  var autores = [];
  for (var i = 0; i < nombres.length; i++) {
    var nombre = nombres[i];
    if (typeof nombre === 'string') {
      autores.push(limpiarNombreAutor(nombre));
    } else if (nombre && nombre.key) {
      try {
        var r = await fetch('https://openlibrary.org' + nombre.key + '.json');
        if (r.ok) autores.push(limpiarNombreAutor((await r.json()).name));
      } catch (e) { /* autor sin datos: se omite */ }
    }
  }

  // Muchas ediciones no traen autor. Y cuando lo traen, a veces son el
  // traductor o el prologuista: si no coinciden con los de la obra, mandan
  // los de la obra (el Quijote figuraba con Unamuno y Grossman).
  var autoresObra = await autoresDeObraOpenLibrary(edicion);
  if (autoresObra.length && (!autores.length || !autoresCoinciden(autores, autoresObra))) {
    autores = autoresObra;
  }

  var descripcion = descripcionDe(edicion.description);

  var tapa = (edicion.covers || []).filter(function (c) { return c > 0; })[0];
  var idioma = idiomaEdicionOpenLibrary(edicion);

  return {
    title: edicion.title + (edicion.subtitle ? ': ' + edicion.subtitle : ''),
    authors: autores,
    publisher: (edicion.publishers || [])[0] || '',
    publishedDate: edicion.publish_date || '',
    pageCount: edicion.number_of_pages || null,
    description: descripcion,
    categories: edicion.subjects || [],
    language: idioma === 'spa' ? 'es' : (idioma === 'eng' ? 'en' : ''),
    imageLinks: tapa ? { thumbnail: 'https://covers.openlibrary.org/b/id/' + tapa + '-M.jpg' } : null
  };
}

/** Autores a nivel de obra (los de la edición a veces faltan). */
async function autoresDeObraOpenLibrary(edicion) {
  var obras = (edicion && edicion.works) || [];
  for (var i = 0; i < obras.length; i++) {
    var obra = await obraOpenLibrary(obras[i] && obras[i].key);
    var lista = (obra && obra.authors) || [];
    var nombres = [];
    for (var j = 0; j < lista.length; j++) {
      var clave = lista[j] && lista[j].author && lista[j].author.key;
      if (!clave) continue;
      try {
        var r = await fetch('https://openlibrary.org' + clave + '.json');
        if (r.ok) nombres.push(limpiarNombreAutor((await r.json()).name));
      } catch (e) { /* autor sin datos: se omite */ }
    }
    if (nombres.length) return nombres;
  }
  return [];
}

/* ---------- idioma de la obra ---------- */

// El catálogo del .mdb usa etiquetas en castellano en el campo `idioma`.
var IDIOMAS = {
  es: { ol: 'spa', etiqueta: 'castellano' },
  en: { ol: 'eng', etiqueta: 'inglés' },
  fr: { ol: 'fre', etiqueta: 'francés' },
  de: { ol: 'ger', etiqueta: 'alemán' },
  it: { ol: 'ita', etiqueta: 'italiano' },
  pt: { ol: 'por', etiqueta: 'portugués' },
  ca: { ol: 'cat', etiqueta: 'catalán' },
  gl: { ol: 'glg', etiqueta: 'gallego' },
  eu: { ol: 'eus', etiqueta: 'euskera' }
};

function etiquetaIdioma(codigo) {
  return (IDIOMAS[codigo] && IDIOMAS[codigo].etiqueta) || '';
}

// Etiquetas del .mdb y códigos ISO/SIL → un código común para comparar.
var IDIOMAS_ETIQUETA = {
  es: 'es', spa: 'es', castellano: 'es', espanol: 'es',
  en: 'en', eng: 'en', ingles: 'en',
  fr: 'fr', fre: 'fr', frances: 'fr',
  de: 'de', ger: 'de', aleman: 'de',
  it: 'it', ita: 'it', italiano: 'it',
  pt: 'pt', por: 'pt', portugues: 'pt',
  ca: 'ca', cat: 'ca', catalan: 'ca',
  gl: 'gl', glg: 'gl', gallego: 'gl',
  eu: 'eu', eus: 'eu', euskera: 'eu'
};

/** Códigos de una etiqueta de idioma: «francés-castellano» → fr, es. */
function idiomasDeEtiqueta(texto) {
  var partes = normalizarNombre(texto).split(/[^a-z]+/).filter(Boolean);
  var codigos = [];
  for (var i = 0; i < partes.length; i++) {
    var codigo = IDIOMAS_ETIQUETA[partes[i]];
    if (codigo && codigos.indexOf(codigo) === -1) codigos.push(codigo);
  }
  return codigos;
}

/**
 * Idioma de la edición escaneada, en códigos. Solo cuenta lo que se sabe:
 * `info.idioma` puede ser el «castellano» por defecto de idiomaLibro().
 * Si la edición no trae idioma, se mira el del título («El Hobbit» / «The
 * Hobbit»): es lo único que distingue dos ediciones del mismo título.
 */
function idiomasDeLibro(info) {
  var codigos = idiomasDeEtiqueta((info && info.language) || '');
  if (!codigos.length) {
    var delTitulo = idiomaDeTitulo((info && info.title) || '');
    if (delTitulo) codigos = [delTitulo];
  }
  return codigos;
}

/** Idioma del título por sus palabras vacías: «El Hobbit» → es, «The Hobbit» → en. */
function idiomaDeTitulo(titulo) {
  var palabras = normalizarNombre(titulo).match(/[a-z]+/g) || [];
  var es = 0;
  var en = 0;
  for (var i = 0; i < palabras.length; i++) {
    if (PALABRAS_ES.indexOf(palabras[i]) !== -1) es++;
    if (PALABRAS_EN.indexOf(palabras[i]) !== -1) en++;
  }
  if (es > en) return 'es';
  if (en > es) return 'en';
  return '';
}

/**
 * ¿Pueden ser la misma obra? El catálogo guarda la edición que se leyó, así que
 * «The Hobbit» en inglés y «El Hobbit» en castellano son dos libros distintos.
 * Solo se descarta cuando los dos idiomas se conocen y no coinciden.
 */
function idiomasCompatibles(a, b) {
  if (!a.length || !b.length) return true;
  for (var i = 0; i < a.length; i++) {
    if (b.indexOf(a[i]) !== -1) return true;
  }
  return false;
}

/**
 * Idioma de la edición para el campo `idioma` del catálogo. No afecta a la
 * sinopsis: esa va siempre en español, se lea el libro en el idioma que sea.
 */
function idiomaLibro(info) {
  var codigo = String(info.language || '').toLowerCase();
  if (IDIOMAS[codigo]) return codigo;
  var detectado = idiomaDeTexto(info.description) || idiomaDeTexto(info.title);
  return IDIOMAS[detectado] ? detectado : 'es';
}

/* ---------- sinopsis y año de la obra ---------- */

/** Edición del mismo título en Google Books, con sinopsis en español. */
async function sinopsisGoogleEspanol(info) {
  var titulo = tituloBase(info.title);
  if (!titulo) return null;
  var consulta = 'intitle:' + encodeURIComponent('"' + titulo + '"');
  var autor = (info.authors || [])[0] || '';
  if (autor) consulta += '+inauthor:' + encodeURIComponent('"' + autor + '"');
  try {
    var r = await fetch('https://www.googleapis.com/books/v1/volumes?q=' + consulta +
      '&langRestrict=es&maxResults=20&hl=es');
    if (!r.ok) return null;
    var json = await r.json();
    var items = json.items || [];
    for (var i = 0; i < items.length; i++) {
      var v = items[i].volumeInfo || {};
      var texto = descripcionDe(v.description);
      if (!texto) continue;
      if (v.language === 'es' || idiomaDeTexto(texto) === 'es') {
        return { descripcion: texto, categorias: v.categories || null };
      }
    }
  } catch (e) { /* sin resultados en español */ }
  return null;
}

/** Otra edición de la misma obra, en español, con sinopsis. */
async function sinopsisOpenLibraryEspanol(isbn) {
  var edicion = await edicionOpenLibrary(isbn);
  var obras = (edicion && edicion.works) || [];
  for (var w = 0; w < obras.length; w++) {
    var clave = obras[w] && obras[w].key;
    if (!clave) continue;
    try {
      var r = await fetch('https://openlibrary.org' + clave + '/editions.json?limit=100');
      if (!r.ok) continue;
      var datos = await r.json();
      var eds = datos.entries || [];
      for (var i = 0; i < eds.length; i++) {
        if (idiomaEdicionOpenLibrary(eds[i]) !== 'spa') continue;
        var texto = descripcionDe(eds[i].description);
        if (texto) return { descripcion: texto, categorias: null };
      }
    } catch (e) { /* siguiente obra */ }
  }
  return null;
}


/** Título sin subtítulo ni aclaraciones entre paréntesis. */
function tituloBase(titulo) {
  return String(titulo || '').replace(/\s*[:;(].*$/, '').trim();
}

function mismoTitulo(a, b) {
  var x = normalizarNombre(a).replace(/[^a-z0-9 ]/g, '');
  var y = normalizarNombre(b).replace(/[^a-z0-9 ]/g, '');
  if (!x || !y) return false;
  return x === y || y.indexOf(x) === 0 || x.indexOf(y) === 0;
}

/**
 * ¿El artículo se llama como la obra? Se comparan las palabras con contenido,
 * así que «Matar a un ruiseñor» casa con «Matar un ruiseñor» y «El jugador» con
 * «El jugador (Dostoyevski)», pero «Los mundos de Ursula K. Le Guin» no con
 * «Premio Ursula K. Le Guin» ni con «El nombre del mundo es Bosque».
 */
var PALABRAS_VACIAS = {
  a: 1, al: 1, de: 1, del: 1, el: 1, la: 1, las: 1, los: 1, un: 1, una: 1,
  unos: 1, unas: 1, y: 1, e: 1, en: 1, con: 1, por: 1, para: 1, the: 1
};

function palabrasTitulo(texto) {
  return normalizarNombre(texto)
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(' ')
    .filter(function (p) { return p && !PALABRAS_VACIAS[p]; });
}

function tituloDeObra(bases, tituloArticulo) {
  var articulo = palabrasTitulo(tituloArticulo);
  if (!articulo.length) return false;

  for (var i = 0; i < bases.length; i++) {
    var base = palabrasTitulo(bases[i]);
    if (!base.length) continue;

    var largo = Math.min(base.length, articulo.length);
    var igual = true;
    for (var j = 0; j < largo; j++) {
      if (base[j] !== articulo[j]) { igual = false; break; }
    }
    if (igual) return true;
  }
  return false;
}

function mismoAutor(autor, lista) {
  // Se exige que coincida el apellido (última palabra) como palabra completa:
  // así "Miguel de Unamuno" no se da por igual a "Miguel de Cervantes".
  function palabras(texto) {
    return normalizarNombre(texto)
      .replace(/[^a-z0-9\- ]/g, ' ')
      .split(' ')
      .filter(Boolean);
  }
  var partes = palabras(autor).filter(function (p) { return p.length > 2; });
  if (!partes.length) return false;
  var apellido = partes[partes.length - 1];
  for (var i = 0; i < (lista || []).length; i++) {
    if (palabras(lista[i]).indexOf(apellido) !== -1) return true;
  }
  return false;
}

/** ¿Comparten al menos un autor las dos listas de nombres? */
function autoresCoinciden(a, b) {
  for (var i = 0; i < (a || []).length; i++) {
    if (mismoAutor(a[i], b)) return true;
  }
  return false;
}

/**
 * Primera publicación según el buscador de Open Library, que ordena por
 * relevancia y suele devolver primero la obra canónica (la que tiene más
 * ediciones). `first_publish_date` del JSON de la obra a veces está mal
 * (Orgullo y prejuicio figura como 1853), por eso manda el índice de búsqueda.
 */
async function anioBusquedaOpenLibrary(info) {
  var titulo = tituloBase(info.title);
  if (!titulo) return 0;
  var autor = (info.authors || [])[0] || '';
  var url = 'https://openlibrary.org/search.json?title=' + encodeURIComponent(titulo) +
    (autor ? '&author=' + encodeURIComponent(autor) : '') +
    '&limit=5&fields=title,author_name,first_publish_year';
  try {
    var r = await fetch(url);
    if (!r.ok) return 0;
    var json = await r.json();
    var docs = json.docs || [];
    for (var i = 0; i < docs.length; i++) {
      var anio = Number(docs[i].first_publish_year) || 0;
      if (!anio) continue;
      if (!mismoTitulo(titulo, docs[i].title)) continue;
      if (autor && docs[i].author_name && !mismoAutor(autor, docs[i].author_name)) continue;
      return anio;
    }
  } catch (e) { /* sin datos */ }
  return 0;
}

/**
 * Año de la obra original, nunca el de la edición escaneada (que va en
 * `anioEdicion`). Orden: índice de Open Library → fecha de la obra →
 * edición más antigua de Google Books.
 */
async function anioObraOriginal(isbn, info) {
  var anio = await anioBusquedaOpenLibrary(info);

  if (!anio) {
    var edicion = await edicionOpenLibrary(isbn);
    var obras = (edicion && edicion.works) || [];
    for (var i = 0; i < obras.length && !anio; i++) {
      var obra = await obraOpenLibrary(obras[i] && obras[i].key);
      if (!obra) continue;
      anio = primerAnio(obra.first_publish_year) || primerAnio(obra.first_publish_date);
    }
  }

  var titulo = tituloBase(info.title);
  var autor = (info.authors || [])[0] || '';
  if (!anio && titulo) {
    var consulta = 'intitle:' + encodeURIComponent('"' + titulo + '"');
    if (autor) consulta += '+inauthor:' + encodeURIComponent('"' + autor + '"');
    try {
      var r = await fetch('https://www.googleapis.com/books/v1/volumes?q=' + consulta +
        '&maxResults=40&hl=es');
      if (r.ok) {
        var json = await r.json();
        var items = json.items || [];
        var minimo = 0;
        for (var j = 0; j < items.length; j++) {
          var anioItem = primerAnio((items[j].volumeInfo || {}).publishedDate);
          if (anioItem && (!minimo || anioItem < minimo)) minimo = anioItem;
        }
        anio = minimo;
      }
    } catch (e) { /* Google Books no disponible */ }
  }

  return anio;
}

/* ---------- Wikipedia en español: sinopsis y año de la obra ---------- */

var TIPO_LIBRO = /(novela|libro|obra|ensayo|poemario|relato|cuento|biografía|cómic|novela gráfica|tratado|antología)/i;
var NO_LIBRO = /(película|serie de televisión|miniserie|telenovela|videojuego|álbum|ópera)/i;

async function titulosWikipedia(consulta) {
  try {
    var url = 'https://es.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*' +
      '&srlimit=5&srsearch=' + encodeURIComponent(consulta);
    var r = await fetch(url);
    if (!r.ok) return [];
    var json = await r.json();
    return ((json.query && json.query.search) || []).map(function (x) { return x.title; });
  } catch (e) {
    return [];
  }
}

/** Extrae introducción, descripción corta y Q de Wikidata de varios artículos. */
async function fichasWikipedia(titulos) {
  var url = 'https://es.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
    '&prop=extracts|description|pageprops&exintro=1&explaintext=1&redirects=1' +
    '&titles=' + encodeURIComponent(titulos.join('|'));
  var r = await fetch(url);
  if (!r.ok) return [];
  var json = await r.json();
  var paginas = (json.query && json.query.pages) || {};
  var redirecciones = {};
  ((json.query && json.query.redirects) || []).forEach(function (x) {
    redirecciones[x.from] = x.to;
  });

  var porTitulo = {};
  Object.keys(paginas).forEach(function (clave) {
    var p = paginas[clave];
    if (!p || p.missing !== undefined) return;
    porTitulo[p.title] = {
      titulo: p.title,
      descripcion: p.description || '',
      qid: (p.pageprops && p.pageprops.wikibase_item) || '',
      extracto: textoPlano(p.extract)
    };
  });

  var salida = [];
  for (var i = 0; i < titulos.length; i++) {
    var ficha = porTitulo[titulos[i]] || porTitulo[redirecciones[titulos[i]]];
    if (ficha) salida.push(ficha);
  }
  return salida;
}

function esArticuloDeLibro(ficha) {
  if (!ficha || !ficha.extracto) return false;
  // Adaptaciones: "El maestro de esgrima (película)" no sirve como sinopsis.
  if (NO_LIBRO.test(ficha.descripcion)) return false;
  if (TIPO_LIBRO.test(ficha.descripcion)) return true;
  return /^[^.]{0,160}\b(es|fue) (una|un) (novela|libro|obra|ensayo|poemario|antología|relato|cuento)/i
    .test(ficha.extracto);
}

/** Año de publicación de la obra según Wikidata (propiedad P577). */
async function anioWikidata(qid) {
  try {
    var url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*' +
      '&props=claims&ids=' + encodeURIComponent(qid);
    var r = await fetch(url);
    if (!r.ok) return 0;
    var json = await r.json();
    var entidad = json.entities && json.entities[qid];
    var fechas = (entidad && entidad.claims && entidad.claims.P577) || [];
    var anios = [];
    for (var i = 0; i < fechas.length; i++) {
      var valor = fechas[i].mainsnak && fechas[i].mainsnak.datavalue &&
        fechas[i].mainsnak.datavalue.value;
      var anio = valor && valor.time ? Number(String(valor.time).slice(1, 5)) : 0;
      if (anio) anios.push(anio);
    }
    return anios.length ? Math.min.apply(null, anios) : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Busca el artículo del libro en la Wikipedia española. Primero por el título
 * de la edición y después por el título de la obra en Open Library (que suele
 * estar traducido: "Pride and Prejudice" → "Orgullo y prejuicio").
 */
async function articuloWikipedia(info, isbn) {
  var tituloObra = await tituloObraOpenLibrary(isbn);
  var autor = (info.authors || [])[0] || '';

  var bases = [];
  [info.title, tituloObra].forEach(function (t) {
    t = tituloBase(t);
    if (t && bases.indexOf(t) === -1) bases.push(t);
  });

  // Buscar solo por el título trae la desambiguación («El jugador» → jugador
  // de videojuegos); con el autor, el artículo de la novela queda primero.
  var consultas = [];
  bases.forEach(function (t) {
    var conAutor = autor ? t + ' ' + autor : '';
    if (conAutor && consultas.indexOf(conAutor) === -1) consultas.push(conAutor);
    if (consultas.indexOf(t) === -1) consultas.push(t);
  });

  var titulos = [];
  for (var i = 0; i < consultas.length; i++) {
    var encontrados = await titulosWikipedia(consultas[i]);
    for (var j = 0; j < encontrados.length && titulos.length < 6; j++) {
      if (titulos.indexOf(encontrados[j]) === -1) titulos.push(encontrados[j]);
    }
  }
  if (!titulos.length) return null;

  var fichas = await fichasWikipedia(titulos.slice(0, 6));
  var respaldo = null;
  for (var k = 0; k < fichas.length; k++) {
    if (!esArticuloDeLibro(fichas[k])) continue;
    // El artículo tiene que ser de esta obra. Sin esto, buscar por autor trae
    // «El nombre del mundo es Bosque» o «Premio Ursula K. Le Guin» cuando la
    // obra buscada no tiene artículo propio.
    if (!tituloDeObra(bases, fichas[k].titulo)) continue;
    if (autor && mismoAutor(autor, [fichas[k].descripcion, fichas[k].extracto])) return fichas[k];
    if (!respaldo) respaldo = fichas[k];
  }
  return respaldo;
}

/**
 * Deja la ficha como la quiere el catálogo: sinopsis en español y año de la
 * obra original, no el de la edición concreta que se ha escaneado.
 */
async function completarFicha(info, isbn) {
  var ficha = info;
  // El idioma se calcula antes de tocar la descripción: después será española.
  var codigoIdioma = idiomaLibro(ficha);
  var texto = descripcionDe(ficha.description);
  ficha.description = texto;
  ficha.idioma = etiquetaIdioma(codigoIdioma);

  // 1) Sinopsis: Wikipedia en español manda; después, una edición española.
  var articulo = null;
  try {
    articulo = await articuloWikipedia(ficha, isbn);
  } catch (e) { /* sin artículo utilizable */ }

  if (articulo) {
    ficha.description = articulo.extracto;
    ficha.sinopsisEnEspanol = true;
    // El artículo existe: se guarda su enlace para la ficha.
    ficha.wikipedia = urlWikipedia(articulo.titulo);
  } else if (texto && esEspanol(ficha.language, texto)) {
    ficha.sinopsisEnEspanol = true;
  } else {
    var alternativa = await sinopsisOpenLibraryEspanol(isbn);
    if (!alternativa) alternativa = await sinopsisGoogleEspanol(ficha);
    if (alternativa && alternativa.descripcion) {
      ficha.description = alternativa.descripcion;
      ficha.sinopsisEnEspanol = true;
      if (alternativa.categorias && alternativa.categorias.length) {
        ficha.categories = alternativa.categorias;
      }
    } else {
      ficha.sinopsisEnEspanol = !texto;
    }
  }

  // 2) Año de la obra original.
  var anioEdicion = primerAnio(ficha.publishedDate);
  var anioOriginal = 0;
  if (articulo) {
    anioOriginal = primerAnio(articulo.descripcion);
    if (!anioOriginal && articulo.qid) anioOriginal = await anioWikidata(articulo.qid);
  }
  if (!anioOriginal) anioOriginal = await anioObraOriginal(isbn, ficha);

  ficha.anioEdicion = anioEdicion;
  ficha.anioOriginal = anioOriginal || anioEdicion;

  // 3) Páginas: las trae la edición, o se sacan de otra edición de la obra.
  if (!(Number(ficha.pageCount) > 0)) {
    try {
      var paginas = await paginasDeLibro(isbn, ficha);
      if (paginas.paginas) {
        ficha.pageCount = paginas.paginas;
        ficha.paginasEstimadas = paginas.estimada;
      }
    } catch (e) { /* sin páginas: se guarda el libro igual */ }
  }

  return ficha;
}

/** Todos los libros en cliente: son ~270 filas y ya se descargan para buscar. */
async function cargarLibros() {
  if (cacheLibros) return cacheLibros;

  var snap = await db.ref('libros').get();
  cacheLibros = [];
  snap.forEach(function (hijo) {
    cacheLibros.push({ clave: hijo.key, datos: hijo.val() || {} });
  });
  return cacheLibros;
}

async function buscarEnFirebase(isbn) {
  if (!db) return null;

  var directo = await db.ref('libros/' + isbn).get();
  if (directo.exists()) return { clave: isbn, datos: directo.val() };

  try {
    var consulta = await db.ref('libros').orderByChild('isbn').equalTo(isbn).limitToFirst(1).get();
    if (consulta.exists()) {
      var entrada = Object.entries(consulta.val())[0];
      return { clave: entrada[0], datos: entrada[1] };
    }
    return null;
  } catch (e) {
    // Reglas sin .indexOn: Firebase rechaza la consulta. Se compara en cliente.
    var lista = await cargarLibros();
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].datos.isbn === isbn) return lista[i];
    }
    return null;
  }
}

/**
 * Busca una ficha existente por título y autor. Los libros importados del
 * .mdb no tienen ISBN, así que sin esto un libro que ya está en el catálogo
 * se guardaría otra vez con la clave del ISBN y quedaría duplicado. Al
 * reconocerlo, la lectura se añade a la ficha que ya existe.
 */
async function buscarPorTitulo(info) {
  if (!db) return null;
  var titulo = (info && info.title) || '';
  if (!titulo) return null;

  var autor = limpiarNombreAutor(((info && info.authors) || [])[0] || '');
  var idiomas = idiomasDeLibro(info);
  var libros = await cargarLibros();
  var autores = [];
  try {
    autores = await cargarAutores();
  } catch (e) { /* sin autores solo se compara el título */ }

  var candidatos = libros.filter(function (b) {
    if (!titulosParecidos(titulo, b.datos.titulo)) return false;
    // Misma obra en otro idioma: es otro libro, no una ficha que completar.
    if (!idiomasCompatibles(idiomas, idiomasDeEtiqueta(b.datos.idioma))) return false;

    var coda = b.datos.autor;
    var sinAutor = coda === null || coda === undefined || coda === '';
    if (!autor || sinAutor) return true;

    var ficha = null;
    for (var i = 0; i < autores.length; i++) {
      if (Number(autores[i].coda) === Number(coda)) { ficha = autores[i]; break; }
    }
    return ficha ? mismoAutorFicha(autor, ficha) : false;
  });

  if (candidatos.length === 1) {
    return { clave: candidatos[0].clave, datos: candidatos[0].datos, porTitulo: true };
  }
  if (candidatos.length > 1) return { ambiguo: candidatos };
  return null;
}

async function buscar(isbn) {
  ultimoLibro = null;
  $('resultado').hidden = true;
  estado('Buscando ' + isbn + '…');
  try {
    var info = null;
    var fuente = '';
    try {
      info = await consultarGoogle(isbn);
      if (info) fuente = 'Google Books';
    } catch (e) { /* 429 o red: se prueba Open Library */ }

    if (!info) {
      try {
        info = await consultarOpenLibrary(isbn);
        if (info) fuente = 'Open Library';
      } catch (e) { /* sin datos alternativos */ }
    }

    if (info) {
      try {
        info = await completarFicha(info, isbn);
      } catch (e) { /* se muestra la ficha tal cual llegó */ }
    }

    if (CONFIGURADO && !db) await firebaseListo;
    var existente = await buscarEnFirebase(isbn);
    var ambiguo = null;
    // Los libros importados del .mdb no tienen ISBN: si el título y el autor
    // coinciden con una ficha, esa es la que se completa y la que se relee.
    if (!existente && info) {
      var porTitulo = null;
      try {
        porTitulo = await buscarPorTitulo(info);
      } catch (e) { /* sin base no hay con qué comparar: se guarda como nuevo */ }
      if (porTitulo && porTitulo.ambiguo) ambiguo = porTitulo.ambiguo;
      else if (porTitulo) existente = porTitulo;
    }
    ultimoLibro = { isbn: isbn, info: info, existente: existente, ambiguo: ambiguo };
    mostrar(ultimoLibro);

    var mensaje = fuente
      ? 'Encontrado en ' + fuente + '.'
      : 'Sin datos en Google Books ni Open Library; puedes guardarlo igual.';
    if (existente && existente.porTitulo) {
      var isbnFicha = (existente.datos && existente.datos.isbn) || '';
      mensaje += ' Ya está en tu base en la ficha ' + existente.clave +
        (isbnFicha
          ? ' (con el ISBN ' + isbnFicha + '): el de esta edición no se guarda.'
          : ' (sin ISBN): al guardar se le añade el ISBN sin crear otro libro.');
    }
    if (ambiguo) {
      mensaje += ' Hay ' + ambiguo.length + ' fichas con ese título y autor: elige la buena ' +
        'en la lista antes de guardar.';
    }
    if (info && info.sinopsisEnEspanol === false) {
      mensaje += ' No encontré sinopsis en español para este ISBN.';
    }
    if (info && !(Number(info.pageCount) > 0)) {
      mensaje += ' No encontré el número de páginas: añádelo en la ficha.';
    }
    estado(mensaje);
  } catch (e) {
    estado('Error al buscar: ' + e.message, 'error');
  }
}

/**
 * Enseña los datos del autor antes de guardar el libro. Si ya está en /autores
 * no hay nada que enseñar; si es nuevo, se busca en Wikipedia/Wikidata una sola
 * vez y `guardar()` reutiliza esa ficha en vez de repetir la consulta.
 */
async function mostrarAutorNuevo(nombre) {
  var caja = $('autor-nuevo');
  var texto = $('autor-nuevo-texto');
  var cajaWiki = $('autor-nuevo-wikipedia');
  var enlace = $('autor-nuevo-enlace');
  if (!caja) return;

  var limpio = limpiarNombreAutor(nombre);
  autorPreview = null;
  caja.hidden = true;
  cajaWiki.hidden = true;
  enlace.removeAttribute('href');
  texto.textContent = '';
  if (!limpio || !db) return;

  var lista = [];
  try {
    lista = await cargarAutores();
  } catch (e) {
    return;
  }
  if (buscarAutor(limpio, lista)) return;
  if (limpiarNombreAutor($('f-autor').value) !== limpio) return;

  caja.hidden = false;
  texto.textContent = 'Buscando datos de «' + limpio + '» en Wikipedia…';

  var ficha = null;
  try {
    ficha = await fichaDeAutor(limpio);
  } catch (e) { /* se creará sin datos */ }

  // Si mientras se buscaba se cambió el autor, no se pinta lo viejo.
  if (limpiarNombreAutor($('f-autor').value) !== limpio) return;
  autorPreview = { nombre: limpio, ficha: ficha };

  if (!ficha) {
    texto.textContent = 'Autor nuevo: ' + limpio +
      ' (sin datos en Wikipedia). Se creará al guardar el libro.';
    return;
  }

  var completo = [ficha.nombre, ficha.apellidos].filter(Boolean).join(' ') || limpio;
  var partes = [completo];
  if (ficha.nacionalidad) partes.push(ficha.nacionalidad);
  if (ficha.nacimiento) {
    partes.push(String(ficha.nacimiento) + (ficha.muerte ? '–' + ficha.muerte : ''));
  } else if (ficha.muerte) {
    partes.push('† ' + ficha.muerte);
  }
  if (ficha.sexo) partes.push(ficha.sexo);

  texto.textContent = 'Autor nuevo: ' + partes.join(' · ') +
    '. Se creará al guardar el libro.';

  if (ficha.wikipedia) {
    enlace.href = ficha.wikipedia;
    enlace.textContent = 'Wikipedia: ' + nombreArticuloWikipedia(ficha.wikipedia);
    cajaWiki.hidden = false;
  }
}

/** Sugerencias de idioma y género con lo que ya hay en el catálogo. */
function sugerenciasFicha() {
  var idiomas = Object.keys(IDIOMAS).map(function (c) { return IDIOMAS[c].etiqueta; });
  var generos = {};

  (cacheLibros || []).forEach(function (b) {
    var datos = b.datos || {};
    if (datos.idioma && idiomas.indexOf(datos.idioma) === -1) idiomas.push(datos.idioma);
    if (datos.genero) generos[datos.genero] = true;
  });

  function opciones(valores) {
    return valores.map(function (v) {
      return '<option value="' + escaparHtml(v) + '"></option>';
    }).join('');
  }

  $('lista-idiomas').innerHTML = opciones(idiomas);
  $('lista-generos').innerHTML = opciones(Object.keys(generos).sort(function (a, b) {
    return a.localeCompare(b, 'es');
  }));
}

function mostrar(libro) {
  ultimoLibro = libro;
  var v = libro.info || {};

  var titulo = v.title || '';
  $('titulo').textContent = titulo || '(sin datos de Google Books)';
  $('autores').textContent = (v.authors || []).join(' · ');

  // El artículo de Wikipedia solo existe si se encontró al buscar la sinopsis.
  var cajaWiki = $('wikipedia-caja');
  var enlaceWiki = $('wikipedia-enlace');
  if (v.wikipedia) {
    enlaceWiki.href = v.wikipedia;
    enlaceWiki.textContent = 'Wikipedia: ' +
      (nombreArticuloWikipedia(v.wikipedia) || 'artículo del libro');
    cajaWiki.hidden = false;
  } else {
    enlaceWiki.removeAttribute('href');
    cajaWiki.hidden = true;
  }

  var portada = v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail);
  var img = $('portada');
  if (portada) {
    img.src = portada.replace(/^http:/, 'https:');
    img.hidden = false;
  } else {
    img.hidden = true;
    img.removeAttribute('src');
  }

  // La tarjeta se puede corregir (año de la obra, páginas…) antes de guardar.
  var anio = v.anioOriginal || primerAnio(v.publishedDate);
  $('f-titulo').value = titulo;
  $('f-autor').value = (v.authors || [])[0] || '';
  $('f-anio').value = anio || '';
  $('f-anioedicion').value = v.anioEdicion && v.anioEdicion !== anio ? v.anioEdicion : '';
  $('f-npaginas').value = v.pageCount || '';
  $('f-idioma').value = v.idioma || '';
  $('f-genero').value = (v.categories || [])[0] || '';
  $('f-nota').value = typeof v.averageRating === 'number' ? v.averageRating : '';
  $('f-sinopsis').value = textoPlano(v.description);

  var notaPaginas = $('paginas-nota');
  notaPaginas.textContent = v.paginasEstimadas ? 'de otra edición' : '';
  notaPaginas.hidden = !v.paginasEstimadas;

  sugerenciasFicha();

  // Si el autor no está todavía en /autores, se enseña su ficha antes de guardar.
  mostrarAutorNuevo($('f-autor').value);

  var enBase = 'no';
  if (libro.existente && libro.existente.porTitulo) {
    var isbnFicha = libro.existente.datos && libro.existente.datos.isbn;
    enBase = 'sí (' + libro.existente.clave + (isbnFicha ? ', ISBN ' + isbnFicha : ', sin ISBN') + ')';
  } else if (libro.existente) {
    enBase = 'sí (' + libro.existente.clave + ')';
  } else if (libro.ambiguo) {
    enBase = libro.ambiguo.length + ' fichas con ese título';
  }

  var filas = [
    ['ISBN', libro.isbn],
    ['Editorial', v.publisher],
    ['En tu base', enBase]
  ];

  $('datos').innerHTML = filas
    .filter(function (f) { return f[1] !== undefined && f[1] !== null && f[1] !== ''; })
    .map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + escaparHtml(f[1]) + '</dd>'; })
    .join('');

  // Varias fichas con el mismo título y autor: no se adivina, se elige.
  var caja = $('existente-caja');
  var lista = $('existente-lista');
  if (libro.ambiguo && libro.ambiguo.length) {
    lista.innerHTML = '<option value="">— Guardar como libro nuevo —</option>' +
      libro.ambiguo.map(function (b) {
        var anioFicha = b.datos.año || b.datos.añoEdicion;
        return '<option value="' + escaparHtml(b.clave) + '">' + escaparHtml(b.clave) +
          ' — ' + escaparHtml(b.datos.titulo || 'sin título') +
          (anioFicha ? ' (' + escaparHtml(anioFicha) + ')' : '') + '</option>';
      }).join('');
    lista.value = '';
    caja.hidden = false;
  } else {
    lista.innerHTML = '';
    caja.hidden = true;
  }

  var boton = $('btn-guardar');
  if (libro.existente && libro.existente.porTitulo) {
    boton.textContent = 'Añadir el ISBN a esa ficha';
  } else if (libro.existente) {
    boton.textContent = 'Actualizar en Firebase';
  } else {
    boton.textContent = 'Guardar en Firebase';
  }
  $('resultado').hidden = false;

  // La lectura necesita el libro ya en la base: hasta entonces, el botón espera.
  // Con una ficha existente se muestran además sus lecturas anteriores.
  prepararLectura(libro.existente ? libro.existente.clave : '');
}

/* ---------- Firebase ---------- */

async function iniciarFirebase() {
  if (!CONFIGURADO) return;
  try {
    var base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
    await cargarScript(base + 'firebase-app-compat.js');
    await cargarScript(base + 'firebase-database-compat.js');
    await cargarScript(base + 'firebase-auth-compat.js');
    firebase.initializeApp(CONFIG);
    db = firebase.database();
    try {
      await firebase.auth().signInAnonymously();
    } catch (e) {
      // Si las reglas son abiertas se puede guardar igual; si no, fallará el
      // guardado con PERMISSION_DENIED y ahí se muestra la ayuda.
      console.warn('Firebase: sesión anónima no disponible (' + (e.code || e.message) + ').');
    }
  } catch (e) {
    estado('Firebase no disponible: ' + e.message, 'error');
  }
}

/*
 * Reserva un id numérico. En /meta se guarda el ÚLTIMO id usado, así que la
 * transacción incrementa antes de devolver: dos pestañas nunca reciben el mismo.
 */
async function siguienteId(nombre) {
  var ref = db.ref('meta/' + nombre);
  var inicial = await valorInicial(nombre);
  var resultado = await ref.transaction(function (ultimo) {
    return (typeof ultimo === 'number' ? ultimo : inicial) + 1;
  });
  return resultado.snapshot.val();
}

async function valorInicial(nombre) {
  if (!metaInicial) metaInicial = {};
  if (metaInicial[nombre]) return metaInicial[nombre];

  var mapa = {
    ultimoCodl: ['libros', 'codl'],
    ultimoCoda: ['autores', null],
    ultimoCodlec: ['lecturas', 'codlec']
  };
  var def = mapa[nombre];
  var snap = await db.ref(def[0]).get();
  var maximo = 0;
  snap.forEach(function (hijo) {
    var datos = hijo.val() || {};
    var n = def[1] ? Number(datos[def[1]]) : Number(hijo.key);
    if (Number.isFinite(n) && n > maximo) maximo = n;
  });
  metaInicial[nombre] = maximo;
  return maximo;
}

/* ---------- autores ---------- */

var TIPO_AUTOR = /(escritor|novelista|poeta|poetisa|dramaturg|ensayista|cuentista|guionista|periodista|traductor|traductora|biógrafo|biógrafa|historiador|filósofo|filósofa)/i;

var SEXOS_WIKIDATA = {
  Q6581097: 'varón',
  Q44148: 'varón',
  Q6581072: 'mujer',
  Q1097630: 'mujer'
};

/** Descripción corta y Q de Wikidata de los artículos candidatos, sin extractos. */
async function fichasAutores(titulos) {
  try {
    var url = 'https://es.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
      '&prop=description|pageprops&redirects=1&titles=' + encodeURIComponent(titulos.join('|'));
    var r = await fetch(url);
    if (!r.ok) return [];
    var json = await r.json();
    var paginas = (json.query && json.query.pages) || {};
    var redirecciones = {};
    ((json.query && json.query.redirects) || []).forEach(function (x) {
      redirecciones[x.from] = x.to;
    });

    var porTitulo = {};
    Object.keys(paginas).forEach(function (clave) {
      var p = paginas[clave];
      if (!p || p.missing !== undefined) return;
      porTitulo[p.title] = {
        titulo: p.title,
        descripcion: p.description || '',
        qid: (p.pageprops && p.pageprops.wikibase_item) || ''
      };
    });

    var salida = [];
    for (var i = 0; i < titulos.length; i++) {
      var ficha = porTitulo[titulos[i]] || porTitulo[redirecciones[titulos[i]]];
      if (ficha) salida.push(ficha);
    }
    return salida;
  } catch (e) {
    return [];
  }
}

function valoresAfirmacion(entidad, propiedad) {
  var lista = (entidad && entidad.claims && entidad.claims[propiedad]) || [];
  return lista.map(function (afirmacion) {
    return afirmacion.mainsnak && afirmacion.mainsnak.datavalue
      ? afirmacion.mainsnak.datavalue.value
      : null;
  }).filter(Boolean);
}

function idsAfirmacion(entidad, propiedad) {
  return valoresAfirmacion(entidad, propiedad)
    .map(function (valor) { return valor.id; })
    .filter(Boolean);
}

/** Año de una fecha de Wikidata ("+1951-00-00T00:00:00Z" → 1951). */
function anioAfirmacion(entidad, propiedad) {
  var valores = valoresAfirmacion(entidad, propiedad);
  for (var i = 0; i < valores.length; i++) {
    var partes = /^([+-])(\d{4,})/.exec(valores[i].time || '');
    if (partes) return (partes[1] === '-' ? -1 : 1) * Number(partes[2]);
  }
  return 0;
}

async function entidadWikidata(qid) {
  try {
    var url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*' +
      '&props=claims&ids=' + encodeURIComponent(qid);
    var r = await fetch(url);
    if (!r.ok) return null;
    var json = await r.json();
    return (json.entities && json.entities[qid]) || null;
  } catch (e) {
    return null;
  }
}

/** Etiquetas en español (o inglés) de varios Q de golpe. */
async function etiquetasWikidata(ids) {
  var limpios = ids.filter(function (id, i) { return id && ids.indexOf(id) === i; });
  if (!limpios.length) return {};
  try {
    var url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*' +
      '&props=labels&languages=es|en&ids=' + encodeURIComponent(limpios.join('|'));
    var r = await fetch(url);
    if (!r.ok) return {};
    var json = await r.json();
    var entidades = json.entities || {};
    var salida = {};
    Object.keys(entidades).forEach(function (id) {
      var etiquetas = entidades[id].labels || {};
      salida[id] = (etiquetas.es && etiquetas.es.value) ||
        (etiquetas.en && etiquetas.en.value) || '';
    });
    return salida;
  } catch (e) {
    return {};
  }
}

/** El título del artículo tiene que cuadrar con el nombre: evita homónimos. */
function nombreDeAutorCoincide(nombre, titulo) {
  var limpioTitulo = String(titulo || '').replace(/\s*\([^)]*\)\s*$/, '');
  var entrada = tokensNombre(nombre);
  var articulo = tokensNombre(limpioTitulo);
  if (!entrada.length || !articulo.length) return false;

  // Un solo nombre («Homero», «Platón»): solo vale la coincidencia exacta.
  if (entrada.length < 2) return normalizarNombre(nombre) === normalizarNombre(limpioTitulo);

  // El apellido tiene que estar en el título.
  var apellido = entrada[entrada.length - 1];
  if (normalizarNombre(titulo).indexOf(apellido) === -1) return false;

  // Y los nombres del título tienen que estar en la entrada: «Gabriel García
  // Lorca» no puede acabar con la ficha de Federico García Lorca.
  return tokensEncajan(articulo, entrada);
}

/**
 * Parte el nombre en `nombre` y `apellidos`. Manda el título del artículo
 * ("Gabriel García Márquez" → Gabriel / García Márquez); los nombres de
 * Wikidata solo sirven para saber dónde acaba el nombre de pila.
 */
function partirNombre(titulo, pila, familia) {
  var limpio = String(titulo || '').trim().replace(/\s*\([^)]*\)\s*$/, '');
  var partes = limpio.split(/\s+/).filter(Boolean);
  if (partes.length < 2) return { nombre: limpio, apellidos: '' };

  var dePila = normalizarNombre(pila.join(' ')).split(' ').filter(Boolean);
  var corte = 0;
  while (corte < partes.length - 1 &&
    dePila.indexOf(normalizarNombre(partes[corte])) !== -1) {
    corte++;
  }
  if (corte > 0) {
    return { nombre: partes.slice(0, corte).join(' '), apellidos: partes.slice(corte).join(' ') };
  }

  // Sin nombre de pila reconocible: el último apellido de Wikidata, si cuadra.
  var ultimo = partes[partes.length - 1];
  var apellidosWikidata = familia.map(normalizarNombre);
  if (!apellidosWikidata.length || apellidosWikidata.indexOf(normalizarNombre(ultimo)) !== -1) {
    return { nombre: partes.slice(0, -1).join(' '), apellidos: ultimo };
  }

  return { nombre: limpio, apellidos: '' };
}

// Wikidata usa nombres históricos que en el catálogo van de otra forma.
var PAISES_ALIAS = {
  'Reino Unido de Gran Bretaña e Irlanda': 'Reino Unido',
  'Reino Unido de Gran Bretaña e Irlanda del Norte': 'Reino Unido',
  'Estados Unidos de América': 'Estados Unidos',
  'Reino de Inglaterra': 'Inglaterra'
};

// El catálogo guarda a los británicos por su país («Inglaterra», «Gales»…),
// así que «Reino Unido» solo se usa cuando no hay forma de precisar.
var PAISES_UK = {
  Q21: 'Inglaterra',
  Q22: 'Escocia',
  Q25: 'Gales',
  Q26: 'Irlanda del Norte'
};

var GENTILICIOS_UK = [
  [/\b(?:gales|galesa|galeses|galesas)\b/, 'Gales'],
  [/\b(?:escocia|escoces|escocesa|escoceses|escocesas)\b/, 'Escocia'],
  [/\b(?:inglaterra|ingles|inglesa|ingleses|inglesas)\b/, 'Inglaterra'],
  [/\b(?:irlanda del norte|norirlandes|norirlandesa|norirlandeses|norirlandesas)\b/,
    'Irlanda del Norte']
];

/** Si la ciudadanía de Wikidata ya es la de un país británico, esa manda. */
function paisUkDe(ids) {
  for (var i = 0; i < ids.length; i++) {
    if (PAISES_UK[ids[i]]) return PAISES_UK[ids[i]];
  }
  return '';
}

/** «escritor galés», «novelista escocesa»…: el gentilicio de la descripción. */
function paisUkPorDescripcion(descripcion) {
  var texto = normalizarNombre(descripcion);
  for (var i = 0; i < GENTILICIOS_UK.length; i++) {
    if (GENTILICIOS_UK[i][0].test(texto)) return GENTILICIOS_UK[i][1];
  }
  return '';
}

/**
 * País británico del lugar de nacimiento: sube por «ubicado en la entidad
 * administrativa» (P131) desde P19 hasta dar con Inglaterra, Escocia, Gales o
 * Irlanda del Norte. Cuatro saltos bastan para cualquier municipio.
 */
async function paisUkDeNacimiento(entidad) {
  var lugar = idsAfirmacion(entidad, 'P19')[0];
  for (var salto = 0; salto < 4 && lugar; salto++) {
    if (PAISES_UK[lugar]) return PAISES_UK[lugar];
    var sitio = await entidadWikidata(lugar);
    if (!sitio) return '';
    var padres = idsAfirmacion(sitio, 'P131');
    for (var i = 0; i < padres.length; i++) {
      if (PAISES_UK[padres[i]]) return PAISES_UK[padres[i]];
    }
    lugar = padres[0] || '';
  }
  return '';
}

/**
 * Con doble nacionalidad, Wikidata no garantiza el orden: si la descripción
 * del artículo dice "escritora chilena", vale más Chile que el primer país.
 */
function paisPreferido(paises, descripcion) {
  var lista = paises.filter(Boolean);
  if (lista.length < 2) return lista[0] || '';

  var texto = normalizarNombre(descripcion);
  for (var i = 0; i < lista.length; i++) {
    var raiz = normalizarNombre(lista[i]).replace(/[aeiou]$/, '');
    if (raiz.length >= 4 && texto.indexOf(raiz) !== -1) return lista[i];
  }
  return lista[0];
}

/** Sin descripción en el artículo: se mira la ocupación (P106) de Wikidata. */
async function esEscritorWikidata(entidad) {
  var oficios = idsAfirmacion(entidad, 'P106');
  if (!oficios.length) return false;
  var etiquetas = await etiquetasWikidata(oficios);
  for (var i = 0; i < oficios.length; i++) {
    if (TIPO_AUTOR.test(etiquetas[oficios[i]] || '')) return true;
  }
  return false;
}

/**
 * Sexo, país, años y nombre partido de un autor, desde la Wikipedia española y
 * Wikidata. Devuelve null si no hay coincidencia clara: mejor vacío que datos
 * de otra persona.
 */
async function fichaDeAutor(nombre) {
  var titulos = await titulosWikipedia(nombre);
  if (!titulos.length) return null;

  var candidatos = await fichasAutores(titulos.slice(0, 5));
  var ficha = null;
  var sinDescripcion = null;
  for (var i = 0; i < candidatos.length; i++) {
    var c = candidatos[i];
    if (!c.qid || !nombreDeAutorCoincide(nombre, c.titulo)) continue;
    if (c.descripcion && TIPO_AUTOR.test(c.descripcion)) {
      ficha = c;
      break;
    }
    // Muchos artículos no traen descripción corta: esos se deciden por la
    // ocupación que declara Wikidata, no por lo que diga el título.
    if (!c.descripcion && !sinDescripcion) sinDescripcion = c;
  }
  if (!ficha) ficha = sinDescripcion;
  if (!ficha) return null;

  var entidad = await entidadWikidata(ficha.qid);
  if (!entidad) return null;
  if (!ficha.descripcion && !(await esEscritorWikidata(entidad))) return null;

  var paises = idsAfirmacion(entidad, 'P27');
  var pila = idsAfirmacion(entidad, 'P735');
  var familia = idsAfirmacion(entidad, 'P734');
  var sexo = idsAfirmacion(entidad, 'P21')[0] || '';
  var etiquetas = await etiquetasWikidata(paises.concat(pila, familia));

  var nombresPila = pila.map(function (id) { return etiquetas[id]; }).filter(Boolean);
  var apellidosWikidata = familia.map(function (id) { return etiquetas[id]; }).filter(Boolean);
  var partido = partirNombre(ficha.titulo, nombresPila, apellidosWikidata);
  var pais = paisPreferido(paises.map(function (id) { return etiquetas[id]; }), ficha.descripcion);
  pais = PAISES_ALIAS[pais] || pais;

  // «Reino Unido» a secas solo cuando no haya forma de precisar el país.
  if (pais === 'Reino Unido') {
    pais = paisUkDe(paises) ||
      paisUkPorDescripcion(ficha.descripcion) ||
      (await paisUkDeNacimiento(entidad)) ||
      pais;
  }

  return {
    nombre: partido.nombre,
    apellidos: partido.apellidos,
    nacionalidad: pais,
    nacimiento: anioAfirmacion(entidad, 'P569') || null,
    muerte: anioAfirmacion(entidad, 'P570') || null,
    sexo: SEXOS_WIKIDATA[sexo] || '',
    // Solo para el aviso previo; /autores no guarda este campo.
    wikipedia: urlWikipedia(ficha.titulo)
  };
}

/**
 * ¿La entrada es la misma persona que la ficha? En /autores el campo `autor`
 * guarda a veces solo el apellido («Pérez-Reverte»), así que comparar cadenas
 * no basta: «Arturo Pérez-Reverte» tiene que cuadrar por tokens.
 */
function mismoAutorFicha(entrada, ficha) {
  var e = tokensNombre(entrada);
  if (!e.length) return false;

  if (ficha.autor && normalizarNombre(entrada) === normalizarNombre(ficha.autor)) return true;
  var completo = [ficha.nombre, ficha.apellidos].filter(Boolean).join(' ');
  if (completo && normalizarNombre(entrada) === normalizarNombre(completo)) return true;

  var apellidos = tokensNombre(ficha.apellidos);
  var nombre = tokensNombre(ficha.nombre);
  if (!apellidos.length) {
    // Sin nombre partido, `autor` es la única forma conocida.
    apellidos = tokensNombre(ficha.autor);
    nombre = [];
  }
  if (!apellidos.length) return false;

  // La cola de la entrada tiene que empezar los apellidos («Pérez-Reverte» ⊂
  // «Pérez-Reverte Gutiérrez») y lo que quede delante son los nombres.
  for (var largo = Math.min(e.length, apellidos.length); largo >= 1; largo--) {
    var cola = e.slice(e.length - largo);
    var igual = true;
    for (var i = 0; i < largo; i++) {
      if (cola[i] !== apellidos[i]) { igual = false; break; }
    }
    if (igual && tokensEncajan(e.slice(0, e.length - largo), nombre)) return true;
  }
  return false;
}

async function cargarAutores() {
  if (autoresCache) return autoresCache;
  var snap = await db.ref('autores').get();
  autoresCache = [];
  snap.forEach(function (hijo) {
    var a = hijo.val() || {};
    var coda = Number(hijo.key);
    if (!coda) return;
    autoresCache.push({
      coda: coda,
      autor: a.autor || '',
      nombre: a.nombre || '',
      apellidos: a.apellidos || ''
    });
  });
  return autoresCache;
}

/** Ficha existente del autor, o null si no hay ninguna o hay varias. */
function buscarAutor(nombre, lista) {
  var encontrados = lista.filter(function (a) { return mismoAutorFicha(nombre, a); });
  // Dos autores con el mismo apellido: mejor no adivinar cuál es.
  return encontrados.length === 1 ? encontrados[0] : null;
}

/**
 * Crea el autor si no existe. `ficha` permite pasar los datos ya buscados para
 * el aviso previo: `undefined` los busca aquí y `null` son «sin datos».
 */
async function asegurarAutor(nombre, ficha) {
  // "Pérez-Reverte, Arturo" → "Arturo Pérez-Reverte".
  var limpio = limpiarNombreAutor(nombre);
  if (!limpio) return { coda: null, notas: '' };

  var lista = await cargarAutores();
  var existente = buscarAutor(limpio, lista);
  if (existente) return { coda: existente.coda, notas: '' };

  if (ficha === undefined) {
    estado('Buscando datos del autor «' + limpio + '»…');
    try {
      ficha = await fichaDeAutor(limpio);
    } catch (e) { /* se crea sin datos */ }
  }

  var coda = await siguienteId('ultimoCoda');
  await db.ref('autores/' + coda).set({
    coda: coda,
    nombre: (ficha && ficha.nombre) || limpio,
    apellidos: (ficha && ficha.apellidos) || '',
    autor: limpio,
    nacionalidad: (ficha && ficha.nacionalidad) || '',
    nacimiento: (ficha && ficha.nacimiento) || null,
    muerte: (ficha && ficha.muerte) || null,
    sexo: (ficha && ficha.sexo) || '',
    // El artículo hallado al crearlo: la ficha del autor lo enseña sin buscar.
    wikipedia: (ficha && ficha.wikipedia) || ''
  });
  lista.push({
    coda: coda,
    autor: limpio,
    nombre: (ficha && ficha.nombre) || limpio,
    apellidos: (ficha && ficha.apellidos) || ''
  });

  var datos = [];
  if (ficha && ficha.nacionalidad) datos.push(ficha.nacionalidad);
  if (ficha && ficha.nacimiento) {
    datos.push(String(ficha.nacimiento) + (ficha.muerte ? '–' + ficha.muerte : ''));
  }
  if (ficha && ficha.sexo) datos.push(ficha.sexo);

  return {
    coda: coda,
    notas: ' Autor nuevo: ' + limpio +
      (datos.length ? ' (' + datos.join(', ') + ').' : ' (sin datos en Wikipedia).')
  };
}

/* Campos de una ficha y su nombre en los mensajes. `comentario`, `codl` y
   `actualizado` quedan fuera: no son datos del ISBN escaneado. */
var CAMPOS_FICHA = {
  isbn: 'ISBN',
  titulo: 'título',
  'año': 'año original',
  añoEdicion: 'año de la edición',
  npaginas: 'páginas',
  nota: 'nota media',
  idioma: 'idioma',
  genero: 'género',
  sinopsis: 'sinopsis',
  autor: 'autor',
  portada: 'portada',
  wikipedia: 'Wikipedia'
};

/**
 * Une lo escaneado con una ficha que ya está en el catálogo sin pisar nada:
 * solo devuelve los campos que la ficha tenía vacíos.
 */
function cambiosConservadores(previo, datos) {
  var cambios = {};
  Object.keys(CAMPOS_FICHA).forEach(function (campo) {
    var nuevo = datos[campo];
    if (nuevo === null || nuevo === undefined || nuevo === '') return;
    var viejo = previo[campo];
    if (viejo === null || viejo === undefined || viejo === '') cambios[campo] = nuevo;
  });
  return cambios;
}

async function guardar() {
  if (!ultimoLibro) return;
  if (!db && CONFIGURADO) await firebaseListo;
  if (!db) {
    estado('Firebase no está configurado: completa firebase-config.js.', 'error');
    return;
  }

  // Se guarda lo que hay en la tarjeta, no lo que devolvió la búsqueda: el
  // usuario puede haber corregido el año de la obra, las páginas, etc.
  var titulo = valorTexto('f-titulo');
  var anioOriginal = valorNumero('f-anio');
  var anioEdicion = valorNumero('f-anioedicion');
  var npaginas = valorNumero('f-npaginas');
  var nota = valorNumero('f-nota');

  var problema = validarFicha(titulo, anioOriginal, anioEdicion, npaginas, nota);
  if (problema) {
    estado(problema, 'error');
    return;
  }

  var boton = $('btn-guardar');
  boton.disabled = true;
  estado('Guardando…');

  try {
    var isbn = ultimoLibro.isbn;
    var v = ultimoLibro.info || {};
    var nombreAutor = valorTexto('f-autor');
    var limpioAutor = limpiarNombreAutor(nombreAutor);
    var fichaAutor = autorPreview && autorPreview.nombre === limpioAutor
      ? autorPreview.ficha
      : undefined;
    var autor = await asegurarAutor(nombreAutor, fichaAutor);
    var portada = (v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || '';

    var datos = {
      isbn: isbn,
      titulo: titulo,
      'año': anioOriginal,
      añoEdicion: anioEdicion && anioEdicion !== anioOriginal ? anioEdicion : null,
      npaginas: npaginas,
      nota: nota,
      idioma: valorTexto('f-idioma'),
      genero: valorTexto('f-genero'),
      comentario: '',
      sinopsis: valorTexto('f-sinopsis'),
      autor: autor.coda || null,
      portada: portada.replace(/^http:/, 'https:'),
      actualizado: firebase.database.ServerValue.TIMESTAMP
    };

    // Solo se escribe si se encontró: rescanear sin artículo no borra el enlace.
    if (v.wikipedia) datos.wikipedia = v.wikipedia;

    // Si ya existía bajo otra clave (p. ej. un codl importado), se actualiza esa.
    var existente = ultimoLibro.existente;
    if (!existente) {
      var elegida = $('existente-lista').value;
      if (elegida) existente = { clave: elegida, porTitulo: true };
    }
    var clave = existente ? existente.clave : isbn;
    var ref = db.ref('libros/' + clave);
    var previo = (await ref.get()).val();

    // Una ficha del catálogo (clave codl) manda: solo se le rellenan los huecos.
    // Nunca se pisan título, sinopsis, comentario ni el ISBN que ya tuviera.
    var cambios = datos;
    var mensaje = 'Libro guardado.';
    if (!previo) {
      datos.codl = await siguienteId('ultimoCodl');
    } else if (String(clave) !== String(isbn)) {
      cambios = cambiosConservadores(previo, datos);
      var puestos = Object.keys(cambios).map(function (c) { return CAMPOS_FICHA[c]; });
      if (puestos.length) {
        cambios.actualizado = firebase.database.ServerValue.TIMESTAMP;
        mensaje = 'Ficha ' + clave + ' completada: ' + puestos.join(', ') + '.';
      } else {
        mensaje = 'La ficha ' + clave + ' ya tenía todos esos datos: no se ha cambiado nada.';
      }
      if (previo.isbn && String(previo.isbn) !== String(isbn)) {
        mensaje += ' Conserva su ISBN (' + previo.isbn + ').';
      }
    } else {
      mensaje = 'Libro actualizado.';
    }

    if (Object.keys(cambios).length) await ref.update(cambios);
    cacheLibros = null;
    mensaje += autor.notas;

    ultimoLibro.existente = { clave: clave };
    ultimoLibro.ambiguo = null;
    $('existente-caja').hidden = true;
    $('existente-lista').innerHTML = '';
    // El autor ya está creado: el aviso previo deja de tener sentido.
    autorPreview = null;
    $('autor-nuevo').hidden = true;
    $('btn-guardar').textContent = 'Actualizar en Firebase';
    estado(mensaje, 'ok');
    prepararLectura(clave);
  } catch (e) {
    var ayuda = e && e.code === 'PERMISSION_DENIED'
      ? 'Sin permiso: publica database.rules.json y habilita el acceso anónimo.'
      : (e.message || e.code || 'error desconocido');
    estado('No se pudo guardar: ' + ayuda, 'error');
  } finally {
    boton.disabled = false;
  }
}

/* ---------- lecturas ---------- */

// Todas las lecturas del catálogo, agrupadas por clave de libro. Se leen una
// vez (~300 filas) y se mantienen al día al registrar.
var lecturasPorLibro = null;

function fechaCorta(iso) {
  var partes = String(iso || '').split('-');
  return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : '';
}

/** Una lectura en curso no cuenta como leída hasta que tiene fechaFin. */
function lecturaEnCurso(le) {
  return !!le.fechaInicio && !le.fechaFin;
}

function ordenarLecturas(lista) {
  lista.sort(function (a, b) {
    var fa = a.fechaInicio || a.fechaFin || '';
    var fb = b.fechaInicio || b.fechaFin || '';
    return String(fb).localeCompare(String(fa));
  });
  return lista;
}

async function leerLecturas() {
  if (!lecturasPorLibro) {
    var porLibro = {};
    var snap = await db.ref('lecturas').get();
    snap.forEach(function (hijo) {
      var le = hijo.val() || {};
      // Las filas antiguas sin fechaInicio siguen contando como leídas.
      if (!le.libro) return;
      var clave = String(le.libro);
      if (!porLibro[clave]) porLibro[clave] = [];
      porLibro[clave].push(le);
    });
    Object.keys(porLibro).forEach(function (clave) { ordenarLecturas(porLibro[clave]); });
    lecturasPorLibro = porLibro;
  }
  return lecturasPorLibro;
}

function lecturasDe(clave) {
  return (lecturasPorLibro && lecturasPorLibro[String(clave)]) || [];
}

/** Lecturas que ya cuentan: acabadas, o las antiguas que no tienen fechas. */
function lecturasHechas(clave) {
  return lecturasDe(clave).filter(function (le) { return !lecturaEnCurso(le); });
}

/**
 * «Ver lecturas previas» y, debajo, cuándo se leyó por última vez. Se pinta al
 * encontrar el libro (aunque no se guarde) y al registrar una lectura.
 */
function pintarLecturasPrevias(clave) {
  var boton = $('btn-previas');
  var ultima = $('ultima-lectura');
  var lista = $('lista-previas');
  var hechas = clave ? lecturasHechas(clave) : [];

  lista.hidden = true;
  lista.innerHTML = '';
  boton.hidden = !hechas.length;
  ultima.hidden = !hechas.length;
  if (!hechas.length) return;

  var veces = hechas.length;
  boton.textContent = 'Ver lecturas previas (' + veces + ')';

  var conFecha = hechas.filter(function (le) { return le.fechaFin || le.fechaInicio; })
    .sort(function (a, b) {
      return String(b.fechaFin || b.fechaInicio).localeCompare(String(a.fechaFin || a.fechaInicio));
    });

  if (!conFecha.length) {
    ultima.textContent = 'Leído ' + veces + (veces === 1 ? ' vez' : ' veces') +
      ', sin fechas registradas.';
  } else {
    var leido = conFecha[0];
    var texto = 'Leído ' + veces + (veces === 1 ? ' vez' : ' veces') + '. Última lectura: ' +
      fechaCorta(leido.fechaFin || leido.fechaInicio);
    if (leido.fechaInicio && leido.fechaFin) {
      texto += ' (del ' + fechaCorta(leido.fechaInicio) + ' al ' + fechaCorta(leido.fechaFin) + ')';
    }
    ultima.textContent = texto;
  }

  lista.innerHTML = hechas.map(function (le) {
    var fechas = 'Sin fechas';
    if (le.fechaInicio && le.fechaFin) {
      fechas = 'Del ' + fechaCorta(le.fechaInicio) + ' al ' + fechaCorta(le.fechaFin);
    } else if (le.fechaFin) {
      fechas = 'Acabado el ' + fechaCorta(le.fechaFin);
    } else if (le.fechaInicio) {
      fechas = 'Empezado el ' + fechaCorta(le.fechaInicio);
    }
    return '<li>' + escaparHtml(fechas) +
      (le.formato ? ' · ' + escaparHtml(le.formato) : '') + '</li>';
  }).join('');
}

/**
 * Prepara la caja «Empezar a leer»: solo se puede usar con el libro ya
 * guardado, y no deja empezar una segunda lectura si hay una en curso.
 */
async function prepararLectura(clave) {
  $('lectura-form').hidden = true;
  $('btn-empezar').hidden = false;
  $('btn-empezar').disabled = true;
  pintarLecturasPrevias(null);

  if (!clave) {
    $('lectura-aviso').textContent = 'Guarda el libro para poder registrar una lectura.';
    return;
  }
  if (!CONFIGURADO) {
    $('lectura-aviso').textContent = 'Sin Firebase no se pueden registrar lecturas.';
    return;
  }
  if (!db) await firebaseListo;

  $('lectura-aviso').textContent = 'Comprobando lecturas…';
  try {
    await leerLecturas();
    pintarLecturasPrevias(clave);
    var enCurso = lecturasDe(clave).filter(lecturaEnCurso)[0];
    if (enCurso) {
      $('lectura-aviso').textContent = 'Ya hay una lectura en curso de este libro, empezada el ' +
        fechaCorta(enCurso.fechaInicio) + '. Puedes darla por acabada en la biblioteca.';
      $('btn-empezar').hidden = true;
      return;
    }
    $('lectura-aviso').textContent = 'Puedes empezar a leerlo hoy o cambiar la fecha si lo ' +
      'empezaste antes.';
    $('btn-empezar').disabled = false;
  } catch (e) {
    $('lectura-aviso').textContent = 'No pude comprobar las lecturas (' + (e.message || e) +
      '); puedes intentarlo igualmente.';
    $('btn-empezar').disabled = false;
  }
}

function empezarLectura() {
  if (!ultimoLibro || !ultimoLibro.existente) {
    estado('Guarda el libro antes de registrar la lectura.', 'error');
    return;
  }
  $('fecha-inicio').value = hoy();
  $('fecha-fin').value = '';
  $('fecha-inicio').max = hoy();
  $('fecha-fin').max = hoy();
  $('lectura-form').hidden = false;
  $('btn-empezar').hidden = true;
  $('fecha-inicio').focus();
}

async function registrarLectura() {
  if (!ultimoLibro || !ultimoLibro.existente) return;
  if (!db && CONFIGURADO) await firebaseListo;
  if (!db) {
    estado('Firebase no está configurado: completa firebase-config.js.', 'error');
    return;
  }

  var clave = ultimoLibro.existente.clave;
  var inicio = $('fecha-inicio').value || hoy();
  var fin = $('fecha-fin').value || '';
  if (fin && fin < inicio) {
    estado('La fecha de fin no puede ser anterior a la de inicio.', 'error');
    return;
  }

  var boton = $('btn-registrar-lectura');
  boton.disabled = true;
  estado('Registrando lectura…');

  try {
    await leerLecturas();
    if (lecturasDe(clave).some(lecturaEnCurso)) {
      $('lectura-form').hidden = true;
      $('btn-empezar').hidden = true;
      $('lectura-aviso').textContent = 'Ya hay una lectura en curso de este libro.';
      estado('Este libro ya tiene una lectura en curso.', 'error');
      return;
    }

    var codlec = await siguienteId('ultimoCodlec');
    var lectura = {
      codlec: codlec,
      fechaInicio: inicio,
      fechaFin: fin || null,
      formato: $('formato').value,
      libro: clave
    };
    await db.ref('lecturas/' + codlec).set(lectura);

    if (!lecturasPorLibro[String(clave)]) lecturasPorLibro[String(clave)] = [];
    lecturasPorLibro[String(clave)].push(lectura);
    ordenarLecturas(lecturasPorLibro[String(clave)]);
    pintarLecturasPrevias(clave);

    $('lectura-form').hidden = true;
    $('btn-empezar').hidden = true;
    $('lectura-aviso').textContent = fin
      ? 'Lectura registrada: del ' + fechaCorta(inicio) + ' al ' + fechaCorta(fin) + '.'
      : 'Lectura en curso desde el ' + fechaCorta(inicio) + '.';
    estado(fin
      ? 'Lectura registrada.'
      : 'Lectura empezada: aparecerá en «En curso» de la biblioteca.', 'ok');
  } catch (e) {
    var ayuda = e && e.code === 'PERMISSION_DENIED'
      ? 'Sin permiso: publica database.rules.json y habilita el acceso anónimo.'
      : (e.message || e.code || 'error desconocido');
    estado('No se pudo registrar la lectura: ' + ayuda, 'error');
  } finally {
    boton.disabled = false;
  }
}

/* ---------- cámara y fotos ---------- */

// Zona del fotograma que se manda al OCR, en proporción al vídeo. La misma
// proporción dibuja el recuadro en la vista previa.
var RECORTE_OCR = { x: 0.1, y: 0.38, ancho: 0.8, alto: 0.24 };

function crearGuiaOcr() {
  var capas = document.createDocumentFragment();
  var mascara = document.createElement('div');
  mascara.id = 'mascara-ocr';
  var guia = document.createElement('div');
  guia.id = 'guia-ocr';
  // Capa de toque: encima del vídeo, que en iOS se traga los clics.
  var disparo = document.createElement('div');
  disparo.id = 'disparo-ocr';
  capas.appendChild(mascara);
  capas.appendChild(guia);
  capas.appendChild(disparo);
  return capas;
}

/** El vídeo puede ir centrado y con otro tamaño que su caja: se mide y se encaja. */
function colocarGuiaOcr() {
  var video = $('camara').querySelector('video.video-ocr');
  var guia = $('guia-ocr');
  var mascara = $('mascara-ocr');
  if (!video || !guia || !mascara) return;

  var v = video.getBoundingClientRect();
  var c = $('camara').getBoundingClientRect();
  var izq = v.left - c.left + v.width * RECORTE_OCR.x;
  var arriba = v.top - c.top + v.height * RECORTE_OCR.y;
  var ancho = v.width * RECORTE_OCR.ancho;
  var alto = v.height * RECORTE_OCR.alto;

  guia.style.left = Math.round(izq) + 'px';
  guia.style.top = Math.round(arriba) + 'px';
  guia.style.width = Math.round(ancho) + 'px';
  guia.style.height = Math.round(alto) + 'px';

  // Los cuatro bordes de la máscara son las distancias hasta el recuadro.
  mascara.style.borderWidth = [
    Math.max(0, Math.round(arriba)),
    Math.max(0, Math.round(c.width - izq - ancho)),
    Math.max(0, Math.round(c.height - arriba - alto)),
    Math.max(0, Math.round(izq))
  ].join('px ') + 'px';
}

function iniciarCamara() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    estado('La cámara necesita HTTPS o localhost (no funciona con file://).', 'error');
    return;
  }
  if (escaneando) return;

  detenerCamaraOcr();
  estado('Iniciando cámara…');
  $('camara').hidden = false;

  Quagga.init({
    inputStream: {
      name: 'Live',
      type: 'LiveStream',
      target: $('camara'),
      constraints: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    },
    locator: { patchSize: 'medium', halfSample: false },
    decoder: { readers: ['ean_reader'] },
    locate: true
  }, function (err) {
    if (err) {
      estado('No se pudo abrir la cámara: ' + (err.message || err), 'error');
      $('camara').hidden = true;
      return;
    }
    Quagga.start();
    escaneando = true;
    $('btn-camara').disabled = true;
    $('btn-detener').hidden = false;
    estado('Apunta al código de barras del libro.');
  });
}

function detenerCamara() {
  if (!escaneando) return;
  escaneando = false;
  try { Quagga.stop(); } catch (e) { /* ya estaba detenida */ }
  $('btn-camara').disabled = false;
  $('btn-detener').hidden = true;
  $('camara').hidden = true;
}

/**
 * Cámara para fotografiar el número impreso (OCR): vista previa y botón para
 * capturar al momento, sin pasar por el selector de archivos.
 */
async function iniciarCamaraOcr() {
  if (ocrOcupado) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    estado('La cámara necesita HTTPS o localhost (no funciona con file://).', 'error');
    return;
  }

  detenerCamara();
  estado('Iniciando cámara…');
  $('btn-ocr-camara').disabled = true;

  try {
    camaraOcr = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });

    var video = document.createElement('video');
    video.className = 'video-ocr';
    video.title = 'Toca para hacer la foto';
    video.setAttribute('playsinline', '');
    video.muted = true;
    video.autoplay = true;
    video.srcObject = camaraOcr;

    $('camara').innerHTML = '';
    $('camara').appendChild(video);
    $('camara').appendChild(crearGuiaOcr());
    $('camara').hidden = false;

    await video.play();
    colocarGuiaOcr();
    $('acciones-foto').hidden = false;
    estado('Encuadra el número en el recuadro y toca la imagen para hacer la foto.');
  } catch (e) {
    detenerCamaraOcr();
    estado('No se pudo abrir la cámara: ' + (e.message || e), 'error');
  }
}

function detenerCamaraOcr() {
  if (camaraOcr) {
    camaraOcr.getTracks().forEach(function (pista) { pista.stop(); });
    camaraOcr = null;
  }
  $('acciones-foto').hidden = true;
  $('btn-ocr-camara').disabled = false;
  // No tocar el vídeo de Quagga si el escáner de códigos está en marcha.
  if (!escaneando) {
    $('camara').innerHTML = '';
    $('camara').hidden = true;
  }
}

async function hacerFotoOcr() {
  if (ocrOcupado) return;

  var video = $('camara').querySelector('video');
  if (!camaraOcr || !video) return;

  // El pestillo se libera siempre en el finally: un fallo al capturar no puede
  // dejar la cámara abierta y sorda a más toques.
  ocrOcupado = true;
  $('btn-foto').disabled = true;
  $('btn-ocr-camara').disabled = true;

  try {
    var archivo = await fotoDelVideo(video);
    detenerCamaraOcr();
    $('btn-ocr-camara').disabled = true;
    estado('Procesando la foto…');
    await textoDesdeArchivo(archivo);
  } catch (e) {
    detenerCamaraOcr();
    estado('No se pudo hacer la foto: ' + (e.message || e), 'error');
  } finally {
    ocrOcupado = false;
    $('btn-foto').disabled = false;
    $('btn-ocr-camara').disabled = false;
  }
}

/** Recorta el recuadro del fotograma actual y lo devuelve como imagen. */
function fotoDelVideo(video) {
  return new Promise(function (resolver, rechazar) {
    if (!video.videoWidth || !video.videoHeight) {
      rechazar(new Error('la cámara aún no está lista, espera un segundo'));
      return;
    }

    var ancho = video.videoWidth;
    var alto = video.videoHeight;
    var origenX = Math.round(ancho * RECORTE_OCR.x);
    var origenY = Math.round(alto * RECORTE_OCR.y);
    var recorteAncho = Math.round(ancho * RECORTE_OCR.ancho);
    var recorteAlto = Math.round(alto * RECORTE_OCR.alto);

    var lienzo = document.createElement('canvas');
    lienzo.width = recorteAncho;
    lienzo.height = recorteAlto;
    lienzo.getContext('2d').drawImage(video,
      origenX, origenY, recorteAncho, recorteAlto,
      0, 0, recorteAncho, recorteAlto);

    lienzo.toBlob(function (blob) {
      if (!blob) {
        rechazar(new Error('no se pudo codificar la imagen'));
        return;
      }
      resolver(blob);
    }, 'image/jpeg', 0.95);
  });
}

function codigoDesdeArchivo(archivo) {
  detenerCamara();
  detenerCamaraOcr();
  estado('Leyendo el código de barras…');
  var url = URL.createObjectURL(archivo);
  Quagga.decodeSingle({
    src: url,
    numOfWorkers: 1,
    locate: true,
    inputStream: { size: 1600 },
    locator: { patchSize: 'medium', halfSample: false },
    decoder: { readers: ['ean_reader'] }
  }, function (resultado) {
    URL.revokeObjectURL(url);
    var codigo = resultado && resultado.codeResult && resultado.codeResult.code;
    if (!codigo) {
      estado('No pude leer el código. Prueba con más luz, sin reflejos y más cerca.', 'error');
      return;
    }
    usarTexto(codigo, 'la foto del código');
  });
}

function cargarImagen(archivo) {
  return new Promise(function (resolver, rechazar) {
    var url = URL.createObjectURL(archivo);
    var img = new Image();
    img.onload = function () { URL.revokeObjectURL(url); resolver(img); };
    img.onerror = function () { URL.revokeObjectURL(url); rechazar(new Error('No pude abrir la imagen')); };
    img.src = url;
  });
}

/** Escala, pasa a grises y estira el contraste: mejora bastante el OCR. */
function prepararLienzo(imagen) {
  var anchoObjetivo = Math.min(2000, Math.max(1200, imagen.naturalWidth));
  var escala = anchoObjetivo / imagen.naturalWidth;
  var lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.naturalWidth * escala);
  lienzo.height = Math.round(imagen.naturalHeight * escala);

  var ctx = lienzo.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

  var datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
  var px = datos.data;
  var total = lienzo.width * lienzo.height;
  var grises = new Uint8Array(total);
  var hist = new Uint32Array(256);

  for (var i = 0, j = 0; i < px.length; i += 4, j++) {
    var g = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
    grises[j] = g;
    hist[g]++;
  }

  var corte = total * 0.02;
  var acumulado = 0, bajo = 0, alto = 255;
  for (var v = 0; v < 256; v++) { acumulado += hist[v]; if (acumulado >= corte) { bajo = v; break; } }
  acumulado = 0;
  for (var w = 255; w >= 0; w--) { acumulado += hist[w]; if (acumulado >= corte) { alto = w; break; } }

  var rango = Math.max(1, alto - bajo);
  for (var k = 0, m = 0; k < px.length; k += 4, m++) {
    var valor = Math.max(0, Math.min(255, Math.round((grises[m] - bajo) * 255 / rango)));
    px[k] = px[k + 1] = px[k + 2] = valor;
    px[k + 3] = 255;
  }
  ctx.putImageData(datos, 0, 0);
  return lienzo;
}

async function obtenerOcr() {
  if (ocrWorker) return ocrWorker;
  estado('Descargando OCR (solo la primera vez, ~10 MB)…');
  await cargarScript(OCR_URL);
  ocrWorker = await Tesseract.createWorker('eng', 1, {
    logger: function (m) {
      if (m.status === 'recognizing text') {
        estado('Leyendo el número… ' + Math.round((m.progress || 0) * 100) + '%');
      }
    }
  });
  await ocrWorker.setParameters({
    tessedit_char_whitelist: '0123456789X',
    tessedit_pageseg_mode: '6'
  });
  return ocrWorker;
}

async function textoDesdeArchivo(archivo) {
  estado('Preparando la imagen…');
  try {
    var imagen = await cargarImagen(archivo);
    var lienzo = prepararLienzo(imagen);
    var worker = await obtenerOcr();

    // Bloque de texto, texto disperso y una sola línea: el recorte suele ser
    // solo el número, así que la tercera pasada es la que mejor lo aísla.
    var modos = ['6', '11', '7'];
    var isbn = null;
    var texto = '';

    for (var i = 0; i < modos.length && !isbn; i++) {
      await worker.setParameters({ tessedit_pageseg_mode: modos[i] });
      var resultado = await worker.recognize(lienzo);
      texto = resultado.data.text || '';
      isbn = resolverIsbn(texto);
    }
    await worker.setParameters({ tessedit_pageseg_mode: '6' });

    if (!isbn) {
      var visto = texto.replace(/\s+/g, ' ').trim().slice(0, 80);
      estado('No pude leer un ISBN válido. Acerca la cámara o mete el número entero en el ' +
        'recuadro.' + (visto ? ' Texto detectado: "' + visto + '"' : ''), 'error');
      return;
    }

    usarTexto(isbn, 'la imagen');
    estado('ISBN leído por OCR. Verifica los datos antes de guardar.', 'ok');
  } catch (e) {
    estado('OCR: ' + e.message, 'error');
  }
}

/* ---------- eventos ---------- */

$('btn-buscar').addEventListener('click', function () {
  usarTexto($('isbn').value, 'el campo');
});

$('isbn').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') usarTexto($('isbn').value, 'el campo');
});

$('btn-camara').addEventListener('click', iniciarCamara);
$('btn-detener').addEventListener('click', detenerCamara);
$('btn-ocr-camara').addEventListener('click', iniciarCamaraOcr);
$('btn-foto').addEventListener('click', hacerFotoOcr);

// Tocar la vista previa también dispara la foto: con el móvil enfocando,
// el botón de abajo queda incómodo.
$('camara').addEventListener('click', function () {
  if (camaraOcr) hacerFotoOcr();
});

$('btn-cancelar-foto').addEventListener('click', function () {
  detenerCamaraOcr();
  estado('');
});
$('btn-guardar').addEventListener('click', guardar);

// La cabecera acompaña a lo que se escribe en la tarjeta.
$('f-titulo').addEventListener('input', function () {
  $('titulo').textContent = this.value.trim() || '(sin título)';
});

$('f-autor').addEventListener('input', function () {
  $('autores').textContent = this.value.trim();
  // Lo que se veía era de otro nombre: se oculta hasta terminar de escribirlo.
  autorPreview = null;
  $('autor-nuevo').hidden = true;
});

// Al salir del campo, se buscan los datos del autor nuevo.
$('f-autor').addEventListener('change', function () {
  mostrarAutorNuevo(this.value);
});

// Con varias fichas iguales, elegir una equivale a haberla encontrado: se
// puede completar esa y registrar la lectura sin crear otro libro.
$('existente-lista').addEventListener('change', function () {
  if (!ultimoLibro) return;
  var clave = this.value;
  ultimoLibro.existente = clave ? { clave: clave, porTitulo: true } : null;
  $('btn-guardar').textContent = clave ? 'Añadir el ISBN a esa ficha' : 'Guardar en Firebase';
  prepararLectura(clave || '');
});

$('archivo-codigo').addEventListener('change', function (e) {
  var archivo = e.target.files[0];
  e.target.value = '';
  if (archivo) codigoDesdeArchivo(archivo);
});

$('btn-empezar').addEventListener('click', empezarLectura);
$('btn-registrar-lectura').addEventListener('click', registrarLectura);
$('btn-previas').addEventListener('click', function (e) {
  e.preventDefault();
  var lista = $('lista-previas');
  lista.hidden = !lista.hidden;
  this.textContent = lista.hidden
    ? 'Ver lecturas previas (' + lista.children.length + ')'
    : 'Ocultar lecturas previas';
});
$('btn-cancelar-lectura').addEventListener('click', function () {
  $('lectura-form').hidden = true;
  $('btn-empezar').hidden = false;
  $('btn-empezar').disabled = false;
});

// Al girar el móvil el vídeo cambia de tamaño: el recuadro se recoloca.
window.addEventListener('resize', colocarGuiaOcr);

Quagga.onDetected(function (datos) {
  if (!escaneando) return;
  var codigo = datos && datos.codeResult && datos.codeResult.code;
  if (!codigo) return;
  if (!resolverIsbn(codigo)) return;
  detenerCamara();
  usarTexto(codigo, 'el código');
});

$('fecha-inicio').value = hoy();
firebaseListo = iniciarFirebase();
