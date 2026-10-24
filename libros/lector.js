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
var autoresCache = null;
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
  var consultas = [];
  [info.title, tituloObra].forEach(function (t) {
    t = tituloBase(t);
    if (t && consultas.indexOf(t) === -1) consultas.push(t);
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
  var autor = (info.authors || [])[0] || '';
  var respaldo = null;
  for (var k = 0; k < fichas.length; k++) {
    if (!esArticuloDeLibro(fichas[k])) continue;
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

  return ficha;
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
    // Reglas sin .indexOn: Firebase rechaza la consulta. Se compara en cliente
    // (268 libros, una sola descarga por sesión).
    if (!cacheLibros) {
      var snap = await db.ref('libros').get();
      cacheLibros = [];
      snap.forEach(function (hijo) {
        cacheLibros.push({ clave: hijo.key, datos: hijo.val() || {} });
      });
    }
    for (var i = 0; i < cacheLibros.length; i++) {
      if (cacheLibros[i].datos.isbn === isbn) return cacheLibros[i];
    }
    return null;
  }
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
    ultimoLibro = { isbn: isbn, info: info, existente: existente };
    mostrar(ultimoLibro);

    var mensaje = fuente
      ? 'Encontrado en ' + fuente + '.'
      : 'Sin datos en Google Books ni Open Library; puedes guardarlo igual.';
    if (info && info.sinopsisEnEspanol === false) {
      mensaje += ' No encontré sinopsis en español para este ISBN.';
    }
    estado(mensaje);
  } catch (e) {
    estado('Error al buscar: ' + e.message, 'error');
  }
}

function mostrar(libro) {
  var v = libro.info || {};
  $('titulo').textContent = v.title || '(sin datos de Google Books)';
  $('autores').textContent = (v.authors || []).join(' · ');

  var portada = v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail);
  var img = $('portada');
  if (portada) {
    img.src = portada.replace(/^http:/, 'https:');
    img.hidden = false;
  } else {
    img.hidden = true;
    img.removeAttribute('src');
  }

  var anio = v.anioOriginal || primerAnio(v.publishedDate);
  var filas = [
    ['ISBN', libro.isbn],
    ['Editorial', v.publisher],
    ['Año', anio || ''],
    ['Edición', v.anioEdicion && v.anioEdicion !== anio ? v.anioEdicion : ''],
    ['Páginas', v.pageCount],
    ['Idioma', v.idioma],
    ['Nota media', v.averageRating],
    ['En tu base', libro.existente ? 'sí (' + libro.existente.clave + ')' : 'no']
  ];

  $('datos').innerHTML = filas
    .filter(function (f) { return f[1] !== undefined && f[1] !== null && f[1] !== ''; })
    .map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + escaparHtml(f[1]) + '</dd>'; })
    .join('');

  var sinopsis = $('sinopsis');
  var texto = textoPlano(v.description);
  sinopsis.textContent = texto;
  sinopsis.hidden = !texto;

  $('btn-guardar').textContent = libro.existente ? 'Actualizar en Firebase' : 'Guardar en Firebase';
  $('resultado').hidden = false;
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

async function asegurarAutor(nombre) {
  var limpio = String(nombre || '').trim();
  if (!limpio) return null;

  if (!autoresCache) {
    var snap = await db.ref('autores').get();
    autoresCache = {};
    snap.forEach(function (hijo) {
      var a = hijo.val() || {};
      var clave = normalizarNombre(a.autor || [a.nombre, a.apellidos].filter(Boolean).join(' '));
      if (clave) autoresCache[clave] = Number(hijo.key);
    });
  }

  var buscado = normalizarNombre(limpio);
  if (autoresCache[buscado]) return autoresCache[buscado];

  var coda = await siguienteId('ultimoCoda');
  await db.ref('autores/' + coda).set({
    coda: coda,
    nombre: limpio,
    apellidos: '',
    autor: limpio,
    nacionalidad: '',
    nacimiento: null,
    muerte: null,
    sexo: ''
  });
  autoresCache[buscado] = coda;
  return coda;
}

async function guardar() {
  if (!ultimoLibro) return;
  if (!db && CONFIGURADO) await firebaseListo;
  if (!db) {
    estado('Firebase no está configurado: completa firebase-config.js.', 'error');
    return;
  }

  var boton = $('btn-guardar');
  boton.disabled = true;
  estado('Guardando…');

  try {
    var isbn = ultimoLibro.isbn;
    var v = ultimoLibro.info || {};
    var autorCoda = await asegurarAutor((v.authors || [])[0] || '');
    var portada = (v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || '';

    // `año` es el de la obra original; el de la edición va aparte, si difiere.
    var anioOriginal = v.anioOriginal || primerAnio(v.publishedDate) || null;
    var anioEdicion = v.anioEdicion && v.anioEdicion !== anioOriginal ? v.anioEdicion : null;

    var datos = {
      isbn: isbn,
      titulo: v.title || '',
      'año': anioOriginal,
      añoEdicion: anioEdicion,
      npaginas: v.pageCount || null,
      nota: typeof v.averageRating === 'number' ? v.averageRating : null,
      idioma: v.idioma || '',
      genero: (v.categories || [])[0] || '',
      comentario: '',
      sinopsis: descripcionDe(v.description),
      autor: autorCoda,
      portada: portada.replace(/^http:/, 'https:'),
      actualizado: firebase.database.ServerValue.TIMESTAMP
    };

    // Si ya existía bajo otra clave (p. ej. un codl importado), se actualiza esa.
    var clave = ultimoLibro.existente ? ultimoLibro.existente.clave : isbn;
    var ref = db.ref('libros/' + clave);
    var previo = (await ref.get()).val();
    if (!previo) datos.codl = await siguienteId('ultimoCodl');
    await ref.update(datos);
    cacheLibros = null;

    var mensaje = previo ? 'Libro actualizado.' : 'Libro guardado.';

    if ($('chk-lectura').checked) {
      var codlec = await siguienteId('ultimoCodlec');
      await db.ref('lecturas/' + codlec).set({
        codlec: codlec,
        fechaInicio: $('fecha-inicio').value || hoy(),
        fechaFin: $('fecha-fin').value || null,
        formato: $('formato').value,
        libro: clave,
        ppm: null
      });
      mensaje += ' Lectura registrada.';
    }

    ultimoLibro.existente = { clave: clave };
    $('btn-guardar').textContent = 'Actualizar en Firebase';
    estado(mensaje, 'ok');
  } catch (e) {
    var ayuda = e && e.code === 'PERMISSION_DENIED'
      ? 'Sin permiso: publica database.rules.json y habilita el acceso anónimo.'
      : (e.message || e.code || 'error desconocido');
    estado('No se pudo guardar: ' + ayuda, 'error');
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
  capas.appendChild(mascara);
  capas.appendChild(guia);
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

  ocrOcupado = true;
  $('btn-foto').disabled = true;

  // Solo el recuadro: fuera quedan el resto de la contraportada y sus textos.
  var ancho = video.videoWidth || 1280;
  var alto = video.videoHeight || 720;
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

  var archivo = await new Promise(function (resolver) {
    lienzo.toBlob(function (blob) {
      resolver(blob ? new File([blob], 'numero.jpg', { type: 'image/jpeg' }) : null);
    }, 'image/jpeg', 0.95);
  });

  detenerCamaraOcr();
  $('btn-ocr-camara').disabled = true;
  estado('Procesando la foto…');

  try {
    if (!archivo) {
      estado('No se pudo capturar la foto.', 'error');
      return;
    }
    await textoDesdeArchivo(archivo);
  } finally {
    ocrOcupado = false;
    $('btn-foto').disabled = false;
    $('btn-ocr-camara').disabled = false;
  }
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

$('archivo-codigo').addEventListener('change', function (e) {
  var archivo = e.target.files[0];
  e.target.value = '';
  if (archivo) codigoDesdeArchivo(archivo);
});

$('chk-lectura').addEventListener('change', function (e) {
  $('campos-lectura').hidden = !e.target.checked;
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
