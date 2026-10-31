# AGENTS.md

Static barcode/ISBN app: plain HTML + classic `<script>` JS. No `package.json`, bundler,
tests, linter or CI. Verification means serving the folder and using the page while watching
the browser console.

## Layout

- `lector.html` + `lector.js` — the active app. Three input paths (camera EAN-13 via Quagga,
  OCR of the printed number via Tesseract.js, manual input), ISBN lookup in Google Books with
  an Open Library fallback, completion of the synopsis/year with the Spanish Wikipedia and
  Wikidata, then save to Realtime Database. All UI text is Spanish.
- `consulta.html` + `consulta.js` — library dashboard; writes only in two places: merging
  duplicate authors (Revisar tab) and setting the finish date of a reading (En curso tab).
  Reads `/libros`, `/autores` and `/lecturas`, derives times read from the readings rows (the
  `codlec` does not encode re-reads) and recomputes every panel live from one shared filter
  state (nota/páginas sliders, clickable bars for
  genre/language/sex/nationality/format/year, sortable tables). Seven tabs; every section is a
  native `<details>` and the filters start collapsed on mobile. All UI text is Spanish. Every
  book title and author name is a link to `ficha.html`.
- The searchable table («Todos los libros», `#tabla-libros`) is the first block of the Libros
  tab and is repeated right after the cards in Resumen (`#tabla-libros-resumen`), because
  Resumen is the landing tab. `pintarLibros()` paints both copies from `LIBROS_FILTRADOS` and
  `ORDEN_LIBROS`; the two search boxes share `BUSQUEDA` through `sincronizarBusqueda()`. When
  touching one of them, change both ids and both `activarOrden()` calls.
- `ficha.html` + `ficha.js` — sheet for one book (`?libro=<clave>`) or one author
  (`?autor=<coda>`). Edits the book's or author's own fields and shows, collapsed, the book's
  readings or the author's works. This is the third write surface (see «Ficha de libro y
  autor»).
- `index.html` — legacy demo, all inline: Quagga + Firebase project `fireui-777` + Google
  Books. Its `isbn()` throws when clipboard text has no digits. Don't extend it; work in
  `lector.*`.
- `z/` — older ZXing asm.js demo (`z/zxing.js` is a 1.3 MB vendored build). `z/web.config`
  only adds the `.wasm` MIME map for IIS; there is no `.wasm` file in the repo.
- `libros.js` — dead code; no HTML loads it, and its Firebase project (`libros-rls777`) no
  longer exists.

## Data and Firebase

- The catalog's source of truth is `C:\Users\Rober\Documents\lieder\Libros.mdb` (Access):
  `autores(coda)`, `libros(codl, año, npaginas, nota, …, autor→autores.coda)`,
  `lecturas(codlec, fechaInicio, fechaFin, formato, libro→libros key, ppm)`, plus an unused
  `Todos` list. **`libros` has no ISBN column**, which is why the page exists.
- `libros-rls777` is live again (`https://libros-rls777.firebaseio.com`) and is the project
  wired in `firebase-config.js`; the `.mdb` import is 268/113/316 and the live database now has
  269 books, 114 authors and 317 readings (the extras were added from the page). The old
  `fireui-777` config in `index.html` is still deactivated (HTTP 423) — leave it alone.
- Public read/write is currently open. To close it, enable Authentication → Anonymous
  **before** publishing `database.rules.json`, otherwise every save fails.
- After import the REST listing of `/libros` (and `/autores`) contains `null` placeholder
  keys for the missing numeric ids. The SDK's `forEach` skips them; do not use
  `Object.keys(...).length` as the record count.
- Realtime Database was chosen over Firestore/Cloud SQL: the `.mdb` dump imports as plain JSON
  from the console, and ~700 nodes need no server-side queries.
- Model: `/libros/{isbn13 | codl}`, `/autores/{coda}`, `/lecturas/{codlec}`, `/meta/ultimo*`.
  New scanned books are keyed by ISBN-13; imported books keep `codl` because they have no
  ISBN, and a scan of one of them adds the ISBN to that same row (see below).
  `lecturas.libro` stores the book's *key* (string), not a numeric FK.
- `/meta/ultimoCodl`, `ultimoCoda`, `ultimoCodlec` store the last id used. Allocate with
  `transaction()` (see `siguienteId`), never by counting rows: `codlec` already reaches 5115.
- `database.rules.json` requires `auth != null`; the page calls `signInAnonymously()` and
  only warns if it fails (today's open rules still allow writes). Once these rules are
  published, a disabled Anonymous provider makes every save fail with `PERMISSION_DENIED`.
- Import flow: `powershell -ExecutionPolicy Bypass -File importar/exportar-mdb.ps1` →
  `importar/datos-firebase.json` (113 autores / 268 libros / 316 lecturas), then Firebase
  console ⋮ → Importar JSON. Details in `importar/README.md`. Import replaces the whole
  database, including books added from the page since the last export.

## Sinopsis, año, idioma y páginas

- `completarFicha()` leaves the record ready to save:
  - `sinopsis` is **always in Spanish**, whatever the language of the scanned edition:
    Spanish Wikipedia article first (`articuloWikipedia()`), then a Spanish edition of the
    same work in Open Library (`sinopsisOpenLibraryEspanol()`), then a Spanish Google Books
    edition. If none exists, the status line says so and the edition's text is kept.
    The search adds the author to the query (`"El jugador" Fiódor Dostoievski`): with the
    title alone, Wikipedia returns the disambiguation page first and the novel was missed.
    When an article is used, `wikipedia` stores its URL; `lector.html` shows the link under
    the title and `ficha.html` reads the saved field.
  - `año` is the year the work was first published, not the edition's, which goes in
    `añoEdicion`. The Wikipedia short description (`novela de Jane Austen de 1813`) or
    Wikidata `P577` win; then Open Library's search index; then the oldest Google Books
    edition.
  - `idioma` stores the `.mdb` label (`castellano`, `inglés`, `francés`, …) through
    `IDIOMAS`; it never chooses the synopsis language.
  - `npaginas` is filled whenever possible (`paginasDeLibro()`): the edition's own
    `pageCount`/`number_of_pages` first — most Open Library editions do not have it — and
    otherwise the median of the work's other editions, preferring the same language and then
    the same publisher/year (±1), so a Spanish edition does not take the English original's
    pages. That value is flagged `paginasEstimadas` and the card shows
    «Páginas: 322 (de otra edición)»; the flag is never saved. `paginasGoogleBusqueda()` is the
    last resort (Google limits hard by IP) and an ISBN that exists nowhere leaves
    `npaginas: null` after about a second. The 200-edition fetch
    (`edicionesObraOpenLibrary()`, ~160 KB) only happens when the pages are missing and is
    cached per work.
- La tarjeta de `lector.html` es un formulario (`#form-ficha`): título, autor, año de la obra,
  año de la edición, páginas, idioma, género, nota media y sinopsis se pueden corregir antes de
  guardar. `guardar()` lee esos campos, no `ultimoLibro.info`, y valida solo lo escrito: el
  título no puede quedar vacío; año y año de edición son enteros 1–2100; páginas entero
  positivo; nota 0–10 (todos opcionales). La cabecera (`#titulo`, `#autores`) se actualiza al
  escribir. Editar aquí es la salida cuando el año encontrado es el de la edición y no el de la
  obra (p. ej. *El jugador*, 1867). `wikipedia` se incluye en `CAMPOS_FICHA`, pero no en
  `leerLibro()` de `ficha.js`: guardar desde la ficha no lo borra.
- Wikipedia + Wikidata are preferred because Open Library's `first_publish_date` is often
  wrong (1853 for *Orgullo y prejuicio*, 1896 for the *Quijote*) while Wikipedia gives 1813
  and 1605. `es.wikipedia.org`, `www.wikidata.org` and `openlibrary.org` all send
  `access-control-allow-origin: *`, so no proxy is needed.
- `consultarOpenLibrary()` prefers the work's authors when the edition's list doesn't match:
  the *Quijote* edition listed Unamuno and Grossman (prologuist and translator). `mismoAutor()`
  compares surnames as whole words so "Miguel de Unamuno" no longer matches "Miguel de
  Cervantes".

## Libro ya catalogado (relectura)

- Los libros importados tienen clave `codl` y no tienen ISBN, así que escanear un ISBN no los
  encontraba: `guardar()` creaba otra ficha con la clave del ISBN y la lectura se iba a la
  copia nueva. Por eso, cuando `buscarEnFirebase(isbn)` no devuelve nada (ni por clave ni por
  el campo `isbn`), `buscar()` llama a `buscarPorTitulo(info)`.
- `titulosParecidos()` compara `normalizarTitulo()`: sin acentos, sin subtítulo (lo que va tras
  `:` o `;`), sin paréntesis, sin signos y sin artículos. Vale el título exacto y que el más
  corto esté contenido en el más largo con dos palabras como mínimo («El hobbit» ~ «El hobbit
  ilustrado», pero «Casa» no vale por «La casa de los espíritus»). El autor se compara con
  `mismoAutor()`, el mismo criterio que al crear autores; si la ficha no tiene `autor`, basta
  el título. Además el **idioma** tiene que ser compatible: el catálogo guarda la edición que
  se leyó, así que «The Hobbit» (37, inglés) y «El Hobbit» (277, castellano) son dos libros
  distintos aunque compartan autor y año (ver abajo).
- `idiomasDeLibro(info)` saca el idioma de la edición de `info.language` (ISO o SIL) y, si no
  viene, de las palabras vacías del título (`idiomaDeTitulo()`: «El Hobbit» → es, «The Hobbit»
  → en). `idiomasDeEtiqueta()` traduce las etiquetas del `.mdb` (`castellano`, `inglés`,
  `francés-castellano`…) a códigos. `idiomasCompatibles()` solo descarta cuando los dos
  idiomas se conocen y no coinciden; con un idioma desconocido se acepta la ficha, y si queda
  más de una candidata se pregunta.
- Con una sola candidata, `ultimoLibro.existente = { clave, porTitulo: true }`: la tarjeta
  muestra «En tu base: sí (N, sin ISBN)», el botón pasa a «Añadir el ISBN a esa ficha» y
  «Empezar a leer» ya se puede usar con esa clave sin guardar nada. Una relectura es solo una
  fila nueva en `/lecturas`.
- Con varias candidatas (`ambiguo`) no se adivina: aparece un `<select>` (`#existente-lista`)
  con las claves y sus años. Elegir una equivale a haberla encontrado; «Guardar como libro
  nuevo» mantiene el comportamiento antiguo. Hoy las 269 fichas se reconocen a sí mismas sin
  ninguna ambigua.
- `guardar()` no pisa el catálogo: si la clave no es el ISBN (ficha importada, o una a la que
  ya se añadió el ISBN), `cambiosConservadores()` escribe **solo** los campos vacíos de
  `CAMPOS_FICHA` (isbn, título, año, añoEdición, npaginas, nota, idioma, genero, sinopsis,
  autor, portada). No toca `codl` ni `comentario`, pone `actualizado` solo si algo cambió,
  conserva el ISBN que ya tuviera (y lo dice en el mensaje) y nunca reserva `codl`. Una ficha
  con clave ISBN (`9788408045755`) se sigue actualizando entera, como antes.
- Si el título del catálogo y el que devuelve Open Library no se parecen (otra traducción), no
  se reconoce y se guarda como libro nuevo. Es preferible a enlazar dos obras distintas.

## Lecturas

- A reading is a `/lecturas/{codlec}` row: `codlec`, `fechaInicio`, `fechaFin`, `formato` and
  `libro` (the book's key). A row with `fechaInicio` and no `fechaFin` is a **lectura en
  curso**; there is no separate node and no `enCurso` flag. `lecturaEnCurso()` is the single
  test, used by both pages.
- In `lector.html`, after a successful save `prepararLectura(clave)` enables «Empezar a leer».
  The form (`empezarLectura()`) prefills today's date, allows an earlier start (a book read
  before) and an optional finish date, then `registrarLectura()` writes the row with
  `siguienteId('ultimoCodlec')`. It refuses a finish date earlier than the start and a second
  open reading of the same book. Started readings are not saved with the book: the user has
  to press the button, so adding a book does not imply reading it.
- `lecturasPorLibro` caches **all** rows grouped by book key (`db.ref('lecturas').get()` once,
  ~300 rows, same client-side scan as `buscarEnFirebase`); `registrarLectura()` appends the new
  row to the cache and re-sorts it. `lecturasHechas(clave)` are the ones that count as read
  (`!lecturaEnCurso`), so the open one is never counted.
- `pintarLecturasPrevias(clave)` fills, inside `#lectura-caja`, the «Ver lecturas previas (N)»
  link next to «Ver lecturas en curso», the line «Leído N veces. Última lectura: dd/mm/aaaa
  (del … al …)» and a collapsed list of every reading with its format. It runs from
  `prepararLectura()`, so it shows up as soon as an existing record is found — even if the book
  is never saved — and refreshes after a registration. «Última lectura» sorts by `fechaFin`,
  not by `fechaInicio`.
- Opening the same book again shows «Ya hay una lectura en curso» and hides «Empezar a leer»,
  but keeps the previous readings visible.
- In `consulta.html` the «En curso» tab lists open readings with a date field (today by
  default, `min` = start date) and «Dar por acabado», which sets only
  `/lecturas/{codlec}/fechaFin` and then calls `recalcularLecturas()` + `aplicar()`.
  `lector.html` links there with `consulta.html?pestana=curso`; `prepararPestanas()` reads the
  `pestana` query parameter.
- `recalcularLecturas()` rebuilds `POR_LIBRO`. A reading en curso does **not** count as read
  (no `veces`, no pages, no author pages/days) until it has a `fechaFin`; otherwise a book
  would appear as read the day it is started. The old rows with neither date (codlec 77 and
  260) do count, as imported history.
- The «En curso» list deliberately ignores the filters: a filter hiding a half-read book
  would make it impossible to finish from the panel.

## Ficha de libro y autor

- `consulta.html` links every book title (`enlaceLibro`) and author name (`enlaceAutor`) to
  `ficha.html?libro=<clave>` / `ficha.html?autor=<coda>`. `pintarTabla()` accepts an optional
  `html` per column; `texto` is still what sorting uses, so never leave it out. In
  `#tabla-autores`, clicks on a link navigate; clicks elsewhere in the row still toggle the
  author filter.
- `?libro=` fills the book form and shows its «Lecturas» `<details>` (newest first, an in-course
  reading on top and marked «en curso») plus, below, the book's author form with its «Obras»
  `<details>` collapsed. The «Nueva lectura» form inside that block (`#form-lectura`,
  `registrarLecturaFicha()`) writes the same `/lecturas` row as `lector.html`
  (`siguienteCodlec()` repeats the transaction on `meta/ultimoCodlec`, initial = highest loaded
  `codlec`); start defaults to today, finish is optional, and it refuses a second in-course
  reading, a finish before the start or any date after today. The table and the author's
  «Veces» repaint in place. `?autor=` shows only the author form with «Obras» open.
  `← Biblioteca` uses `document.referrer` when it came from `consulta.html`, so the tab and
  filters survive.
- Both forms save with `update()` and only send changed fields; `guardarLibro()` also writes
  `actualizado` with `ServerValue.TIMESTAMP`. `/autores` rows have no `actualizado` field, so
  `guardarAutor()` must not add one. An empty numeric field is written as `null`; empty strings
  stay `''` (as `lector.js` does).
- Validation is client-side: title non-empty, `nota` 0–10, `año`/`añoEdicion` integers 1–2100,
  `npaginas` a positive integer, `muerte` not before `nacimiento`. Both forms are `novalidate`,
  so only the fields that changed are validated: the one imported book with `año: 20120` can
  still have its synopsis edited. `revisarDatosLibro()` / `revisarDatosAutor()` show a
  non-blocking warning for such legacy values.
- After saving, the in-memory row is refreshed and the header, readings, works and author select
  are repainted. If the book's author changes, the author section switches to the new person; if
  the author's display name changes, the book's author `<select>` is rebuilt.
- The cover is only displayed (`#portada-caja`); its URL is edited in the book form.
- The header shows a Wikipedia link (`#wikipedia-caja`) when the record has `wikipedia`, the
  URL saved by `lector.js` when the article was found; `pintarWikipedia()` hides it otherwise
  (and on author sheets).

## Autores

- `asegurarAutor()` only creates an author when the book is saved and the person is not
  already in `/autores`. It returns `{ coda, notas }`; the note
  ("Autor nuevo: … (Reino Unido, 1775–1817, mujer).") is appended to the save message.
  - Matching cannot be a plain string compare: 64 of the 113 imported rows store only the
    surname in `autor` (`"Pérez-Reverte"`, `"García Márquez"`) while `nombre`/`apellidos`
    hold the rest, so an exact lookup would duplicate most authors. `mismoAutor()` splits
    both sides into tokens (`tokensNombre()`, accents/dots/hyphens removed) and accepts when
    the tail of the scanned name starts the stored surnames and the remaining words match the
    given names, initials included (`"J.R.R. Tolkien"` → `"John Ronald Reuel Tolkien"`).
  - Two rows matching the same name (`"Cornwell"`) are treated as ambiguous: `buscarAutor()`
    returns nothing rather than linking to the wrong person.
  - `limpiarNombreAutor()` runs first, so `"Pérez-Reverte, Arturo"` is looked up as
    `"Arturo Pérez-Reverte"`.
- Before inserting, `fichaDeAutor()` fills `nombre`/`apellidos`, `nacionalidad`, `nacimiento`,
  `muerte` and `sexo`:
  - Search in `es.wikipedia.org` by plain name; accept the first article whose short
    description looks like a writer (`TIPO_AUTOR`) **and** whose title matches the name
    (`nombreDeAutorCoincide()`: the surname must appear and the title's given names must
    appear in the input, initials allowed; a one-word name must match the title exactly).
    That is what keeps `"Gabriel García Lorca"` from taking Federico's dates. Anything else
    is discarded rather than guessed: with no clear match the author is created with empty
    fields, like before.
  - Wikidata claims from the article's Q: `P21` sex → `varón`/`mujer` (the `.mdb` vocabulary),
    `P27` country (Spanish label, with `PAISES_ALIAS` for historical names), `P569`/`P570`
    years, `P735`/`P734` given/family names.
  - The catalog names British authors by constituent country (`Inglaterra`, `Gales`,
    `Escocia`), so `"Reino Unido"` is only a last resort. When `P27` resolves to the UK,
    `fichaDeAutor()` refines it in this order: `P27` itself naming England/Scotland/Wales/
    Northern Ireland (`PAISES_UK` QIDs), the article's gentilicio (`escritor galés` →
    Gales, `GENTILICIOS_UK`), and finally the birthplace (`P19`) walking up `P131` a few
    levels (`paisUkDeNacimiento()`). Orwell (born in India, "escritor británico") stays
    `Reino Unido`; Tolkien is `Inglaterra` because the Spanish article calls him "inglés".
  - `partirNombre()` splits from the **article title** (`Gabriel García Márquez` →
    `Gabriel` + `García Márquez`), using the given names only to find where the name ends;
    that avoids the redundant compounds Wikidata sometimes returns.
  - With dual citizenship (`P27` has two values) `paisPreferido()` picks the one the article
    description mentions (`escritora chilena` → Chile) instead of blindly taking the first.
  - Many Spanish Wikipedia articles have no short description (Richard Adams, for instance).
    Those are not discarded: `esEscritorWikidata()` checks the occupations (`P106`) and the
    row is used only if one of them is a writing job (`TIPO_AUTOR`).
- Only the book's first author is registered; books with several authors keep the rest
  unlinked. A different spelling of the same author creates a second row.

## Duplicados de autor

- The Revisar tab of `consulta.html` lists author rows that may be the same person. Detection
  is deliberately looser than `mismoAutor()` in `lector.js`, because a human confirms every
  merge: `parecidoAutor()` accepts equal names, token-subsequence names with initials
  (`J. R. R.` ~ `John Ronald Reuel`), incomplete surnames (`Pérez-Reverte` ~
  `Pérez-Reverte Gutiérrez`), edit distances of 1–2 (`Follet`/`Follett`) and the same surname
  with the same initial (`Ken`/`Kenneth`). Do not tighten it to `mismoAutor()`: it would miss
  exactly the rows the tool exists to find.
- `gruposDeDuplicados()` unions the matching pairs (union-find) into groups. Each group shows
  every field of every row (coda, nombre, apellidos, autor, nacionalidad, nacimiento, muerte,
  sexo, libros) so the decision is made with the data in view, then «Conservar esta».
- Merging asks for `confirm()`, writes the books first as a single multi-path update
  (`db.ref().update({'libros/<clave>/autor': coda})`), fills the kept row's empty fields from
  the removed ones and only then deletes the surplus `/autores` rows. Books never point at a
  missing author if a write fails halfway.
- Together with «En curso», this is the only part of `consulta.html` that writes to the
  database.

## Gotchas

- `python -m http.server` sends `Last-Modified` and no `Cache-Control`, so the browser caches
  the HTML heuristically: after editing a page, a plain reload may keep the old markup and run
  it with the new `.js`, and the missing ids throw (`Cannot read properties of null (reading
  'addEventListener')`, shown as «No se pudo cargar la biblioteca»). Use `Ctrl+F5`. As a safety
  net, `consulta.js` returns early in `pintarTabla()` / `activarOrden()` and skips missing
  search boxes, so an outdated HTML still loads (just without the newest blocks).
- Camera (`getUserMedia`) and clipboard need a secure context. `file://` gives no camera and
  throws on clipboard access. Serve with `python -m http.server 8765` and open
  `http://localhost:8765/lector.html`.
- `quagga.min.js` and `z/zxing.js` are vendored minified builds — never edit. `z/video.js`
  calls `ZXing._resize`, `ZXing._decode_any`, `ZXing.HEAPU8` and `Runtime.addFunction`.
- Tesseract.js loads on demand from jsDelivr (`@7`, ~10 MB the first time, browser-cached).
  OCR only works because `prepararLienzo()` upscales, converts to grayscale and stretches
  contrast; removing that step makes the printed numbers unreadable. Both input modes use the
  live camera: `iniciarCamara()`/Quagga for the barcode and `iniciarCamaraOcr()` for the printed
  number. The OCR one crops the frame to `RECORTE_OCR` (the white rectangle you see), which is
  drawn by `colocarGuiaOcr()` measured in pixels because the video can be centred and scaled by
  `max-height`; tapping the preview or «Hacer foto» runs `hacerFotoOcr()` (no file picker). The
  tap is received by a transparent `#disparo-ocr` layer on top of the video, because iOS Safari
  does not deliver clicks on a `<video>`. Starting one mode stops the other, and
  `detenerCamaraOcr()` must not clear `#camara` while Quagga is scanning.
- Google Books rate-limits unkeyed IPs (429 is common). `consultarOpenLibrary()` is the
  fallback — keep it. Open Library returns author names in `author` (singular), not `authors`,
  formatted as `"Apellido, Nombre, fechas"`; `limpiarNombreAutor()` fixes that.
- Google Books returns `volumeInfo.description` as HTML. `textoPlano()` strips the tags and
  decodes entities before storing, so `sinopsis` stays plain text like the `.mdb` column.
  Nothing truncates the text anywhere (verified: 944/939-char synopses and a 4.5k round trip).
  The Firebase console *displays* long strings cut with an ellipsis; the stored value is
  complete (open the node's edit panel or export JSON to see it). The page shows the whole
  synopsis under the card.
- Without `.indexOn: "isbn"` in the rules, `orderByChild('isbn')` throws. `buscarEnFirebase`
  catches that and scans `/libros` client-side (268 books, cached in `cacheLibros`). Don't
  remove the fallback unless the rules are guaranteed to be published.
- Every input path funnels through `resolverIsbn()`: it must handle hyphenated text, ISBN-10
  (converted to ISBN-13) and checksum validation. Don't hand-roll a second parser.
- `importar/exportar-mdb.ps1` must stay ASCII-only. Windows PowerShell 5.1 decodes `.ps1`
  without BOM as ANSI and corrupts `[año]`; the real column name is built as
  `'a' + [char]0xF1 + 'o'`. It needs the 64-bit Access Database Engine (ACE) provider.
- Firebase web API keys are public client config, not secrets — don't move them to env vars.
