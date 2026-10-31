/*
 * Ficha de un libro o de un autor: muestra y edita sus datos y enseña, plegadas,
 * las lecturas del libro o las obras del autor.
 *
 * Se abre desde consulta.html con ?libro=<clave> o ?autor=<coda>, y también se
 * puede enlazar directamente. Sin módulos ni bundler, como el resto.
 */
'use strict';

var $ = function (id) { return document.getElementById(id); };

var CONFIG = window.FIREBASE_CONFIG || {};
var CONFIGURADO = typeof CONFIG.databaseURL === 'string' &&
  /^https:\/\//.test(CONFIG.databaseURL) &&
  CONFIG.databaseURL.indexOf('PEGA_') === -1;

var FIREBASE_VERSION = '10.14.1';

var db = null;
var LIBROS = {};   // clave → datos del libro
var AUTORES = {};  // coda → datos del autor
var LECTURAS = []; // todas las filas de /lecturas

var LIBRO = null;  // ficha que se está viendo
var AUTOR = null;
var ESTADO_LIBRO = null;  // valores al cargar, para guardar solo lo cambiado
var ESTADO_AUTOR = null;

/* ---------- utilidades ---------- */

function esc(t) {
  return String(t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function num(v) {
  var n = Number(v);
  return isFinite(n) ? n : 0;
}

function numero(n) {
  return num(n).toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

function fmt(n) {
  return num(n).toLocaleString('es-ES');
}

function fecha(iso) {
  var partes = String(iso || '').split('-');
  if (partes.length !== 3) return '';
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

/** Nombre legible del artículo: .../wiki/El_jugador → «El jugador». */
function nombreArticuloWikipedia(url) {
  var partes = String(url || '').split('/wiki/');
  if (partes.length < 2) return '';
  try {
    return decodeURIComponent(partes[1]).replace(/_/g, ' ');
  } catch (e) {
    return partes[1].replace(/_/g, ' ');
  }
}

function pintarWikipedia(url) {
  var caja = $('wikipedia-caja');
  var enlace = $('wikipedia-enlace');
  if (!caja || !enlace) return;

  if (!url) {
    caja.hidden = true;
    enlace.removeAttribute('href');
    return;
  }

  enlace.href = url;
  enlace.textContent = 'Wikipedia: ' + (nombreArticuloWikipedia(url) || 'artículo del libro');
  caja.hidden = false;
}

/* ---------- Wikipedia del autor ---------- */

/* Las fichas importadas del .mdb no guardan el artículo: `wikipedia` solo lo
   escriben los autores creados desde lector.html. Para las demás se busca una
   vez por sesión y se acepta solo un artículo que se llame como la persona y
   que sea de un escritor (mismo criterio que `fichaDeAutor()` en lector.js). */
var WIKI_AUTOR = {};
var TIPO_AUTOR = /(escritor|novelista|poeta|poetisa|dramaturg|ensayista|cuentista|guionista|periodista|traductor|traductora|biógrafo|biógrafa|historiador|filósofo|filósofa)/i;

/** Palabras comparables: sin acentos, sin mayúsculas, sin puntos ni guiones. */
function tokensTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[\s.\-]+/)
    .filter(Boolean);
}

/** Distancia de edición, para «Dostoievski» ~ «Dostoyevski». */
function distanciaTexto(a, b) {
  var anterior = [];
  for (var j = 0; j <= b.length; j++) anterior[j] = j;

  for (var i = 1; i <= a.length; i++) {
    var actual = [i];
    for (var k = 1; k <= b.length; k++) {
      actual[k] = Math.min(
        anterior[k] + 1,
        actual[k - 1] + 1,
        anterior[k - 1] + (a.charAt(i - 1) === b.charAt(k - 1) ? 0 : 1)
      );
    }
    anterior = actual;
  }
  return anterior[b.length];
}

/** ¿Son la misma palabra? Una inicial vale por el nombre y se toleran erratas. */
function palabraParecida(a, b) {
  if (a === b) return true;
  if (a.length === 1) return b.charAt(0) === a;
  if (b.length === 1) return a.charAt(0) === b;
  return a.length >= 6 && b.length >= 6 && distanciaTexto(a, b) <= 1;
}

/**
 * ¿El artículo se llama como alguna forma del nombre? «Tolkien» casa con
 * «J. R. R. Tolkien», y «Arturo Pérez-Reverte» con «Arturo Pérez-Reverte».
 */
function nombreEnArticulo(variantes, titulo) {
  var articulo = tokensTexto(String(titulo || '').replace(/\s*\([^)]*\)\s*$/, ''));
  if (!articulo.length) return false;

  for (var v = 0; v < variantes.length; v++) {
    var entrada = tokensTexto(variantes[v]);
    if (!entrada.length) continue;

    var apellido = entrada[entrada.length - 1];
    var tieneApellido = false;
    for (var k = 0; k < articulo.length; k++) {
      if (palabraParecida(articulo[k], apellido)) { tieneApellido = true; break; }
    }
    if (!tieneApellido) continue;

    var i = 0;
    for (var j = 0; j < articulo.length && i < entrada.length; j++) {
      if (palabraParecida(articulo[j], entrada[i])) i++;
    }
    if (i === entrada.length) return true;
  }
  return false;
}

function urlArticuloWikipedia(titulo) {
  return 'https://es.wikipedia.org/wiki/' +
    encodeURIComponent(String(titulo || '').replace(/ /g, '_'));
}

async function buscarTitulosWikipedia(consulta) {
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

/** Descripción corta de cada artículo, en el orden pedido. */
async function descripcionesDeArticulos(titulos) {
  var url = 'https://es.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
    '&prop=description&redirects=1&titles=' + encodeURIComponent(titulos.join('|'));
  try {
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
      porTitulo[p.title] = p.description || '';
    });

    var salida = [];
    for (var i = 0; i < titulos.length; i++) {
      var titulo = redirecciones[titulos[i]] || titulos[i];
      salida.push({ titulo: titulo, descripcion: porTitulo[titulo] || '' });
    }
    return salida;
  } catch (e) {
    return [];
  }
}

/** Sin descripción solo vale que el título sea exactamente el nombre. */
function esArticuloDeEscritor(ficha, variantes) {
  if (ficha.descripcion) return TIPO_AUTOR.test(ficha.descripcion);
  var articulo = tokensTexto(ficha.titulo).join(' ');
  for (var i = 0; i < variantes.length; i++) {
    if (tokensTexto(variantes[i]).join(' ') === articulo) return true;
  }
  return false;
}

/** Artículo del autor en la Wikipedia española, o '' si no hay uno claro. */
async function articuloDeAutor(a) {
  if (!a) return '';

  var variantes = [];
  function anadir(texto) {
    texto = String(texto || '').trim();
    if (texto && variantes.indexOf(texto) === -1) variantes.push(texto);
  }

  var completo = [a.nombre, a.apellidos].filter(Boolean).join(' ');
  var apellidos = String(a.apellidos || '').split(/\s+/).filter(Boolean);

  anadir(a.autor);
  anadir(completo);
  // «Pérez-Reverte Gutiérrez» → «Pérez-Reverte»: el artículo suele acortar.
  if (apellidos.length > 1) anadir([a.nombre, apellidos[0]].filter(Boolean).join(' '));
  if (!variantes.length) return '';

  var consultas = [];
  if (a.autor) consultas.push(a.autor);
  if (completo && consultas.indexOf(completo) === -1) consultas.push(completo);

  for (var i = 0; i < consultas.length; i++) {
    var titulos = await buscarTitulosWikipedia(consultas[i]);
    if (!titulos.length) continue;

    var fichas = await descripcionesDeArticulos(titulos.slice(0, 5));
    for (var j = 0; j < fichas.length; j++) {
      if (!nombreEnArticulo(variantes, fichas[j].titulo)) continue;
      if (!esArticuloDeEscritor(fichas[j], variantes)) continue;
      return urlArticuloWikipedia(fichas[j].titulo);
    }
  }
  return '';
}

/** En la ficha del autor va en la cabecera; junto a un libro, sobre su ficha. */
function pintarWikipediaAutor(url, enCabecera) {
  var caja = $('autor-wiki');
  var enlace = $('autor-wiki-enlace');

  if (enCabecera) pintarWikipedia(url);

  if (!caja || !enlace) return;
  if (enCabecera || !url) {
    caja.hidden = true;
    enlace.removeAttribute('href');
    return;
  }

  enlace.href = url;
  enlace.textContent = 'Wikipedia: ' + (nombreArticuloWikipedia(url) || 'artículo del autor');
  caja.hidden = false;
}

async function mostrarWikipediaAutor(enCabecera) {
  if (!AUTOR) return;

  var coda = AUTOR.coda;
  var url = AUTOR.wikipedia || WIKI_AUTOR[coda];
  if (!url) {
    url = await articuloDeAutor(AUTOR);
    // Se recuerda aunque sea '' para no repetir la búsqueda al repintar.
    WIKI_AUTOR[coda] = url;
  }

  // La ficha puede haber cambiado mientras se buscaba.
  if (!AUTOR || AUTOR.coda !== coda) return;
  pintarWikipediaAutor(url, enCabecera);
}

function ms(iso) {
  var partes = String(iso || '').split('-');
  if (partes.length !== 3) return NaN;
  return Date.UTC(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

function diasDe(le) {
  var a = ms(le.fechaInicio);
  var b = ms(le.fechaFin);
  if (!isFinite(a) || !isFinite(b) || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

function lecturaEnCurso(le) {
  return !!le.fechaInicio && !le.fechaFin;
}

function estado(texto, tipo) {
  var el = $('estado');
  el.textContent = texto || '';
  el.className = tipo || '';
  el.hidden = false;
}

function aviso(id, texto, tipo) {
  var el = $(id);
  el.textContent = texto || '';
  el.className = tipo ? 'nota ' + tipo : 'nota';
}

function cargarScript(src) {
  return new Promise(function (resolver, rechazar) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = function () { resolver(); };
    s.onerror = function () { rechazar(new Error('No se pudo cargar ' + src)); };
    document.head.appendChild(s);
  });
}

/* ---------- Firebase ---------- */

async function iniciarFirebase() {
  var base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
  await cargarScript(base + 'firebase-app-compat.js');
  await cargarScript(base + 'firebase-database-compat.js');
  await cargarScript(base + 'firebase-auth-compat.js');
  if (!firebase.apps.length) firebase.initializeApp(CONFIG);
  db = firebase.database();
  try {
    await firebase.auth().signInAnonymously();
  } catch (e) {
    // Las reglas actuales son abiertas; si se publican las de database.rules.json
    // hará falta habilitar el proveedor anónimo.
    console.warn('Firebase: sesión anónima no disponible (' + (e.code || e.message) + ').');
  }
}

async function cargarDatos() {
  var snaps = await Promise.all([
    db.ref('libros').get(),
    db.ref('autores').get(),
    db.ref('lecturas').get()
  ]);

  snaps[0].forEach(function (hijo) {
    var v = hijo.val();
    if (!v) return;
    v.clave = hijo.key;
    LIBROS[hijo.key] = v;
  });

  snaps[1].forEach(function (hijo) {
    var v = hijo.val();
    if (!v) return;
    if (v.coda === undefined) v.coda = Number(hijo.key);
    AUTORES[hijo.key] = v;
  });

  snaps[2].forEach(function (hijo) {
    var v = hijo.val();
    if (v) LECTURAS.push(v);
  });
}

/* ---------- nombres y lecturas ---------- */

function nombreCompletoAutor(coda) {
  var a = AUTORES[String(coda)];
  if (!a) return '';
  return [a.nombre, a.apellidos].filter(Boolean).join(' ') || a.autor || '';
}

/** Nombre para las listas: lo que guarda el campo `autor`, con respaldo. */
function nombreListaAutor(coda) {
  var a = AUTORES[String(coda)];
  if (!a) return '';
  return a.autor || nombreCompletoAutor(coda);
}

function lecturasDe(clave) {
  var filas = LECTURAS.filter(function (le) {
    return String(le.libro) === String(clave);
  });

  filas.sort(function (a, b) {
    // La lectura en curso siempre arriba; después, la más reciente primero.
    var abiertaA = lecturaEnCurso(a);
    var abiertaB = lecturaEnCurso(b);
    if (abiertaA !== abiertaB) return abiertaA ? -1 : 1;
    return String(b.fechaFin || b.fechaInicio || '').localeCompare(
      String(a.fechaFin || a.fechaInicio || ''));
  });

  return filas;
}

function obrasDe(coda) {
  return Object.keys(LIBROS).map(function (clave) {
    return LIBROS[clave];
  }).filter(function (l) {
    return String(l.autor) === String(coda);
  }).sort(function (a, b) {
    return num(a['año']) - num(b['año']) ||
      String(a.titulo || '').localeCompare(String(b.titulo || ''), 'es');
  });
}

/* ---------- tablas ---------- */

function pintarTablaFicha(id, columnas, filas, vacio) {
  var cabecera = '<thead><tr>' + columnas.map(function (c) {
    return '<th' + (c.num ? ' class="num"' : '') + '>' + esc(c.titulo) + '</th>';
  }).join('') + '</tr></thead>';

  var cuerpo;
  if (!filas.length) {
    cuerpo = '<tbody><tr><td colspan="' + columnas.length + '" class="nota">' +
      esc(vacio) + '</td></tr></tbody>';
  } else {
    cuerpo = '<tbody>' + filas.map(function (f) {
      return '<tr>' + columnas.map(function (c) {
        var contenido = c.html ? c.html(f) : esc(c.texto(f));
        return '<td' + (c.num ? ' class="num"' : '') + '>' + contenido + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
  }

  $(id).innerHTML = cabecera + cuerpo;
}

function enlaceLibro(clave, texto) {
  return '<a href="ficha.html?libro=' + encodeURIComponent(clave) + '">' +
    esc(texto) + '</a>';
}

function pintarLecturasLibro(clave) {
  var filas = lecturasDe(clave);
  var abiertas = filas.filter(lecturaEnCurso).length;

  $('lecturas-cuenta').textContent = filas.length
    ? filas.length + (filas.length === 1 ? ' lectura' : ' lecturas') +
      (abiertas ? ' · ' + abiertas + ' en curso' : '')
    : 'ninguna';

  pintarTablaFicha('tabla-lecturas', [
    {
      titulo: 'Fin', texto: function (le) {
        return lecturaEnCurso(le) ? 'en curso' : (fecha(le.fechaFin) || '—');
      }
    },
    { titulo: 'Inicio', texto: function (le) { return fecha(le.fechaInicio) || '—'; } },
    { titulo: 'Formato', texto: function (le) { return le.formato || '—'; } },
    {
      titulo: 'Días', num: true, texto: function (le) {
        var d = diasDe(le);
        return d ? fmt(d) : '—';
      }
    }
  ], filas, 'Sin lecturas registradas: añade la primera abajo.');
}

/* ---------- nueva lectura ---------- */

function hoyIso() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/** Deja el formulario listo: la lectura empieza hoy salvo que se cambie. */
function prepararFormularioLectura() {
  var inicio = $('lec-inicio');
  var fin = $('lec-fin');
  if (!inicio || !fin) return;

  inicio.max = hoyIso();
  fin.max = hoyIso();
  fin.min = '';
  inicio.value = hoyIso();
  fin.value = '';
  $('lec-formato').value = 'libro';
  aviso('lec-aviso', '');
  if (LIBRO && lecturasDe(LIBRO.clave).some(lecturaEnCurso)) {
    aviso('lec-aviso', 'Ya hay una lectura en curso: dala por acabada en la biblioteca ' +
      'para añadir otra.');
  }
}

/** El fin no puede ser anterior al inicio: se mueve el mínimo del campo. */
function sincronizarFechasLectura() {
  var inicio = $('lec-inicio').value;
  var fin = $('lec-fin');
  fin.min = inicio || '';
  if (fin.value && inicio && fin.value < inicio) fin.value = '';
}

/** Último `codlec` con una transacción, igual que en lector.js. */
async function siguienteCodlec() {
  var inicial = LECTURAS.reduce(function (maximo, le) {
    var n = Number(le.codlec);
    return isFinite(n) && n > maximo ? n : maximo;
  }, 0);

  var resultado = await db.ref('meta/ultimoCodlec').transaction(function (ultimo) {
    return (typeof ultimo === 'number' ? ultimo : inicial) + 1;
  });
  return resultado.snapshot.val();
}

async function registrarLecturaFicha(evento) {
  evento.preventDefault();
  if (!LIBRO) return;

  var inicio = $('lec-inicio').value;
  var fin = $('lec-fin').value;
  var hoy = hoyIso();

  if (!inicio) {
    aviso('lec-aviso', 'Escribe la fecha de inicio.', 'error');
    return;
  }
  if (inicio > hoy) {
    aviso('lec-aviso', 'La fecha de inicio no puede ser posterior a hoy.', 'error');
    return;
  }
  if (fin && fin < inicio) {
    aviso('lec-aviso', 'La fecha de fin no puede ser anterior a la de inicio.', 'error');
    return;
  }
  if (fin && fin > hoy) {
    aviso('lec-aviso', 'La fecha de fin no puede ser posterior a hoy.', 'error');
    return;
  }
  if (lecturasDe(LIBRO.clave).some(lecturaEnCurso)) {
    aviso('lec-aviso', 'Ya hay una lectura en curso de este libro: dala por acabada ' +
      'en la biblioteca antes de empezar otra.', 'error');
    return;
  }

  var boton = $('form-lectura').querySelector('button[type="submit"]');
  boton.disabled = true;
  aviso('lec-aviso', 'Registrando…');

  try {
    var codlec = await siguienteCodlec();
    var lectura = {
      codlec: codlec,
      fechaInicio: inicio,
      fechaFin: fin || null,
      formato: $('lec-formato').value,
      libro: LIBRO.clave
    };
    await db.ref('lecturas/' + codlec).set(lectura);

    LECTURAS.push(lectura);
    pintarLecturasLibro(LIBRO.clave);
    if (AUTOR) pintarObrasAutor(AUTOR.coda);

    prepararFormularioLectura();
    aviso('lec-aviso', fin
      ? 'Lectura registrada: del ' + fecha(inicio) + ' al ' + fecha(fin) + '.'
      : 'Lectura en curso desde el ' + fecha(inicio) + '.', 'ok');
  } catch (e) {
    var ayuda = e && e.code === 'PERMISSION_DENIED'
      ? 'Sin permiso: publica database.rules.json y habilita el acceso anónimo.'
      : (e.message || e.code || 'error desconocido');
    aviso('lec-aviso', 'No se pudo registrar la lectura: ' + ayuda, 'error');
  } finally {
    boton.disabled = false;
  }
}

function pintarObrasAutor(coda) {
  var filas = obrasDe(coda);

  $('obras-cuenta').textContent = filas.length
    ? filas.length + (filas.length === 1 ? ' obra' : ' obras')
    : 'ninguna';

  pintarTablaFicha('tabla-obras', [
    {
      titulo: 'Título', html: function (l) {
        return enlaceLibro(l.clave, l.titulo || '(sin título)');
      },
      texto: function (l) { return l.titulo || '(sin título)'; }
    },
    {
      titulo: 'Año', num: true, texto: function (l) { return l['año'] || '—'; }
    },
    {
      titulo: 'Nota', num: true, texto: function (l) {
        return l.nota ? numero(l.nota) : '—';
      }
    },
    {
      titulo: 'Veces', num: true, texto: function (l) {
        return String(lecturasDe(l.clave).filter(function (le) {
          return !lecturaEnCurso(le);
        }).length);
      }
    },
    {
      titulo: 'Idioma', texto: function (l) { return l.idioma || '—'; }
    }
  ], filas, 'Sin obras en la biblioteca.');
}

/* ---------- listas de apoyo ---------- */

function rellenarListas() {
  function unicos(valores) {
    var mapa = {};
    valores.forEach(function (v) {
      if (v) mapa[v] = true;
    });
    return Object.keys(mapa).sort(function (a, b) { return a.localeCompare(b, 'es'); });
  }

  function datalist(id, valores) {
    $(id).innerHTML = valores.map(function (v) {
      return '<option value="' + esc(v) + '"></option>';
    }).join('');
  }

  datalist('lista-idiomas', unicos(Object.keys(LIBROS).map(function (k) {
    return LIBROS[k].idioma;
  })));

  datalist('lista-generos', unicos(Object.keys(LIBROS).map(function (k) {
    return LIBROS[k].genero;
  })));

  datalist('lista-paises', unicos(Object.keys(AUTORES).map(function (k) {
    return AUTORES[k].nacionalidad;
  })));
}

function rellenarSelectAutor(seleccionado) {
  var sel = $('l-autor');
  var codas = Object.keys(AUTORES).filter(function (k) { return AUTORES[k]; });
  codas.sort(function (a, b) {
    return (nombreCompletoAutor(a) || nombreListaAutor(a)).localeCompare(
      nombreCompletoAutor(b) || nombreListaAutor(b), 'es');
  });

  var html = '<option value="">(sin autor)</option>';
  codas.forEach(function (coda) {
    html += '<option value="' + esc(coda) + '">' +
      esc(nombreCompletoAutor(coda) || nombreListaAutor(coda)) + '</option>';
  });

  // Una ficha con un autor que ya no existe no debe perder la referencia.
  if (seleccionado && !AUTORES[String(seleccionado)]) {
    html += '<option value="' + esc(seleccionado) + '">(autor ' +
      esc(seleccionado) + ', no encontrado)</option>';
  }

  sel.innerHTML = html;
  sel.value = seleccionado ? String(seleccionado) : '';
}

function rellenarSelectSexo(valor) {
  var valores = ['varón', 'mujer'];
  if (valor && valores.indexOf(valor) === -1) valores.push(valor);

  $('a-sexo').innerHTML = '<option value="">(sin dato)</option>' +
    valores.map(function (v) {
      return '<option value="' + esc(v) + '">' + esc(v) + '</option>';
    }).join('');
  $('a-sexo').value = valor || '';
}

/* ---------- libros ---------- */

function campoLibro(id) {
  return $(id).value;
}

function enteroDe(id) {
  var v = campoLibro(id).trim();
  return v === '' ? null : Number(v);
}

function decimalDe(id) {
  var v = campoLibro(id).trim();
  return v === '' ? null : Number(v);
}

function leerLibro() {
  return {
    titulo: campoLibro('l-titulo').trim(),
    autor: campoLibro('l-autor') ? Number(campoLibro('l-autor')) : null,
    idioma: campoLibro('l-idioma').trim(),
    'año': enteroDe('l-anio'),
    'añoEdicion': enteroDe('l-anioedicion'),
    npaginas: enteroDe('l-npaginas'),
    nota: decimalDe('l-nota'),
    genero: campoLibro('l-genero').trim(),
    isbn: campoLibro('l-isbn').trim(),
    portada: campoLibro('l-portada').trim(),
    comentario: campoLibro('l-comentario').trim(),
    sinopsis: campoLibro('l-sinopsis').trim()
  };
}

/** Los valores del libro tal como están en la base, para comparar. */
function fotoLibro() {
  var foto = {};
  ['titulo', 'autor', 'idioma', 'año', 'añoEdicion', 'npaginas', 'nota', 'genero',
    'isbn', 'portada', 'comentario', 'sinopsis'].forEach(function (campo) {
    var v = LIBRO[campo];
    foto[campo] = (v === null || v === undefined) ? '' : String(v);
  });
  return foto;
}

/** Igual que fotoLibro(), pero leyendo el formulario. */
function fotoLibroFormulario() {
  var datos = leerLibro();
  var foto = {};
  Object.keys(datos).forEach(function (campo) {
    foto[campo] = datos[campo] === null ? '' : String(datos[campo]);
  });
  return foto;
}

function rellenarCamposLibro() {
  $('l-titulo').value = LIBRO.titulo || '';
  rellenarSelectAutor(LIBRO.autor);
  $('l-idioma').value = LIBRO.idioma || '';
  $('l-anio').value = LIBRO['año'] || '';
  $('l-anioedicion').value = LIBRO['añoEdicion'] || '';
  $('l-npaginas').value = LIBRO.npaginas || '';
  // La nota 0 es un valor, no un hueco.
  $('l-nota').value = LIBRO.nota === 0 ? '0' : (LIBRO.nota || '');
  $('l-genero').value = LIBRO.genero || '';
  $('l-isbn').value = LIBRO.isbn || '';
  $('l-portada').value = LIBRO.portada || '';
  $('l-comentario').value = LIBRO.comentario || '';
  $('l-sinopsis').value = LIBRO.sinopsis || '';
  ESTADO_LIBRO = fotoLibro();
}

function pintarCabeceraLibro() {
  document.title = (LIBRO.titulo || 'Libro') + ' · Biblioteca';
  $('titulo').textContent = LIBRO.titulo || '(sin título)';

  var partes = [];
  var autor = nombreCompletoAutor(LIBRO.autor);
  if (autor) partes.push(autor);
  if (LIBRO['año']) partes.push(String(LIBRO['año']));
  if (LIBRO.genero) partes.push(LIBRO.genero);
  if (LIBRO.idioma) partes.push(LIBRO.idioma);
  $('subtitulo').textContent = partes.join(' · ') || 'Sin más datos.';

  pintarWikipedia(LIBRO.wikipedia);
  pintarPortada();
}

function pintarPortada() {
  var caja = $('portada-caja');
  var img = $('portada');
  var url = LIBRO && LIBRO.portada;

  if (!url || !/^https?:\/\//i.test(url)) {
    caja.hidden = true;
    img.removeAttribute('src');
    return;
  }

  img.onerror = function () { caja.hidden = true; };
  img.onload = function () { caja.hidden = false; };
  img.src = url;
  caja.hidden = false;
}

/** ¿Se ha tocado este campo? Con `cambios` nulo se revisan todos. */
function cambia(cambios, campo) {
  return !cambios || Object.prototype.hasOwnProperty.call(cambios, campo);
}

function problemaAnio(valor, etiqueta) {
  if (valor === null) return '';
  if (!isFinite(valor) || Math.floor(valor) !== valor || valor < 1 || valor > 2100) {
    return etiqueta + ' tiene que ser un número entero entre 1 y 2100.';
  }
  return '';
}

/** Valida solo los campos que se van a guardar: los datos viejos raros no bloquean. */
function validarLibro(datos, cambios) {
  if (cambia(cambios, 'titulo') && !datos.titulo) {
    return 'El título no puede estar vacío.';
  }

  if (cambia(cambios, 'año')) {
    var problema = problemaAnio(datos['año'], 'El año de la obra');
    if (problema) return problema;
  }
  if (cambia(cambios, 'añoEdicion')) {
    var problemaEdicion = problemaAnio(datos['añoEdicion'], 'El año de la edición');
    if (problemaEdicion) return problemaEdicion;
  }

  if (cambia(cambios, 'npaginas') && datos.npaginas !== null &&
    (!isFinite(datos.npaginas) || Math.floor(datos.npaginas) !== datos.npaginas ||
      datos.npaginas < 1)) {
    return 'Las páginas tienen que ser un número entero positivo.';
  }

  if (cambia(cambios, 'nota') && datos.nota !== null &&
    (!isFinite(datos.nota) || datos.nota < 0 || datos.nota > 10)) {
    return 'La nota tiene que estar entre 0 y 10.';
  }

  return '';
}

function minusculaInicial(texto) {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

/** Avisa, sin bloquear, de un dato heredado que no pasaría la validación. */
function revisarDatosLibro() {
  var problema = validarLibro(leerLibro(), null);
  if (!problema) return;
  aviso('libro-aviso', 'Ojo: ' + minusculaInicial(problema) +
    ' Puedes corregirlo ahora o guardar otro cambio sin tocarlo.', 'error');
}

async function guardarLibro(evento) {
  evento.preventDefault();
  if (!LIBRO) return;

  var datos = leerLibro();
  var foto = fotoLibroFormulario();
  var cambios = {};
  Object.keys(datos).forEach(function (campo) {
    if (foto[campo] !== ESTADO_LIBRO[campo]) cambios[campo] = datos[campo];
  });

  if (!Object.keys(cambios).length) {
    aviso('libro-aviso', 'No hay cambios que guardar.');
    return;
  }

  var problema = validarLibro(datos, cambios);
  if (problema) {
    aviso('libro-aviso', problema, 'error');
    return;
  }

  var autorAntes = LIBRO.autor;
  cambios.actualizado = firebase.database.ServerValue.TIMESTAMP;

  var boton = $('form-libro').querySelector('button[type="submit"]');
  boton.disabled = true;
  aviso('libro-aviso', 'Guardando…');

  try {
    await db.ref('libros/' + LIBRO.clave).update(cambios);

    Object.keys(cambios).forEach(function (campo) {
      if (campo !== 'actualizado') LIBRO[campo] = cambios[campo];
    });
    LIBRO.actualizado = new Date().toISOString();

    rellenarCamposLibro();
    pintarCabeceraLibro();
    pintarLecturasLibro(LIBRO.clave);

    // Si se ha cambiado el autor, la sección de autor pasa a ser la nueva.
    if (String(autorAntes) !== String(LIBRO.autor)) {
      pintarSeccionAutor();
    } else {
      rellenarSelectAutor(LIBRO.autor);
      if (AUTOR) pintarObrasAutor(AUTOR.coda);
    }

    aviso('libro-aviso', 'Cambios guardados.', 'ok');
  } catch (e) {
    aviso('libro-aviso', 'No se pudo guardar: ' + (e.message || e), 'error');
  } finally {
    boton.disabled = false;
  }
}

/* ---------- autores ---------- */

function leerAutor() {
  return {
    nombre: $('a-nombre').value.trim(),
    apellidos: $('a-apellidos').value.trim(),
    autor: $('a-autor').value.trim(),
    nacionalidad: $('a-nacionalidad').value.trim(),
    nacimiento: enteroDe('a-nacimiento'),
    muerte: enteroDe('a-muerte'),
    sexo: $('a-sexo').value
  };
}

function fotoAutor() {
  var foto = {};
  ['nombre', 'apellidos', 'autor', 'nacionalidad', 'nacimiento', 'muerte', 'sexo']
    .forEach(function (campo) {
      var v = AUTOR[campo];
      foto[campo] = (v === null || v === undefined) ? '' : String(v);
    });
  return foto;
}

function fotoAutorFormulario() {
  var datos = leerAutor();
  var foto = {};
  Object.keys(datos).forEach(function (campo) {
    foto[campo] = datos[campo] === null ? '' : String(datos[campo]);
  });
  return foto;
}

function rellenarCamposAutor() {
  $('a-nombre').value = AUTOR.nombre || '';
  $('a-apellidos').value = AUTOR.apellidos || '';
  $('a-autor').value = AUTOR.autor || '';
  $('a-nacionalidad').value = AUTOR.nacionalidad || '';
  $('a-nacimiento').value = AUTOR.nacimiento || '';
  $('a-muerte').value = AUTOR.muerte || '';
  rellenarSelectSexo(AUTOR.sexo);
  ESTADO_AUTOR = fotoAutor();
}

function validarAutor(datos, cambios) {
  if ((cambia(cambios, 'autor') || cambia(cambios, 'nombre') || cambia(cambios, 'apellidos')) &&
    !datos.autor && !datos.nombre && !datos.apellidos) {
    return 'Escribe al menos el nombre del autor para las listas.';
  }

  if (cambia(cambios, 'nacimiento')) {
    var problemaNacimiento = problemaAnio(datos.nacimiento, 'El año de nacimiento');
    if (problemaNacimiento) return problemaNacimiento;
  }
  if (cambia(cambios, 'muerte')) {
    var problemaMuerte = problemaAnio(datos.muerte, 'El año de muerte');
    if (problemaMuerte) return problemaMuerte;
  }

  if ((cambia(cambios, 'nacimiento') || cambia(cambios, 'muerte')) &&
    datos.nacimiento !== null && datos.muerte !== null && datos.muerte < datos.nacimiento) {
    return 'El año de muerte no puede ser anterior al de nacimiento.';
  }

  return '';
}

/** Avisa, sin bloquear, de un dato heredado que no pasaría la validación. */
function revisarDatosAutor() {
  var problema = validarAutor(leerAutor(), null);
  if (!problema) return;
  aviso('autor-aviso', 'Ojo: ' + minusculaInicial(problema) +
    ' Puedes corregirlo ahora o guardar otro cambio sin tocarlo.', 'error');
}

async function guardarAutor(evento) {
  evento.preventDefault();
  if (!AUTOR) return;

  var datos = leerAutor();
  var foto = fotoAutorFormulario();
  var cambios = {};
  Object.keys(datos).forEach(function (campo) {
    if (foto[campo] !== ESTADO_AUTOR[campo]) cambios[campo] = datos[campo];
  });

  if (!Object.keys(cambios).length) {
    aviso('autor-aviso', 'No hay cambios que guardar.');
    return;
  }

  var problema = validarAutor(datos, cambios);
  if (problema) {
    aviso('autor-aviso', problema, 'error');
    return;
  }

  var boton = $('form-autor').querySelector('button[type="submit"]');
  boton.disabled = true;
  aviso('autor-aviso', 'Guardando…');

  try {
    await db.ref('autores/' + AUTOR.coda).update(cambios);

    Object.keys(cambios).forEach(function (campo) { AUTOR[campo] = cambios[campo]; });

    rellenarCamposAutor();
    rellenarSelectAutor(LIBRO ? LIBRO.autor : null);
    if (LIBRO) pintarCabeceraLibro();
    else pintarCabeceraAutor();
    pintarLeyendaAutor();

    // Si cambió el nombre, el artículo que se había encontrado ya no vale.
    if (cambios.nombre !== undefined || cambios.apellidos !== undefined ||
      cambios.autor !== undefined) {
      delete WIKI_AUTOR[AUTOR.coda];
    }
    mostrarWikipediaAutor(!LIBRO);

    aviso('autor-aviso', 'Cambios guardados.', 'ok');
  } catch (e) {
    aviso('autor-aviso', 'No se pudo guardar: ' + (e.message || e), 'error');
  } finally {
    boton.disabled = false;
  }
}

function pintarCabeceraAutor() {
  var nombre = nombreCompletoAutor(AUTOR.coda) || AUTOR.autor || ('Autor ' + AUTOR.coda);
  document.title = nombre + ' · Biblioteca';
  $('titulo').textContent = nombre;

  var partes = [];
  if (AUTOR.nacionalidad) partes.push(AUTOR.nacionalidad);
  if (AUTOR.nacimiento) {
    partes.push(String(AUTOR.nacimiento) + (AUTOR.muerte ? '–' + AUTOR.muerte : ''));
  } else if (AUTOR.muerte) {
    partes.push('† ' + AUTOR.muerte);
  }
  if (AUTOR.sexo) partes.push(AUTOR.sexo);

  var obras = obrasDe(AUTOR.coda).length;
  partes.push(obras + (obras === 1 ? ' obra' : ' obras'));

  $('subtitulo').textContent = partes.join(' · ');
  pintarPortada();
}

function pintarLeyendaAutor() {
  var leyenda = $('autor-titulo');
  if (!leyenda || !AUTOR) return;
  var nombre = nombreCompletoAutor(AUTOR.coda) || AUTOR.autor || ('Autor ' + AUTOR.coda);
  leyenda.textContent = LIBRO ? 'Datos del autor · ' + nombre : 'Datos del autor';
}

/**
 * Rellena y muestra la sección de autor. `principal` es true cuando la ficha
 * es la del autor (desde consulta.html?autor=); si no, acompaña a un libro.
 */
function pintarAutor(principal) {
  if (!AUTOR) return;

  rellenarCamposAutor();
  revisarDatosAutor();
  pintarLeyendaAutor();
  pintarObrasAutor(AUTOR.coda);

  $('bloque-autor').hidden = false;
  $('bloque-obras').hidden = false;
  // En el móvil los formularios empiezan plegados; las obras solo se abren en
  // la ficha del autor (en la de un libro, el libro es lo que interesa).
  $('bloque-autor').open = !esMovil();
  $('bloque-obras').open = principal;

  if (principal) pintarCabeceraAutor();

  // Cabecera en la ficha del autor; sobre el formulario si acompaña a un libro.
  mostrarWikipediaAutor(principal);
}

/** Según el autor actual del libro, enseña u oculta los bloques de autor. */
function pintarSeccionAutor() {
  if (LIBRO && LIBRO.autor && AUTORES[String(LIBRO.autor)]) {
    AUTOR = AUTORES[String(LIBRO.autor)];
    pintarAutor(false);
  } else {
    AUTOR = null;
    $('bloque-autor').hidden = true;
    $('bloque-obras').hidden = true;
    $('autor-wiki').hidden = true;
  }
}

/* ---------- arranque ---------- */

/** En pantallas estrechas, los bloques que no son el principal empiezan plegados. */
function esMovil() {
  return window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
}

function pintarLibro() {
  var movil = esMovil();
  $('bloque-libro').hidden = false;
  $('bloque-libro').open = !movil;
  $('bloque-lecturas').hidden = false;
  $('bloque-lecturas').open = !movil;

  rellenarCamposLibro();
  revisarDatosLibro();
  pintarCabeceraLibro();
  pintarLecturasLibro(LIBRO.clave);
  prepararFormularioLectura();
  pintarSeccionAutor();
}

function noEncontrado(que, valor) {
  estado('No hay ' + que + ' con la clave «' + valor + '» en la biblioteca.', 'error');
}

async function iniciar() {
  var parametros = new URLSearchParams(window.location.search);
  var claveLibro = parametros.get('libro');
  var codaAutor = parametros.get('autor');

  // El enlace «← Biblioteca» vuelve a la pestaña desde la que se vino.
  var volver = document.querySelector('.volver');
  if (volver && document.referrer) {
    try {
      var referencia = new URL(document.referrer);
      if (referencia.origin === window.location.origin &&
        /\/consulta\.html$/.test(referencia.pathname)) {
        volver.href = referencia.href;
      }
    } catch (e) { /* referrer ausente o raro: se queda el enlace normal */ }
  }

  if (!CONFIGURADO) {
    estado('Falta firebase-config.js: no hay base de datos configurada.', 'error');
    return;
  }

  try {
    await iniciarFirebase();
    await cargarDatos();
    rellenarListas();

    if (claveLibro) {
      LIBRO = LIBROS[claveLibro] || null;
      if (!LIBRO) {
        noEncontrado('ningún libro', claveLibro);
        return;
      }
      pintarLibro();
    } else if (codaAutor) {
      AUTOR = AUTORES[codaAutor] || null;
      if (!AUTOR) {
        noEncontrado('ningún autor', codaAutor);
        return;
      }
      pintarAutor(true);
    } else {
      estado('Elige un libro o un autor en la biblioteca para ver su ficha.');
      return;
    }

    $('contenido').hidden = false;
    $('estado').hidden = true;
  } catch (e) {
    estado('No se pudo cargar la ficha: ' + (e.message || e), 'error');
  }
}

$('form-libro').addEventListener('submit', guardarLibro);
$('form-autor').addEventListener('submit', guardarAutor);

if ($('form-lectura')) {
  $('form-lectura').addEventListener('submit', registrarLecturaFicha);
  $('lec-inicio').addEventListener('change', sincronizarFechasLectura);
}

iniciar();
