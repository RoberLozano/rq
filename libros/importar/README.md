# Importar Libros.mdb a Firebase

El exportador lee el `.mdb` con el driver ACE (OLE DB) y genera `datos-firebase.json`.
No modifica el original: trabaja sobre una copia en `%TEMP%`.

```powershell
powershell -ExecutionPolicy Bypass -File .\exportar-mdb.ps1
# o con otra ruta:
powershell -ExecutionPolicy Bypass -File .\exportar-mdb.ps1 -Mdb "D:\ruta\Libros.mdb"
```

Salida esperada (datos actuales): 113 autores, 268 libros, 316 lecturas, más `meta`.

## Qué genera

```json
{
  "autores":  { "<coda>":  { "coda", "nombre", "apellidos", "autor", "nacionalidad", "nacimiento", "muerte", "sexo" } },
  "libros":   { "<codl>":  { "codl", "titulo", "año", "npaginas", "nota", "idioma", "genero", "comentario", "sinopsis", "autor" } },
  "lecturas": { "<codlec>": { "codlec", "fechaInicio", "fechaFin", "formato", "libro", "ppm" } },
  "meta":     { "ultimoCoda", "ultimoCodl", "ultimoCodlec" }
}
```

- `libros.autor` es la clave de `/autores` (`coda`).
- `lecturas.libro` es la clave de `/libros` (string).
- Las fechas van como `YYYY-MM-DD`; `null` donde Access tenía vacío.
- Los libros importados conservan `codl` como clave porque el `.mdb` no tiene ISBN.
  Los libros nuevos escaneados usan el ISBN-13 como clave.
- `meta` guarda el último id usado; la página lo incrementa con una transacción antes de
  asignar (los `codlec` llegan a 5115, por eso no alcanza con contar filas).

## Pasos en Firebase

1. Usar el proyecto existente `libros-rls777` (ya está en `../firebase-config.js`) o crear
   uno nuevo y actualizar la configuración.
2. Authentication → Sign-in method → habilitar **Anónimo**.
3. Realtime Database → menú ⋮ → **Importar JSON** → `datos-firebase.json`.
   La importación **reemplaza** todo el contenido de la base.
4. Realtime Database → Reglas → pegar `../database.rules.json` y publicar.
5. Copiar los datos de la app web en `../firebase-config.js`.

## Verificar

Después de importar, en la consola deberían verse los nodos `autores`, `libros`,
`lecturas` y `meta` con los conteos de arriba. Si la página no guarda, revisar en este
orden: `databaseURL` correcto, proveedor anónimo habilitado, reglas publicadas.

## Limitaciones

- Requiere Windows + ACE de 64 bits (viene con Office/Access). El driver ODBC de 32 bits
  no sirve si PowerShell es de 64 bits.
- No importa la tabla `Todos` (lista suelta sin claves foráneas).
- El `.mdb` no tiene ISBN: la columna no existe, así que los libros viejos quedan sin ese
  dato hasta que se escaneen.
