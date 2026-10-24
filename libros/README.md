# Lector de ISBN

Página estática (sin build, sin framework) para añadir libros a la biblioteca:

- **Código de barras** con la cámara o desde una foto (QuaggaJS, EAN-13).
- **OCR del número impreso**: la página abre la cámara, encuadras el número y pulsas «Hacer
  foto»; no hay que elegir un archivo (Tesseract.js, se descarga solo al usarlo).
- **Input manual** como último recurso.

Valida el dígito verificador, busca los datos en Google Books (con Open Library como
alternativa), completa la sinopsis en español y el año de la obra original con la Wikipedia
española y Wikidata, y guarda en Firebase Realtime Database.

`consulta.html` es el otro lado: un panel de solo lectura con las métricas del catálogo
(libros leídos, lecturas, páginas, nota media, autores, géneros, idiomas…) y filtros que
recalculan todo al vuelo.

## Uso

```powershell
python -m http.server 8765
```

Abrir <http://localhost:8765/lector.html>. La cámara y el OCR requieren `localhost` o HTTPS;
con `file://` no funcionan.

La página ya está conectada al proyecto `libros-rls777` (el mismo de `libros.js`), que
contiene el catálogo importado. Para cerrar el acceso público, habilita primero el proveedor
anónimo en Authentication y después publica `database.rules.json`. Los pasos de importación
están en [`importar/README.md`](importar/README.md).

## Archivos

| Archivo | Para qué |
|---|---|
| `lector.html`, `lector.js` | Página actual |
| `consulta.html`, `consulta.js` | Panel de métricas y consultas |
| `database.rules.json` | Reglas de Realtime Database |
| `importar/exportar-mdb.ps1` | Convierte `Libros.mdb` en JSON para importar |
| `index.html` | Demo anterior (Quagga + Firebase `fireui-777`) |
| `z/` | Demo anterior con ZXing |

## Modelo de datos

```
/libros/{isbn13 o codl}   { codl, isbn, titulo, año, añoEdicion, npaginas, nota, idioma,
                            genero, comentario, sinopsis, autor, portada }
/autores/{coda}           { coda, nombre, apellidos, autor, nacionalidad, nacimiento, muerte, sexo }
/lecturas/{codlec}        { codlec, fechaInicio, fechaFin, formato, libro, ppm }
/meta/ultimo*             últimos ids usados (se reservan con transacción)
```

Los libros importados del `.mdb` conservan `codl` como clave porque esa base no tiene ISBN;
los libros nuevos se guardan con el ISBN-13 como clave.

`año` es el año en que se publicó la obra por primera vez y `añoEdicion` el de la edición
escaneada (solo se guarda si difiere). `idioma` usa las etiquetas del catálogo
(`castellano`, `inglés`, `francés-castellano`, …). `sinopsis` va siempre en español, aunque
la edición esté en otro idioma; sale de la Wikipedia española y, si no hay artículo, de una
edición española en Open Library o Google Books.
