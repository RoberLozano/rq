# Arreglo: Manejo de Nombres con Espacios en Modo Online

## Problema Identificado

El código tenía múltiples inconsistencias en el manejo de nombres de personajes con espacios en modo online:

1. **Duplicidad de datos**: Los mismos datos se almacenaban en dos lugares diferentes:
   - `CharacterController.characters` - Map de elementos DOM
   - `CharacterController.personajes` - Map de objetos personaje
   - Firebase guarda en `mapState/personajes/` y `personajes/`

2. **Conversiones inconsistentes**: Diferentes métodos para convertir espacios a guiones bajos (`_`):
   - `replace(/ /g, '_')`
   - `replaceAll('_', ' ')`
   - `replace(/%20/g, '_')`
   - Código comentado sugiere problemas previos

3. **Búsqueda fallida de elementos**: Cuando sincronizaba personajes, no encontraba los elementos DOM porque usaba `personaje.nombre.replace(/ /g, '_')` de forma inconsistente.

## Solución Implementada

### 1. Función Centralizada de Normalización en `character-controller.js`

```javascript
/**
 * Normalize character name to ID (spaces to underscores)
 * This is the SINGLE SOURCE OF TRUTH for name normalization
 */
normalizeId(name) {
    if (!name || typeof name !== 'string') return '';
    return name.trim().replace(/%20/g, '_').replace(/ /g, '_');
}

/**
 * Get character element by normalized or full name
 */
getCharacterElement(nameOrId) {
    if (!nameOrId) return null;
    const id = this.normalizeId(nameOrId);
    return this.characters.get(id) || null;
}
```

### 2. Cambios en `addCharacterToMap()`

**Antes:**
- Múltiples conversiones inconsistentes
- Lógica confusa con variables `baseName` y `nombre`
- Se registraba en el Map usando `nombre` (con espacios)

**Después:**
- Usa `normalizeId()` una sola vez
- Almacena en Map usando `finalId` (normalizado)
- Almacena atributo `data-name` con el nombre legible

### 3. Simplificación de Sincronización en `sync-controller.js`

**Eliminado:**
- Duplicación de listeners para `personajes/` 
- Loop que se ejecutaba cada vez que se conectaba
- Attempts múltiples para encontrar elementos DOM

**Agregado:**
- Función centralizada `loadCharacterData()` que carga datos una sola vez
- Vinculación correcta entre elemento DOM y objeto personaje

### 4. Estructura de Datos Ahora

- **`CharacterController.characters`** (Map):
  - **Clave**: ID normalizado (con `_`) → ejemplo: `"John_Doe"`
  - **Valor**: Elemento SVG del personaje

- **`CharacterController.personajes`** (Map):
  - **Clave**: Nombre del personaje (con espacios) → ejemplo: `"John Doe"`
  - **Valor**: Objeto de personaje (con stats, inventario, etc.)

- **Firebase `mapState/personajes/`**:
  - **Clave**: ID normalizado → ejemplo: `"John_Doe"`
  - **Valor**: Posición, rotación, referencia a imagen

- **Firebase `personajes/`**:
  - **Clave**: Nombre del personaje → ejemplo: `"John Doe"`
  - **Valor**: Datos completos del personaje

## Beneficios

✅ **Único source of truth**: `normalizeId()` es la única función de conversión
✅ **Código más simple**: Eliminada lógica duplicada y confusa
✅ **Búsqueda confiable**: Siempre se encuentran elementos por ID normalizado
✅ **Sincronización correcta**: Se cargan datos sin conflictos
✅ **Mantenible**: Cambios futuros en este sistema serán más sencillos

## Cómo Usar

```javascript
// Para obtener un personaje del mapa
const charEl = CharacterController.getCharacterElement("John Doe");
// O también funciona con ID normalizado
const charEl = CharacterController.getCharacterElement("John_Doe");

// Para obtener datos del personaje
const personaje = CharacterController.personajes.get("John Doe");

// El elemento DOM vinculado al objeto
charEl.p === personaje; // true
```

## Archivos Modificados

- `c:\GitHub\roberquest\rq\m\js\character-controller.js`
  - Agregadas funciones `normalizeId()` y `getCharacterElement()`
  - Simplificado `addCharacterToMap()` para usar normalización
  - Ahora registra en Map usando ID normalizado

- `c:\GitHub\roberquest\rq\m\js\sync-controller.js`
  - Eliminada duplicación de listeners
  - Agregada función `loadCharacterData()`
  - Simplificada sincronización
  - Ahora carga datos de personajes correctamente sin conflictos
