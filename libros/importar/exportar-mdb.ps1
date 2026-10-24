# Exporta Libros.mdb (Access) al JSON que se importa en Realtime Database.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\exportar-mdb.ps1
#   powershell -ExecutionPolicy Bypass -File .\exportar-mdb.ps1 -Mdb "D:\otra\Libros.mdb"
#
# Requiere el Microsoft Access Database Engine (ACE), que viene con Office/Access.
# No modifica el .mdb: trabaja sobre una copia temporal.
#
# El JSON resultante se importa desde la consola de Firebase:
#   Realtime Database > menu (tres puntos) > Importar JSON
#
# Nota: este archivo se mantiene en ASCII a proposito. Windows PowerShell 5.1
# lee los .ps1 sin BOM como ANSI, y un literal con tilde se corrompe.

param(
    [string]$Mdb = 'C:\Users\Rober\Documents\lieder\Libros.mdb',
    [string]$Salida = (Join-Path $PSScriptRoot 'datos-firebase.json')
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Mdb)) { throw "No existe el archivo: $Mdb" }

$copia = Join-Path $env:TEMP ('libros-import-' + [guid]::NewGuid().ToString('N') + '.mdb')
Copy-Item -LiteralPath $Mdb -Destination $copia -Force

function New-Conexion([string]$proveedor, [string]$ruta) {
    $conexion = New-Object System.Data.OleDb.OleDbConnection "Provider=$proveedor;Data Source=$ruta;Mode=Read"
    $conexion.Open()
    return $conexion
}

$conn = $null
$ultimoError = $null
foreach ($proveedor in @('Microsoft.ACE.OLEDB.16.0', 'Microsoft.ACE.OLEDB.12.0')) {
    try {
        $conn = New-Conexion $proveedor $copia
        break
    } catch {
        $ultimoError = $_.Exception.Message
    }
}
if (-not $conn) {
    throw "No pude abrir el .mdb. Instala 'Microsoft Access Database Engine' (ACE) de 64 bits. Detalle: $ultimoError"
}

function Get-Filas([string]$sql) {
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $sql
    $tabla = New-Object System.Data.DataTable
    $tabla.Load($cmd.ExecuteReader())
    return $tabla
}

function Texto($valor) {
    if ($valor -is [System.DBNull]) { return '' }
    return ([string]$valor).Trim()
}

function Entero($valor) {
    if ($valor -is [System.DBNull]) { return $null }
    return [int]$valor
}

function Decimal($valor) {
    if ($valor -is [System.DBNull]) { return $null }
    # Access guarda Single: 8.1 llega como 8.100000381469727
    return [double][math]::Round([double]$valor, 2)
}

function Fecha($valor) {
    if ($valor -is [System.DBNull]) { return $null }
    return ([datetime]$valor).ToString('yyyy-MM-dd')
}

# Nombre real de la columna "a-o" (con enie), sin escribir el literal.
$colAnio = 'a' + [char]0xF1 + 'o'

# --- autores ---------------------------------------------------------------
$autores = [ordered]@{}
$maxCoda = 0
foreach ($f in Get-Filas 'SELECT coda, nombre, apellidos, autor, nacionalidad, nacimiento, muerte, sexo FROM [autores]') {
    $coda = [int]$f.coda
    if ($coda -gt $maxCoda) { $maxCoda = $coda }
    $autores[[string]$coda] = [ordered]@{
        coda         = $coda
        nombre       = Texto $f.nombre
        apellidos    = Texto $f.apellidos
        autor        = Texto $f.autor
        nacionalidad = Texto $f.nacionalidad
        nacimiento   = Entero $f.nacimiento
        muerte       = Entero $f.muerte
        sexo         = Texto $f.sexo
    }
}

# --- libros ----------------------------------------------------------------
# Se conserva codl como clave: los libros del .mdb no tienen ISBN.
# Los libros nuevos escaneados usan el ISBN-13 como clave.
$libros = [ordered]@{}
$maxCodl = 0
$sqlLibros = "SELECT codl, titulo, [$colAnio], npaginas, nota, idioma, genero, comentario, sinopsis, autor FROM [libros]"
foreach ($f in Get-Filas $sqlLibros) {
    $codl = [int]$f.codl
    if ($codl -gt $maxCodl) { $maxCodl = $codl }
    $libro = [ordered]@{
        codl       = $codl
        titulo     = Texto $f.titulo
        npaginas   = Entero $f.npaginas
        nota       = Decimal $f.nota
        idioma     = Texto $f.idioma
        genero     = Texto $f.genero
        comentario = Texto $f.comentario
        sinopsis   = Texto $f.sinopsis
        autor      = Entero $f.autor
    }
    $libro[$colAnio] = Entero $f.$colAnio
    $libros[[string]$codl] = $libro
}

# --- lecturas --------------------------------------------------------------
# libro apunta a la clave de /libros (codl en los importados, ISBN en los nuevos).
$lecturas = [ordered]@{}
$maxCodlec = 0
foreach ($f in Get-Filas 'SELECT codlec, fechaInicio, fechaFin, formato, libro, ppm FROM [lecturas]') {
    $codlec = [int]$f.codlec
    if ($codlec -gt $maxCodlec) { $maxCodlec = $codlec }
    $libro = Entero $f.libro
    $lecturas[[string]$codlec] = [ordered]@{
        codlec      = $codlec
        fechaInicio = Fecha $f.fechaInicio
        fechaFin    = Fecha $f.fechaFin
        formato     = Texto $f.formato
        libro       = if ($null -eq $libro) { $null } else { [string]$libro }
        ppm         = Entero $f.ppm
    }
}

# --- meta ------------------------------------------------------------------
# Ultimo id usado en cada tabla; la pagina reserva el siguiente con una
# transaccion, asi no choca con los ids que ya existen en Access.
$meta = [ordered]@{
    ultimoCoda   = $maxCoda
    ultimoCodl   = $maxCodl
    ultimoCodlec = $maxCodlec
}

$datos = [ordered]@{
    autores  = $autores
    libros   = $libros
    lecturas = $lecturas
    meta     = $meta
}

$json = $datos | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($Salida, $json, (New-Object System.Text.UTF8Encoding($false)))

$conn.Close()
Remove-Item -LiteralPath $copia -Force -ErrorAction SilentlyContinue

"Exportado: $Salida"
"  autores : $($autores.Count)"
"  libros  : $($libros.Count)"
"  lecturas: $($lecturas.Count)"
"  meta    : ultimoCoda=$($meta.ultimoCoda) ultimoCodl=$($meta.ultimoCodl) ultimoCodlec=$($meta.ultimoCodlec)"
