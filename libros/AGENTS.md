# AGENTS.md

Static barcode/ISBN app: plain HTML + classic `<script>` JS. No `package.json`, bundler,
tests, linter or CI. Verification means serving the folder and using the page while watching
the browser console.

## Layout

- `lector.html` + `lector.js` — the active app. Three input paths (camera EAN-13 via Quagga,
  OCR of the printed number via Tesseract.js, manual input), ISBN lookup in Google Books with
  an Open Library fallback, completion of the synopsis/year with the Spanish Wikipedia and
  Wikidata, then save to Realtime Database. All UI text is Spanish.
- `consulta.html` + `consulta.js` — read-only library dashboard. Reads
  `/libros`, `/autores` and `/lecturas`, derives times read from the readings rows (the `codlec`
  does not encode re-reads) and recomputes every panel live from one shared filter state
  (nota/páginas sliders, clickable bars for genre/language/sex/nationality/format/year,
  sortable tables). Six tabs; every section is a native `<details>` and the filters start
  collapsed on mobile. All UI text is Spanish.
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
  wired in `firebase-config.js`; its data is already imported (268/113/316). The old
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
  ISBN. `lecturas.libro` stores the book's *key* (string), not a numeric FK.
- `/meta/ultimoCodl`, `ultimoCoda`, `ultimoCodlec` store the last id used. Allocate with
  `transaction()` (see `siguienteId`), never by counting rows: `codlec` already reaches 5115.
- `database.rules.json` requires `auth != null`; the page calls `signInAnonymously()` and
  only warns if it fails (today's open rules still allow writes). Once these rules are
  published, a disabled Anonymous provider makes every save fail with `PERMISSION_DENIED`.
- Import flow: `powershell -ExecutionPolicy Bypass -File importar/exportar-mdb.ps1` →
  `importar/datos-firebase.json` (113 autores / 268 libros / 316 lecturas), then Firebase
  console ⋮ → Importar JSON. Details in `importar/README.md`. Import replaces the whole
  database, including books added from the page since the last export.

## Sinopsis, año e idioma

- `completarFicha()` leaves the record ready to save:
  - `sinopsis` is **always in Spanish**, whatever the language of the scanned edition:
    Spanish Wikipedia article first (`articuloWikipedia()`), then a Spanish edition of the
    same work in Open Library (`sinopsisOpenLibraryEspanol()`), then a Spanish Google Books
    edition. If none exists, the status line says so and the edition's text is kept.
  - `año` is the year the work was first published, not the edition's, which goes in
    `añoEdicion`. The Wikipedia short description (`novela de Jane Austen de 1813`) or
    Wikidata `P577` win; then Open Library's search index; then the oldest Google Books
    edition.
  - `idioma` stores the `.mdb` label (`castellano`, `inglés`, `francés`, …) through
    `IDIOMAS`; it never chooses the synopsis language.
- Wikipedia + Wikidata are preferred because Open Library's `first_publish_date` is often
  wrong (1853 for *Orgullo y prejuicio*, 1896 for the *Quijote*) while Wikipedia gives 1813
  and 1605. `es.wikipedia.org`, `www.wikidata.org` and `openlibrary.org` all send
  `access-control-allow-origin: *`, so no proxy is needed.
- `consultarOpenLibrary()` prefers the work's authors when the edition's list doesn't match:
  the *Quijote* edition listed Unamuno and Grossman (prologuist and translator). `mismoAutor()`
  compares surnames as whole words so "Miguel de Unamuno" no longer matches "Miguel de
  Cervantes".

## Gotchas

- Camera (`getUserMedia`) and clipboard need a secure context. `file://` gives no camera and
  throws on clipboard access. Serve with `python -m http.server 8765` and open
  `http://localhost:8765/lector.html`.
- `quagga.min.js` and `z/zxing.js` are vendored minified builds — never edit. `z/video.js`
  calls `ZXing._resize`, `ZXing._decode_any`, `ZXing.HEAPU8` and `Runtime.addFunction`.
- Tesseract.js loads on demand from jsDelivr (`@7`, ~10 MB the first time, browser-cached).
  OCR only works because `prepararLienzo()` upscales, converts to grayscale and stretches
  contrast; removing that step makes the printed numbers unreadable. Both input modes use the
  live camera: `iniciarCamara()`/Quagga for the barcode and `iniciarCamaraOcr()` for the printed
  number, which draws the current frame to a canvas on «Hacer foto» (no file picker). Starting
  one stops the other, and `detenerCamaraOcr()` must not clear `#camara` while Quagga is
  scanning.
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
