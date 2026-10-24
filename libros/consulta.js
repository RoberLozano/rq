/*
 * Página de consulta de la biblioteca. Lee /libros, /autores y /lecturas y
 * calcula todo en el cliente (≈700 nodos), recalculando al mover cualquier
 * filtro o deslizador.
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
var ANIO_ACTUAL = new Date().getFullYear();

var db = null;
var LIBROS = [];
var LECTURAS = [];
var AUTORES = {};
var INDICE = {};
var POR_LIBRO = {};
var LIBROS_FILTRADOS = [];
var LECTURAS_FILTRADAS = [];

var FILTROS = {
  estado: '',      // '', 'leidos', 'sinleer', 'releidos'
  nota: 0,         // nota mínima
  paginasMin: 0,   // "más de X páginas"
  tamano: '',      // '', 'corto', 'mediano', 'grande', 'tocho'
  genero: '',
  idioma: '',
  autor: '',
  sexo: '',
  pais: '',
  formato: '',
  anio: '',
  calidad: ''      // '', 'sinopsis', 'portada', 'isbn', 'anio', 'anio-raro'
};

var ORDEN_LIBROS = { col: 'titulo', dir: 1 };
var ORDEN_AUTORES = { col: 'lecturas', dir: -1 };
var BUSQUEDA = '';

var ETIQUETAS_ESTADO = { leidos: 'leídos', sinleer: 'sin leer', releidos: 'releídos' };
var ETIQUETAS_TAMANO = {
  corto: 'corto (< 200)',
  mediano: 'mediano (200–399)',
  grande: 'grande (400–599)',
  tocho: 'tocho (600+)'
};
var ETIQUETAS_CALIDAD = {
  sinopsis: 'sin sinopsis',
  portada: 'sin portada',
  isbn: 'sin ISBN',
  anio: 'sin año',
  'anio-raro': 'año imposible'
};

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

function fmt(n) {
  return num(n).toLocaleString('es-ES');
}

function fmt1(n) {
  return num(n).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmt2(n) {
  return num(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Número para etiquetas (sin decimales innecesarios). */
function numero(n) {
  return num(n).toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

function norm(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function fecha(iso) {
  var partes = String(iso || '').split('-');
  if (partes.length !== 3) return '';
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function ms(iso) {
  var partes = String(iso || '').split('-');
  if (partes.length !== 3) return NaN;
  return Date.UTC(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

/** Días de una lectura, como en Access: fechafin − fechainicio + 1. */
function diasDe(le) {
  var a = ms(le.fechaInicio);
  var b = ms(le.fechaFin);
  if (!isFinite(a) || !isFinite(b) || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

function anioDe(le) {
  return String(le.fechaFin || le.fechaInicio || '').slice(0, 4);
}

function nombreAutor(coda) {
  var a = AUTORES[String(coda)];
  if (!a) return '(sin autor)';
  return a.autor || [a.nombre, a.apellidos].filter(Boolean).join(' ') || '(sin autor)';
}

function vecesDe(libro) {
  var f = POR_LIBRO[libro.clave];
  return f ? f.veces : 0;
}

function ultimaDe(libro) {
  var f = POR_LIBRO[libro.clave];
  return f ? f.ultima : '';
}

function tamanoDe(paginas) {
  if (paginas < 200) return 'corto';
  if (paginas < 400) return 'mediano';
  if (paginas < 600) return 'grande';
  return 'tocho';
}

function cargarScript(src) {
  return new Promise(function (resolver, rechazar) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = resolver;
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
    LIBROS.push(v);
  });

  snaps[1].forEach(function (hijo) {
    var v = hijo.val();
    if (v) AUTORES[hijo.key] = v;
  });

  snaps[2].forEach(function (hijo) {
    var v = hijo.val();
    if (v) LECTURAS.push(v);
  });

  LIBROS.forEach(function (l) { INDICE[l.clave] = l; });

  LECTURAS.forEach(function (le) {
    var clave = String(le.libro);
    var f = POR_LIBRO[clave];
    if (!f) f = POR_LIBRO[clave] = { veces: 0, ultima: '', formatos: {} };
    f.veces++;
    var cuando = String(le.fechaFin || le.fechaInicio || '');
    if (cuando > f.ultima) f.ultima = cuando;
    if (le.formato) f.formatos[le.formato] = true;
  });
}

/* ---------- filtros ---------- */

function pasaTexto(valor, filtro) {
  if (!filtro) return true;
  if (filtro === '__vacio') return !valor;
  return String(valor || '') === filtro;
}

function libroBasePasa(l, omitir) {
  var veces = vecesDe(l);

  if (omitir !== 'estado') {
    if (FILTROS.estado === 'leidos' && !veces) return false;
    if (FILTROS.estado === 'sinleer' && veces) return false;
    if (FILTROS.estado === 'releidos' && veces < 2) return false;
  }

  if (omitir !== 'nota' && FILTROS.nota > 0) {
    var n = Number(l.nota);
    if (!(isFinite(n) && n >= FILTROS.nota)) return false;
  }

  if (omitir !== 'paginas') {
    var p = num(l.npaginas);
    if (FILTROS.paginasMin > 0 && !(p > FILTROS.paginasMin)) return false;
    if (FILTROS.tamano && tamanoDe(p) !== FILTROS.tamano) return false;
  }

  if (omitir !== 'genero' && !pasaTexto(l.genero, FILTROS.genero)) return false;
  if (omitir !== 'idioma' && !pasaTexto(l.idioma, FILTROS.idioma)) return false;
  if (omitir !== 'autor' && FILTROS.autor && String(l.autor) !== FILTROS.autor) return false;

  var autor = AUTORES[String(l.autor)] || {};
  if (omitir !== 'sexo' && !pasaTexto(autor.sexo, FILTROS.sexo)) return false;
  if (omitir !== 'pais' && !pasaTexto(autor.nacionalidad, FILTROS.pais)) return false;

  if (omitir !== 'calidad' && FILTROS.calidad) {
    if (FILTROS.calidad === 'sinopsis' && l.sinopsis) return false;
    if (FILTROS.calidad === 'portada' && l.portada) return false;
    if (FILTROS.calidad === 'isbn' && l.isbn) return false;
    if (FILTROS.calidad === 'anio' && num(l['año'])) return false;
    if (FILTROS.calidad === 'anio-raro' && !(num(l['año']) > ANIO_ACTUAL)) return false;
  }

  return true;
}

function lecturasPara(omitir) {
  return LECTURAS.filter(function (le) {
    if (omitir !== 'formato' && FILTROS.formato && (le.formato || '') !== FILTROS.formato) {
      return false;
    }
    if (omitir !== 'anio' && FILTROS.anio) {
      if (FILTROS.anio === '__vacio') {
        if (anioDe(le)) return false;
      } else if (anioDe(le) !== FILTROS.anio) {
        return false;
      }
    }
    return true;
  });
}

function librosPara(omitir) {
  var lecs = lecturasPara(omitir);
  var requiereLectura = (omitir !== 'formato' && FILTROS.formato) ||
    (omitir !== 'anio' && FILTROS.anio);

  var conLectura = null;
  if (requiereLectura) {
    conLectura = {};
    lecs.forEach(function (le) { conLectura[String(le.libro)] = true; });
  }

  return LIBROS.filter(function (l) {
    if (!libroBasePasa(l, omitir)) return false;
    if (conLectura && !conLectura[l.clave]) return false;
    return true;
  });
}

function alternar(campo, valor) {
  FILTROS[campo] = FILTROS[campo] === valor ? '' : valor;
  sincronizarControles();
  aplicar();
}

function aplicar() {
  LIBROS_FILTRADOS = librosPara('');

  var claves = {};
  LIBROS_FILTRADOS.forEach(function (l) { claves[l.clave] = true; });

  LECTURAS_FILTRADAS = lecturasPara('').filter(function (le) {
    return claves[String(le.libro)] === true;
  });

  pintarResumen();
  pintarNota();
  pintarPaginas();
  pintarLecturas();
  pintarAutores();
  pintarReleidos();
  pintarGeneros();
  pintarIdiomas();
  pintarSexo();
  pintarPais();
  pintarFormatos();
  pintarAnios();
  pintarLibros();
  pintarRevisar();
  pintarFiltrosActivos();
}

/* ---------- tablas ---------- */

function ordenar(filas, columnas, orden) {
  var col = null;
  for (var i = 0; i < columnas.length; i++) {
    if (columnas[i].col === orden.col) { col = columnas[i]; break; }
  }
  if (!col) return filas;

  return filas.slice().sort(function (a, b) {
    var x = col.orden ? col.orden(a) : col.texto(a);
    var y = col.orden ? col.orden(b) : col.texto(b);
    if (typeof x === 'number' || typeof y === 'number') {
      x = num(x);
      y = num(y);
      return (x - y) * orden.dir;
    }
    return String(x).localeCompare(String(y), 'es', { numeric: true }) * orden.dir;
  });
}

function pintarTabla(id, columnas, filas, orden, conOrden, atributos) {
  var cabecera = columnas.map(function (c) {
    var clases = [];
    if (c.num) clases.push('num');
    if (c.clase) clases.push(c.clase);
    if (conOrden && c.col) clases.push('ordenable');
    var titulo = c.titulo;
    if (conOrden && c.col && orden.col === c.col) {
      titulo += orden.dir > 0 ? ' ↑' : ' ↓';
    }
    return '<th' + (clases.length ? ' class="' + clases.join(' ') + '"' : '') +
      (conOrden && c.col ? ' data-col="' + c.col + '"' : '') + '>' + esc(titulo) + '</th>';
  }).join('');

  var cuerpo;
  if (!filas.length) {
    cuerpo = '<tr><td colspan="' + columnas.length + '" class="nota">Sin resultados.</td></tr>';
  } else {
    cuerpo = filas.map(function (f) {
      var attrs = atributos ? atributos(f) : '';
      var celdas = columnas.map(function (c) {
        var clases = [];
        if (c.num) clases.push('num');
        if (c.clase) clases.push(c.clase);
        return '<td' + (clases.length ? ' class="' + clases.join(' ') + '"' : '') + '>' +
          esc(c.texto(f)) + '</td>';
      }).join('');
      return '<tr' + attrs + '>' + celdas + '</tr>';
    }).join('');
  }

  $(id).innerHTML = '<thead><tr>' + cabecera + '</tr></thead><tbody>' + cuerpo + '</tbody>';
}

function activarOrden(id, columnas, orden, repintar) {
  $(id).addEventListener('click', function (e) {
    var th = e.target.closest('th[data-col]');
    if (!th) return;
    var col = th.getAttribute('data-col');
    if (orden.col === col) {
      orden.dir = -orden.dir;
    } else {
      orden.col = col;
      var def = null;
      for (var i = 0; i < columnas.length; i++) {
        if (columnas[i].col === col) { def = columnas[i]; break; }
      }
      orden.dir = (def && def.dir) || 1;
    }
    repintar();
  });
}

/* ---------- resumen ---------- */

function tarjeta(valor, texto) {
  return '<div class="tarjeta"><div class="numero">' + esc(valor) + '</div>' +
    '<div class="texto">' + esc(texto) + '</div></div>';
}

function pintarResumen() {
  var leidos = 0;
  var releidos = 0;
  var notas = [];

  LIBROS_FILTRADOS.forEach(function (l) {
    var v = vecesDe(l);
    if (v > 0) leidos++;
    if (v >= 2) releidos++;
    var n = Number(l.nota);
    if (n > 0) notas.push(n);
  });

  var paginas = 0;
  var dias = 0;
  var paginasConDias = 0;

  LECTURAS_FILTRADAS.forEach(function (le) {
    var l = INDICE[String(le.libro)];
    if (!l) return;
    var p = num(l.npaginas);
    paginas += p;
    var d = diasDe(le);
    if (d) {
      dias += d;
      paginasConDias += p;
    }
  });

  var notaMedia = 0;
  if (notas.length) {
    notaMedia = notas.reduce(function (a, b) { return a + b; }, 0) / notas.length;
  }
  var porDia = dias ? paginasConDias / dias : 0;
  var pct = LIBROS_FILTRADOS.length ? Math.round(leidos / LIBROS_FILTRADOS.length * 100) : 0;

  $('tarjetas').innerHTML = [
    tarjeta(fmt(LIBROS_FILTRADOS.length), 'libros'),
    tarjeta(fmt(leidos), 'leídos · ' + pct + '%'),
    tarjeta(fmt(LECTURAS_FILTRADAS.length), 'lecturas'),
    tarjeta(fmt(releidos), 'libros releídos'),
    tarjeta(fmt(paginas), 'páginas leídas'),
    tarjeta(fmt(dias), 'días de lectura'),
    tarjeta(porDia ? fmt1(porDia) : '—', 'páginas/día'),
    tarjeta(notaMedia ? fmt2(notaMedia) : '—', 'nota media')
  ].join('');
}

/* ---------- libros por nota ---------- */

function pintarNota() {
  var libros = LIBROS_FILTRADOS.filter(function (l) {
    return Number(l.nota) > 0;
  }).sort(function (a, b) {
    return (Number(b.nota) || 0) - (Number(a.nota) || 0) ||
      String(a.titulo || '').localeCompare(String(b.titulo || ''), 'es');
  });

  $('nota-cuenta').textContent = fmt(libros.length) +
    (libros.length === 1 ? ' libro' : ' libros') +
    (FILTROS.nota > 0 ? ' con nota ≥ ' + numero(FILTROS.nota) : ' con nota');

  pintarTabla('tabla-nota', [
    { titulo: 'Nota', num: true, texto: function (l) { return numero(l.nota); } },
    { titulo: 'Título', texto: function (l) { return l.titulo || '(sin título)'; } },
    { titulo: 'Autor', texto: function (l) { return nombreAutor(l.autor); } },
    { titulo: 'Págs.', num: true, clase: 'oculto-movil', texto: function (l) { return fmt(l.npaginas); } },
    { titulo: 'Veces', num: true, clase: 'oculto-movil', texto: function (l) { return String(vecesDe(l)); } },
    { titulo: 'Última', texto: function (l) { return fecha(ultimaDe(l)) || '—'; } }
  ], libros, null, false);
}

/* ---------- páginas ---------- */

function pintarPaginas() {
  var libros = LIBROS_FILTRADOS.slice().sort(function (a, b) {
    return num(b.npaginas) - num(a.npaginas);
  });

  var texto = fmt(libros.length) + (libros.length === 1 ? ' libro' : ' libros');
  if (FILTROS.paginasMin > 0) {
    texto += ' con más de ' + fmt(FILTROS.paginasMin) + ' páginas';
  }
  if (FILTROS.tamano) texto += ' · ' + ETIQUETAS_TAMANO[FILTROS.tamano];
  $('paginas-cuenta').textContent = texto;

  var base = librosPara('paginas');
  var cuentas = { corto: 0, mediano: 0, grande: 0, tocho: 0 };
  base.forEach(function (l) { cuentas[tamanoDe(num(l.npaginas))]++; });

  $('tamanos').innerHTML = ['corto', 'mediano', 'grande', 'tocho'].map(function (t) {
    return '<button type="button" class="chip' + (FILTROS.tamano === t ? ' activa' : '') +
      '" data-tamano="' + t + '">' + ETIQUETAS_TAMANO[t] + ' · ' + fmt(cuentas[t]) + '</button>';
  }).join('');

  pintarTabla('tabla-paginas', [
    { titulo: 'Págs.', num: true, texto: function (l) { return fmt(l.npaginas); } },
    { titulo: 'Título', texto: function (l) { return l.titulo || '(sin título)'; } },
    { titulo: 'Autor', texto: function (l) { return nombreAutor(l.autor); } },
    { titulo: 'Nota', num: true, texto: function (l) { return l.nota ? numero(l.nota) : '—'; } },
    { titulo: 'Veces', num: true, clase: 'oculto-movil', texto: function (l) { return String(vecesDe(l)); } }
  ], libros, null, false);
}

/* ---------- lecturas ---------- */

function pintarLecturas() {
  var filas = LECTURAS_FILTRADAS.slice().sort(function (a, b) {
    return String(b.fechaFin || b.fechaInicio || '').localeCompare(
      String(a.fechaFin || a.fechaInicio || ''));
  });

  $('lecturas-cuenta').textContent = fmt(filas.length) +
    (filas.length === 1 ? ' lectura' : ' lecturas') +
    (FILTROS.formato ? ' en ' + FILTROS.formato : '') +
    (FILTROS.anio ? ' de ' + (FILTROS.anio === '__vacio' ? 'fecha desconocida' : FILTROS.anio) : '');

  pintarTabla('tabla-lecturas', [
    { titulo: 'Fin', texto: function (le) { return fecha(le.fechaFin) || '—'; } },
    {
      titulo: 'Título', texto: function (le) {
        var l = INDICE[String(le.libro)];
        return l ? (l.titulo || '(sin título)') : '(libro borrado)';
      }
    },
    {
      titulo: 'Autor', texto: function (le) {
        var l = INDICE[String(le.libro)];
        return l ? nombreAutor(l.autor) : '—';
      }
    },
    { titulo: 'Formato', texto: function (le) { return le.formato || '—'; } },
    {
      titulo: 'Días', num: true, clase: 'oculto-movil', texto: function (le) {
        var d = diasDe(le);
        return d ? fmt(d) : '—';
      }
    },
    {
      titulo: 'Pág./día', num: true, clase: 'oculto-movil', texto: function (le) {
        var l = INDICE[String(le.libro)];
        var d = diasDe(le);
        if (!l || !d) return '—';
        return fmt1(num(l.npaginas) / d);
      }
    }
  ], filas, null, false);
}

/* ---------- autores ---------- */

function pintarAutores() {
  var mapa = {};

  LIBROS_FILTRADOS.forEach(function (l) {
    if (l.autor === null || l.autor === undefined || l.autor === '') return;
    var coda = String(l.autor);
    var f = mapa[coda];
    if (!f) {
      f = mapa[coda] = {
        coda: coda,
        autor: nombreAutor(coda),
        obras: 0,
        lecturas: 0,
        paginas: 0,
        notas: [],
        notaMedia: 0
      };
    }
    f.obras++;
    var n = Number(l.nota);
    if (n > 0) f.notas.push(n);
  });

  LECTURAS_FILTRADAS.forEach(function (le) {
    var l = INDICE[String(le.libro)];
    if (!l) return;
    var f = mapa[String(l.autor)];
    if (!f) return;
    f.lecturas++;
    f.paginas += num(l.npaginas);
  });

  var filas = Object.keys(mapa).map(function (k) {
    var f = mapa[k];
    if (f.notas.length) {
      f.notaMedia = f.notas.reduce(function (a, b) { return a + b; }, 0) / f.notas.length;
    }
    delete f.notas;
    return f;
  });

  $('autores-cuenta').textContent = fmt(filas.length) +
    (filas.length === 1 ? ' autor' : ' autores');

  filas = ordenar(filas, COLS_AUTORES, ORDEN_AUTORES);

  pintarTabla('tabla-autores', COLS_AUTORES, filas, ORDEN_AUTORES, true, function (f) {
    return ' data-autor="' + esc(f.coda) + '" title="Filtrar por ' + esc(f.autor) + '"';
  });
}

var COLS_AUTORES = [
  { titulo: 'Autor', col: 'autor', texto: function (f) { return f.autor; } },
  { titulo: 'Obras', col: 'obras', num: true, dir: -1, texto: function (f) { return fmt(f.obras); }, orden: function (f) { return f.obras; } },
  { titulo: 'Lecturas', col: 'lecturas', num: true, dir: -1, texto: function (f) { return fmt(f.lecturas); }, orden: function (f) { return f.lecturas; } },
  { titulo: 'Páginas', col: 'paginas', num: true, dir: -1, clase: 'oculto-movil', texto: function (f) { return fmt(f.paginas); }, orden: function (f) { return f.paginas; } },
  { titulo: 'Nota media', col: 'notaMedia', num: true, dir: -1, texto: function (f) { return f.notaMedia ? fmt2(f.notaMedia) : '—'; }, orden: function (f) { return f.notaMedia || -1; } }
];

/* ---------- releídos ---------- */

function pintarReleidos() {
  var filas = LIBROS_FILTRADOS.filter(function (l) {
    return vecesDe(l) > 1;
  }).sort(function (a, b) {
    return vecesDe(b) - vecesDe(a) ||
      String(a.titulo || '').localeCompare(String(b.titulo || ''), 'es');
  });

  $('releidos-cuenta').textContent = fmt(filas.length) +
    (filas.length === 1 ? ' libro releído' : ' libros releídos');

  pintarTabla('tabla-releidos', [
    { titulo: 'Veces', num: true, texto: function (l) { return String(vecesDe(l)); } },
    { titulo: 'Título', texto: function (l) { return l.titulo || '(sin título)'; } },
    { titulo: 'Autor', texto: function (l) { return nombreAutor(l.autor); } },
    { titulo: 'Última', texto: function (l) { return fecha(ultimaDe(l)) || '—'; } }
  ], filas, null, false);
}

/* ---------- barras ---------- */

function agrupar(lista, fn, etiquetaVacio) {
  var mapa = {};
  lista.forEach(function (x) {
    var v = fn(x);
    var clave = (v === null || v === undefined || v === '') ? '__vacio' : String(v);
    mapa[clave] = (mapa[clave] || 0) + 1;
  });

  return Object.keys(mapa).map(function (k) {
    return {
      valor: k,
      etiqueta: k === '__vacio' ? etiquetaVacio : k,
      cuenta: mapa[k]
    };
  }).sort(function (a, b) {
    return b.cuenta - a.cuenta || a.etiqueta.localeCompare(b.etiqueta, 'es');
  });
}

function pintarBarras(id, datos, valorActivo, alElegir) {
  var cont = $(id);
  if (!datos.length) {
    cont.innerHTML = '<p class="nota">Sin datos.</p>';
    return;
  }

  var max = Math.max.apply(null, datos.map(function (d) { return d.cuenta; }));

  cont.innerHTML = datos.map(function (d) {
    var activa = String(d.valor) === String(valorActivo) ? ' activa' : '';
    var pct = max ? Math.max(2, Math.round(d.cuenta / max * 100)) : 0;
    return '<button type="button" class="barra' + activa + '" data-valor="' + esc(d.valor) +
      '" title="' + esc(d.etiqueta) + '">' +
      '<span class="etiqueta">' + esc(d.etiqueta) + '</span>' +
      '<span class="pista"><span class="relleno" style="width:' + pct + '%"></span></span>' +
      '<span class="valor">' + fmt(d.cuenta) + '</span></button>';
  }).join('');

  cont.querySelectorAll('.barra').forEach(function (b) {
    b.addEventListener('click', function () {
      alElegir(b.getAttribute('data-valor'));
    });
  });
}

function pintarGeneros() {
  pintarBarras('barras-generos',
    agrupar(librosPara('genero'), function (l) { return l.genero; }, 'sin género'),
    FILTROS.genero,
    function (v) { alternar('genero', v); });
}

function pintarIdiomas() {
  pintarBarras('barras-idiomas',
    agrupar(librosPara('idioma'), function (l) { return l.idioma; }, 'sin idioma'),
    FILTROS.idioma,
    function (v) { alternar('idioma', v); });
}

function pintarSexo() {
  pintarBarras('barras-sexo',
    agrupar(librosPara('sexo'), function (l) {
      return (AUTORES[String(l.autor)] || {}).sexo;
    }, 'sin dato'),
    FILTROS.sexo,
    function (v) { alternar('sexo', v); });
}

function pintarPais() {
  pintarBarras('barras-pais',
    agrupar(librosPara('pais'), function (l) {
      return (AUTORES[String(l.autor)] || {}).nacionalidad;
    }, 'sin dato'),
    FILTROS.pais,
    function (v) { alternar('pais', v); });
}

function pintarFormatos() {
  var base = librosPara('formato');
  var claves = {};
  base.forEach(function (l) { claves[l.clave] = true; });
  var lecs = lecturasPara('formato').filter(function (le) {
    return claves[String(le.libro)] === true;
  });

  pintarBarras('barras-formatos',
    agrupar(lecs, function (le) { return le.formato; }, 'sin formato'),
    FILTROS.formato,
    function (v) { alternar('formato', v === '__vacio' ? '' : v); });
}

function pintarAnios() {
  var base = librosPara('anio');
  var claves = {};
  base.forEach(function (l) { claves[l.clave] = true; });

  var mapa = {};
  lecturasPara('anio').forEach(function (le) {
    if (!claves[String(le.libro)]) return;
    var a = anioDe(le) || '__vacio';
    mapa[a] = (mapa[a] || 0) + 1;
  });

  var datos = Object.keys(mapa).sort().map(function (k) {
    return {
      valor: k,
      etiqueta: k === '__vacio' ? 'sin fecha' : k,
      cuenta: mapa[k]
    };
  });

  pintarBarras('barras-anios', datos, FILTROS.anio, function (v) { alternar('anio', v); });
}

/* ---------- todos los libros ---------- */

var COLS_LIBROS = [
  { titulo: 'Título', col: 'titulo', texto: function (l) { return l.titulo || '(sin título)'; } },
  { titulo: 'Autor', col: 'autor', texto: function (l) { return nombreAutor(l.autor); } },
  { titulo: 'Nota', col: 'nota', num: true, dir: -1, texto: function (l) { return l.nota ? numero(l.nota) : '—'; }, orden: function (l) { return Number(l.nota) || -1; } },
  { titulo: 'Págs.', col: 'npaginas', num: true, dir: -1, clase: 'oculto-movil', texto: function (l) { return fmt(l.npaginas); }, orden: function (l) { return num(l.npaginas); } },
  { titulo: 'Idioma', col: 'idioma', clase: 'oculto-movil', texto: function (l) { return l.idioma || '—'; } },
  { titulo: 'Género', col: 'genero', clase: 'oculto-movil', texto: function (l) { return l.genero || '—'; } },
  { titulo: 'Veces', col: 'veces', num: true, dir: -1, texto: function (l) { return String(vecesDe(l)); }, orden: function (l) { return vecesDe(l); } },
  { titulo: 'Última', col: 'ultima', dir: -1, clase: 'oculto-movil', texto: function (l) { return fecha(ultimaDe(l)) || '—'; }, orden: function (l) { return ultimaDe(l) || ''; } }
];

function pintarLibros() {
  var buscado = norm(BUSQUEDA);

  var filas = LIBROS_FILTRADOS.filter(function (l) {
    if (!buscado) return true;
    return norm((l.titulo || '') + ' ' + nombreAutor(l.autor)).indexOf(buscado) !== -1;
  });

  filas = ordenar(filas, COLS_LIBROS, ORDEN_LIBROS);

  $('libros-cuenta').textContent = 'Mostrando ' + fmt(filas.length) + ' de ' +
    fmt(LIBROS_FILTRADOS.length) + ' libros';

  pintarTabla('tabla-libros', COLS_LIBROS, filas, ORDEN_LIBROS, true);
}

/* ---------- revisar ---------- */

function pintarRevisar() {
  var base = librosPara('calidad');

  var cuentas = {
    sinopsis: 0,
    portada: 0,
    isbn: 0,
    anio: 0,
    'anio-raro': 0
  };

  base.forEach(function (l) {
    if (!l.sinopsis) cuentas.sinopsis++;
    if (!l.portada) cuentas.portada++;
    if (!l.isbn) cuentas.isbn++;
    if (!num(l['año'])) cuentas.anio++;
    if (num(l['año']) > ANIO_ACTUAL) cuentas['anio-raro']++;
  });

  $('revisar').innerHTML = Object.keys(cuentas).map(function (clave) {
    var activa = FILTROS.calidad === clave ? ' activa' : '';
    return '<li><button type="button" class="chip' + activa + '" data-calidad="' + clave +
      '">' + esc(ETIQUETAS_CALIDAD[clave]) + ': ' + fmt(cuentas[clave]) + '</button></li>';
  }).join('');

  var raros = LIBROS.filter(function (l) { return num(l['año']) > ANIO_ACTUAL; });
  var extra = [];
  if (raros.length) {
    extra.push('Años fuera de rango: ' + raros.map(function (l) {
      return (l.titulo || '(sin título)') + ' (' + l['año'] + ')';
    }).join(', ') + '.');
  }
  var sinFin = LECTURAS.filter(function (le) { return !le.fechaFin; }).length;
  if (sinFin) extra.push(sinFin + ' lecturas sin fecha de fin.');
  $('revisar-extra').textContent = extra.join(' ');
}

/* ---------- filtros activos ---------- */

function pintarFiltrosActivos() {
  var partes = [];

  if (FILTROS.estado) partes.push('estado: ' + ETIQUETAS_ESTADO[FILTROS.estado]);
  if (FILTROS.nota) partes.push('nota ≥ ' + numero(FILTROS.nota));
  if (FILTROS.paginasMin) partes.push('más de ' + fmt(FILTROS.paginasMin) + ' págs.');
  if (FILTROS.tamano) partes.push('tamaño: ' + FILTROS.tamano);
  if (FILTROS.genero) {
    partes.push('género: ' + (FILTROS.genero === '__vacio' ? 'sin género' : FILTROS.genero));
  }
  if (FILTROS.idioma) {
    partes.push('idioma: ' + (FILTROS.idioma === '__vacio' ? 'sin idioma' : FILTROS.idioma));
  }
  if (FILTROS.autor) partes.push('autor: ' + nombreAutor(FILTROS.autor));
  if (FILTROS.formato) partes.push('formato: ' + FILTROS.formato);
  if (FILTROS.anio) {
    partes.push('año: ' + (FILTROS.anio === '__vacio' ? 'sin fecha' : FILTROS.anio));
  }
  if (FILTROS.sexo) {
    partes.push('sexo: ' + (FILTROS.sexo === '__vacio' ? 'sin dato' : FILTROS.sexo));
  }
  if (FILTROS.pais) {
    partes.push('país: ' + (FILTROS.pais === '__vacio' ? 'sin dato' : FILTROS.pais));
  }
  if (FILTROS.calidad) partes.push('falta: ' + ETIQUETAS_CALIDAD[FILTROS.calidad]);

  $('filtros-activos').textContent = partes.length
    ? partes.join(' · ')
    : 'Sin filtros';
}

/* ---------- controles ---------- */

function opciones(select, pares) {
  var html = '<option value="">Todos</option>';
  pares.forEach(function (p) {
    html += '<option value="' + esc(p.valor) + '">' + esc(p.texto) + '</option>';
  });
  select.innerHTML = html;
}

function valoresUnicos(lista, fn) {
  var mapa = {};
  lista.forEach(function (x) {
    var v = fn(x);
    if (v) mapa[v] = true;
  });
  return Object.keys(mapa).sort(function (a, b) {
    return a.localeCompare(b, 'es');
  });
}

/**
 * Ajusta los topes de los deslizadores a los datos reales: en el extremo
 * derecho siempre queda al menos un libro (redondeo hacia abajo).
 */
function ajustarRangos() {
  var notas = [];
  var paginas = [100];

  LIBROS.forEach(function (l) {
    var n = Number(l.nota);
    if (isFinite(n) && n > 0) notas.push(n);
    paginas.push(num(l.npaginas));
  });

  if (notas.length) {
    var topeNota = Math.floor(Math.max.apply(null, notas) * 10) / 10;
    if (topeNota > 0) $('nota').max = topeNota;
  }

  var topePaginas = Math.floor(Math.max.apply(null, paginas) / 25) * 25;
  if (topePaginas >= 25) $('paginas').max = topePaginas;
}

function prepararControles() {
  var selGenero = document.querySelector('[data-filtro="genero"]');
  var selIdioma = document.querySelector('[data-filtro="idioma"]');
  var selAutor = document.querySelector('[data-filtro="autor"]');
  var selSexo = document.querySelector('[data-filtro="sexo"]');
  var selPais = document.querySelector('[data-filtro="pais"]');
  var selAnio = document.querySelector('[data-filtro="anio"]');

  ajustarRangos();

  var generos = valoresUnicos(LIBROS, function (l) { return l.genero; });
  generos.push('__vacio');
  opciones(selGenero, generos.map(function (g) {
    return { valor: g, texto: g === '__vacio' ? '(sin género)' : g };
  }));

  var idiomas = valoresUnicos(LIBROS, function (l) { return l.idioma; });
  idiomas.push('__vacio');
  opciones(selIdioma, idiomas.map(function (i) {
    return { valor: i, texto: i === '__vacio' ? '(sin idioma)' : i };
  }));

  var codas = Object.keys(AUTORES).filter(function (k) { return AUTORES[k]; });
  codas.sort(function (a, b) {
    return nombreAutor(a).localeCompare(nombreAutor(b), 'es');
  });
  opciones(selAutor, codas.map(function (k) {
    return { valor: k, texto: nombreAutor(k) };
  }));

  var sexos = valoresUnicos(Object.keys(AUTORES).map(function (k) { return AUTORES[k]; }),
    function (a) { return a.sexo; });
  sexos.push('__vacio');
  opciones(selSexo, sexos.map(function (s) {
    return { valor: s, texto: s === '__vacio' ? '(sin dato)' : s };
  }));

  var paises = valoresUnicos(Object.keys(AUTORES).map(function (k) { return AUTORES[k]; }),
    function (a) { return a.nacionalidad; });
  paises.push('__vacio');
  opciones(selPais, paises.map(function (p) {
    return { valor: p, texto: p === '__vacio' ? '(sin dato)' : p };
  }));

  var anios = valoresUnicos(LECTURAS, function (le) { return anioDe(le); });
  anios.push('__vacio');
  opciones(selAnio, anios.map(function (a) {
    return { valor: a, texto: a === '__vacio' ? '(sin fecha)' : a };
  }));

  document.querySelectorAll('[data-filtro]').forEach(function (sel) {
    sel.addEventListener('change', function () {
      FILTROS[sel.getAttribute('data-filtro')] = sel.value;
      aplicar();
    });
  });

  $('nota').addEventListener('input', function () {
    FILTROS.nota = Number(this.value);
    $('nota-valor').textContent = FILTROS.nota ? '≥ ' + numero(FILTROS.nota) : 'todas';
    aplicar();
  });

  $('paginas').addEventListener('input', function () {
    FILTROS.paginasMin = Number(this.value);
    $('paginas-valor').textContent = FILTROS.paginasMin
      ? '> ' + fmt(FILTROS.paginasMin)
      : 'todas';
    aplicar();
  });

  $('tamanos').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tamano]');
    if (!b) return;
    FILTROS.tamano = FILTROS.tamano === b.getAttribute('data-tamano')
      ? ''
      : b.getAttribute('data-tamano');
    aplicar();
  });

  $('revisar').addEventListener('click', function (e) {
    var b = e.target.closest('[data-calidad]');
    if (!b) return;
    var clave = b.getAttribute('data-calidad');
    FILTROS.calidad = FILTROS.calidad === clave ? '' : clave;
    sincronizarControles();
    aplicar();
  });

  $('tabla-autores').addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-autor]');
    if (!tr) return;
    if (e.target.closest('th')) return;
    var coda = tr.getAttribute('data-autor');
    FILTROS.autor = FILTROS.autor === coda ? '' : coda;
    sincronizarControles();
    aplicar();
  });

  $('buscar').addEventListener('input', function () {
    BUSQUEDA = this.value;
    pintarLibros();
  });

  $('btn-limpiar').addEventListener('click', function () {
    Object.keys(FILTROS).forEach(function (k) {
      FILTROS[k] = (k === 'nota' || k === 'paginasMin') ? 0 : '';
    });
    BUSQUEDA = '';
    $('buscar').value = '';
    sincronizarControles();
    aplicar();
  });

  activarOrden('tabla-libros', COLS_LIBROS, ORDEN_LIBROS, pintarLibros);
  activarOrden('tabla-autores', COLS_AUTORES, ORDEN_AUTORES, pintarAutores);
}

function sincronizarControles() {
  document.querySelectorAll('[data-filtro]').forEach(function (sel) {
    sel.value = FILTROS[sel.getAttribute('data-filtro')] || '';
  });
  $('nota').value = FILTROS.nota;
  $('paginas').value = FILTROS.paginasMin;
  $('nota-valor').textContent = FILTROS.nota ? '≥ ' + numero(FILTROS.nota) : 'todas';
  $('paginas-valor').textContent = FILTROS.paginasMin
    ? '> ' + fmt(FILTROS.paginasMin)
    : 'todas';
}

/* ---------- pestañas ---------- */

function mostrarPestana(nombre) {
  document.querySelectorAll('[data-pestana]').forEach(function (b) {
    var activa = b.getAttribute('data-pestana') === nombre;
    b.classList.toggle('activa', activa);
    b.setAttribute('aria-pressed', activa ? 'true' : 'false');
  });

  document.querySelectorAll('main > #contenido > section').forEach(function (p) {
    p.hidden = p.id !== 'panel-' + nombre;
  });
}

function prepararPestanas() {
  document.querySelectorAll('[data-pestana]').forEach(function (b) {
    b.addEventListener('click', function () {
      mostrarPestana(b.getAttribute('data-pestana'));
      window.scrollTo(0, 0);
    });
  });

  mostrarPestana('resumen');

  // En el móvil los filtros empiezan plegados para no comerse la pantalla.
  if (window.matchMedia('(max-width: 760px)').matches) {
    $('panel-filtros').open = false;
  }
}

/* ---------- arranque ---------- */

async function iniciar() {
  if (!CONFIGURADO) {
    $('estado').textContent = 'Falta firebase-config.js: no hay base de datos configurada.';
    $('estado').className = 'error';
    return;
  }

  try {
    await iniciarFirebase();
    await cargarDatos();
    prepararControles();
    sincronizarControles();
    prepararPestanas();
    aplicar();
    $('estado').hidden = true;
    $('contenido').hidden = false;
  } catch (e) {
    $('estado').textContent = 'No se pudo cargar la biblioteca: ' + (e.message || e);
    $('estado').className = 'error';
  }
}

iniciar();
