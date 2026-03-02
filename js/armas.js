//requiere inventario.js

// class Arma extends Objeto {
//   constructor(nombre, peso, valor, ...daños) {
//     super(nombre, peso, valor);
//     this.daños = daños;
//     // console.log(this.daños);
//     if (this.daños)
//       this.index = 0
//   }
// }

//Daño: {'L'|'C'|'P'} tipo Lacerante, Contundente, Penetrante

const armasCuerpoACuerpo = new Map();

armasCuerpoACuerpo.set("Hacha de combate", new Arma("Hacha de combate", 1.0, 100, new Daño("1D8+2", "L")));
armasCuerpoACuerpo.set("Hacha de mano", new Arma("Hacha de mano", 0.5, 25, new Daño("1D6+1", "L")));
armasCuerpoACuerpo.set("Hacha de combate", new Arma("Hacha de combate", 1.0, 100, new Daño("1D8+2", "L")));
armasCuerpoACuerpo.set("Gran hacha", new Arma("Gran hacha", 2.0, 120, new Daño("2D6+2", "L")));
armasCuerpoACuerpo.set("Alabarda", new Arma("Alabarda", 3.0, 250, new Daño("3D6", "L"), new Daño("3D6", "P")));
armasCuerpoACuerpo.set("Hacha danesa", new Arma("Hacha danesa", 2.5, 150, new Daño("3D6", "L")));
armasCuerpoACuerpo.set("Daga", new Arma("Daga", 0.5, 33, new Daño("1D4+2", "L"), new Daño("1D4+2", "P")));
armasCuerpoACuerpo.set("Cuchillo", new Arma("Cuchillo", 0.2, 10, new Daño("1D3 + 1", "L")));
armasCuerpoACuerpo.set("Main gauche", new Arma("Main gauche", 0.5, 55, new Daño("1D4+2", "P")));
armasCuerpoACuerpo.set("Sai", new Arma("Sai", 1.0, 60, new Daño("1D6", "C")));
armasCuerpoACuerpo.set("Bola y cadena", new Arma("Bola y cadena", 2.0, 250, new Daño("1D10+1", "C")));
armasCuerpoACuerpo.set("Triple cadena", new Arma("Triple cadena", 2.0, 240, new Daño("1D6+2", "C")));
armasCuerpoACuerpo.set("Maza de grano", new Arma("Maza de grano", 1.0, 10, new Daño("1D6", "C")));
armasCuerpoACuerpo.set("Maza campesina militar", new Arma("Maza campesina militar", 2.5, 240, new Daño("2D6 + 2", "C")));
armasCuerpoACuerpo.set("Martillo de guerra", new Arma("Martillo de guerra", 2.0, 150, new Daño("1D6+2", "C"), new Daño("1D6+2", "P")));
armasCuerpoACuerpo.set("Gran martillo", new Arma("Gran martillo", 2.5, 250, new Daño("2D6+2", "C"), new Daño("2D6+2", "P")));
armasCuerpoACuerpo.set("Maza pesada", new Arma("Maza pesada", 2.5, 220, new Daño("1D10", "C")));
armasCuerpoACuerpo.set("Maza ligera", new Arma("Maza ligera", 1.0, 100, new Daño("1D8", "C")));
armasCuerpoACuerpo.set("Palo de madera", new Arma("Palo de madera", 0.5, 4, new Daño("1D6", "C")));
armasCuerpoACuerpo.set("Vara", new Arma("Vara", 0.5, 10, new Daño("1D6", "C")));
armasCuerpoACuerpo.set("Maza pesada", new Arma("Maza pesada", 2.5, 220, new Daño("1D10", "C")));
armasCuerpoACuerpo.set("Cayado", new Arma("Cayado", 1.5, 20, new Daño("1D8", "C")));
armasCuerpoACuerpo.set("Garrote", new Arma("Garrote", 2.5, 150, new Daño("1D10+2", "C")));
armasCuerpoACuerpo.set("Garrote de guerra", new Arma("Garrote de guerra", 4.0, 150, new Daño("2D6+2", "C")));
armasCuerpoACuerpo.set("Garrote de trabajo", new Arma("Garrote de trabajo", 4.0, 150, new Daño("2D6+2", "C")));
armasCuerpoACuerpo.set("Garrote de troll", new Arma("Garrote de troll", 5.5, 50, new Daño("2D8", "C")));
armasCuerpoACuerpo.set("Rapier", new Arma("Rapier", 1.0, 100, new Daño("1D6+1", "P")));
armasCuerpoACuerpo.set("Kukri", new Arma("Kukri", 0.5, 120, new Daño("1D4+3", "L")));
armasCuerpoACuerpo.set("Gladius", new Arma("Gladius", 1.0, 100, new Daño("1D6+1", "L"), new Daño("1D6+1", "P")));
armasCuerpoACuerpo.set("Pilum", new Arma("Pilum", 2.0, 125, new Daño("1D6+1", "P")));
armasCuerpoACuerpo.set("Lanza de torneo", new Arma("Lanza de torneo", 3.5, 150, new Daño("1D10+1", "P")));
armasCuerpoACuerpo.set("Lanza", new Arma("Lanza", 2.0, 20, new Daño("1D8+1", "P")));
armasCuerpoACuerpo.set("Lanza corta", new Arma("Lanza corta", 2.0, 20, new Daño("1D8+1", "P")));
armasCuerpoACuerpo.set("Lanza larga", new Arma("Lanza larga", 2.0, 30, new Daño("1D10+1", "P")));
armasCuerpoACuerpo.set("Lanza corta", new Arma("Lanza corta", 2.0, 20, new Daño("1D8+1", "P")));
armasCuerpoACuerpo.set("Pica", new Arma("Pica", 3.5, 65, new Daño("2D6+2", "P")));
armasCuerpoACuerpo.set("Naginata", new Arma("Naginata", 2.0, 150, new Daño("2D6+2", "L")));
armasCuerpoACuerpo.set("Espada bastarda", new Arma("Espada bastarda", 2.0, 230, new Daño("1D10+1", "L"), new Daño("1D10+1", "P")));
armasCuerpoACuerpo.set("Espada ancha", new Arma("Espada ancha", 1.5, 175, new Daño("1D8+1", "L"), new Daño("1D8+1", "C")));
armasCuerpoACuerpo.set("Cimitarra", new Arma("Cimitarra", 1.5, 200, new Daño("1D6+2", "L"), new Daño("1D6+2", "C")));
armasCuerpoACuerpo.set("Espada bastarda", new Arma("Espada bastarda", 2.0, 230, new Daño("1D10+1", "L"), new Daño("1D10+1", "P")));
armasCuerpoACuerpo.set("Mandoble", new Arma("Mandoble", 3.5, 320, new Daño("2D8", "L")));
armasCuerpoACuerpo.set("Azadón", new Arma("Azadón", 2.0, 5, new Daño("1D6", "C")));
armasCuerpoACuerpo.set("Guadaña", new Arma("Guadaña", 2.5, 50, new Daño("2D6", "L")));
armasCuerpoACuerpo.set("Hoz", new Arma("Hoz", 0.5, 40, new Daño("1D6", "L")));
armasCuerpoACuerpo.set("Pala", new Arma("Pala", 1.5, 20, new Daño("1D6+2", "C")));
armasCuerpoACuerpo.set("Cesto pesado", new Arma("Cesto pesado", 1.5, 100, new Daño("1D3+2", "C")));
armasCuerpoACuerpo.set("Cesto ligero", new Arma("Cesto ligero", 1.0, 100, new Daño("1D3 + 1", "C")));
armasCuerpoACuerpo.set("Garra de lucha", new Arma("Garra de lucha", 0.1, 100, new Daño("1D4+1", "L")));

// Para verificar el contenido del Map (opcional)
// for (const [nombre, arma] of armasCuerpoACuerpo) {
//   console.log(`${nombre}:`);
//   console.log(`  Nombre: ${arma.nombre}`);
//   console.log(`  Peso: ${arma.peso}`);
//   console.log(`  Valor: ${arma.valor}`);
//   console.log(`  Daños:`);
//   arma.daños.forEach(daño => {
//     console.log(`    Dado: ${daño.dado}, Tipo: ${daño.tipoDaño}`);
//   });
// }

//con valores revisados por Gemini
const armasCuerpoACuerpo2 = new Map();

armasCuerpoACuerpo2.set("Hacha de combate", new Arma("Hacha de combate", 1.5, 60, new Daño("1D8+2", "L")));
armasCuerpoACuerpo2.set("Hacha de mano", new Arma("Hacha de mano", 0.7, 20, new Daño("1D6+1", "L")));
armasCuerpoACuerpo2.set("Hacha de combate", new Arma("Hacha de combate", 2.0, 80, new Daño("1D8+2", "L")));
armasCuerpoACuerpo2.set("Gran hacha", new Arma("Gran hacha", 3.0, 100, new Daño("2D6+2", "L")));
armasCuerpoACuerpo2.set("Alabarda", new Arma("Alabarda", 3.5, 150, new Daño("3D6", "L"), new Daño("3D6", "P")));
armasCuerpoACuerpo2.set("Hacha danesa", new Arma("Hacha danesa", 2.5, 90, new Daño("3D6", "L")));
armasCuerpoACuerpo2.set("Daga", new Arma("Daga", 0.3, 15, new Daño("1D4+2", "L"), new Daño("1D4+2", "P")));
armasCuerpoACuerpo2.set("Cuchillo", new Arma("Cuchillo", 0.1, 5, new Daño("1D3 + 1", "L")));
armasCuerpoACuerpo2.set("Main gauche", new Arma("Main gauche", 0.4, 30, new Daño("1D4+2", "P")));
armasCuerpoACuerpo2.set("Sai", new Arma("Sai", 0.8, 40, new Daño("1D6", "C")));
armasCuerpoACuerpo2.set("Bola y cadena", new Arma("Bola y cadena", 4.0, 120, new Daño("1D10+1", "C")));
armasCuerpoACuerpo2.set("Triple cadena", new Arma("Triple cadena", 3.5, 100, new Daño("1D6+2", "C")));
armasCuerpoACuerpo2.set("Maza de grano", new Arma("Maza de grano", 1.2, 8, new Daño("1D6", "C")));
armasCuerpoACuerpo2.set("Maza campesina militar", new Arma("Maza campesina militar", 3.0, 90, new Daño("2D6 + 2", "C")));
armasCuerpoACuerpo2.set("Martillo de guerra", new Arma("Martillo de guerra", 2.0, 70, new Daño("1D6+2", "C"), new Daño("1D6+2", "P")));
armasCuerpoACuerpo2.set("Gran martillo", new Arma("Gran martillo", 3.0, 110, new Daño("2D6+2", "C"), new Daño("2D6+2", "P")));
armasCuerpoACuerpo2.set("Maza pesada", new Arma("Maza pesada", 2.5, 80, new Daño("1D10", "C")));
armasCuerpoACuerpo2.set("Maza ligera", new Arma("Maza ligera", 1.0, 50, new Daño("1D8", "C")));
armasCuerpoACuerpo2.set("Palo de madera", new Arma("Palo de madera", 0.6, 2, new Daño("1D6", "C")));
armasCuerpoACuerpo2.set("Vara", new Arma("Vara", 0.7, 5, new Daño("1D6", "C")));
armasCuerpoACuerpo2.set("Maza pesada", new Arma("Maza pesada", 3.0, 90, new Daño("1D10", "C")));
armasCuerpoACuerpo2.set("Cayado", new Arma("Cayado", 1.0, 10, new Daño("1D8", "C")));
armasCuerpoACuerpo2.set("Garrote", new Arma("Garrote", 2.0, 60, new Daño("1D10+2", "C")));
armasCuerpoACuerpo2.set("Garrote de guerra", new Arma("Garrote de guerra", 3.5, 70, new Daño("2D6+2", "C")));
armasCuerpoACuerpo2.set("Garrote de trabajo", new Arma("Garrote de trabajo", 3.0, 50, new Daño("2D6+2", "C")));
armasCuerpoACuerpo2.set("Garrote de troll", new Arma("Garrote de troll", 5.0, 30, new Daño("2D8", "C")));
armasCuerpoACuerpo2.set("Rapier", new Arma("Rapier", 1.0, 80, new Daño("1D6+1", "P")));
armasCuerpoACuerpo2.set("Kukri", new Arma("Kukri", 0.4, 60, new Daño("1D4+3", "L")));
armasCuerpoACuerpo2.set("Gladius", new Arma("Gladius", 0.8, 70, new Daño("1D6+1", "L"), new Daño("1D6+1", "P")));
armasCuerpoACuerpo2.set("Pilum", new Arma("Pilum", 2.0, 60, new Daño("1D6+1", "P")));
armasCuerpoACuerpo2.set("Lanza de torneo", new Arma("Lanza de torneo", 4.0, 100, new Daño("1D10+1", "P")));
armasCuerpoACuerpo2.set("Lanza", new Arma("Lanza corta", 1.5, 15, new Daño("1D8+1", "P")));
armasCuerpoACuerpo2.set("Lanza corta", new Arma("Lanza corta", 1.5, 15, new Daño("1D8+1", "P")));
armasCuerpoACuerpo2.set("Lanza larga", new Arma("Lanza larga", 2.5, 20, new Daño("1D10+1", "P")));
armasCuerpoACuerpo2.set("Lanza corta", new Arma("Lanza corta", 1.5, 15, new Daño("1D8+1", "P")));
armasCuerpoACuerpo2.set("Pica", new Arma("Pica", 4.5, 40, new Daño("2D6+2", "P")));
armasCuerpoACuerpo2.set("Naginata", new Arma("Naginata", 2.0, 90, new Daño("2D6+2", "L")));
armasCuerpoACuerpo2.set("Espada bastarda", new Arma("Espada bastarda", 1.8, 150, new Daño("1D10+1", "L"), new Daño("1D10+1", "P")));
armasCuerpoACuerpo2.set("Espada ancha", new Arma("Espada ancha", 1.3, 120, new Daño("1D8+1", "L"), new Daño("1D8+1", "C")));
armasCuerpoACuerpo2.set("Cimitarra", new Arma("Cimitarra", 1.2, 130, new Daño("1D6+2", "L"), new Daño("1D6+2", "C")));
armasCuerpoACuerpo2.set("Espada bastarda", new Arma("Espada bastarda", 2.0, 170, new Daño("1D10+1", "L"), new Daño("1D10+1", "P")));
armasCuerpoACuerpo2.set("Espada de doble puño", new Arma("Espada de doble puño", 3.0, 200, new Daño("2D8", "L")));
armasCuerpoACuerpo2.set("Azadón", new Arma("Azadón", 2.5, 3, new Daño("1D6", "C")));
armasCuerpoACuerpo2.set("Guadaña", new Arma("Guadaña", 4.0, 30, new Daño("2D6", "L")));
armasCuerpoACuerpo2.set("Hoz", new Arma("Hoz", 1.0, 25, new Daño("1D6", "L")));
armasCuerpoACuerpo2.set("Pala", new Arma("Pala", 1.8, 10, new Daño("1D6+2", "C")));
armasCuerpoACuerpo2.set("Cesto pesado", new Arma("Cesto pesado", 1.5, 40, new Daño("1D3+2", "C")));
armasCuerpoACuerpo2.set("Cesto ligero", new Arma("Cesto ligero", 1.0, 30, new Daño("1D3 + 1", "C")));
armasCuerpoACuerpo2.set("Garra de lucha", new Arma("Garra de lucha", 0.2, 50, new Daño("1D4+1", "L")));


// --- Clases Base (Asegúrate de tenerlas definidas) ---


// --- Función Auxiliar para Modificar Daño ---

/**
 * Modifica una cadena de dados de daño (ej. "1D8+2", "2D6") sumando o restando un modificador.
 * @param {string} dañoStr La cadena de daño original.
 * @param {number} mod El modificador a aplicar (+1, -1, etc.).
 * @returns {string} La nueva cadena de daño.
 */
function modificarDañoString(dañoStr, mod) {
  if (mod === 0) return dañoStr;

  const regex = /(\d+)[dD](\d+)(?:([+-])(\d+))?/;
  const match = dañoStr.replace(/\s/g, '').match(regex); // Eliminar espacios y buscar patrón

  if (!match) {
    console.warn(`Formato de daño no reconocido: ${dañoStr}`);
    return dañoStr; // Devolver original si no se reconoce
  }

  const numDados = parseInt(match[1]);
  const tipoDado = parseInt(match[2]);
  const signo = match[3];
  const modBase = match[4] ? parseInt(match[4]) : 0;

  let modActual = 0;
  if (signo === '+') {
    modActual = modBase;
  } else if (signo === '-') {
    modActual = -modBase;
  }

  const modFinal = modActual + mod;

  // Reconstruir cadena
  let nuevaStr = `${numDados}D${tipoDado}`;
  if (modFinal > 0) {
    nuevaStr += `+${modFinal}`;
  } else if (modFinal < 0) {
    // Podríamos decidir limitar que el daño no sea < 1 punto mínimo,
    // pero por ahora aplicamos el modificador directamente.
    nuevaStr += `${modFinal}`; // Incluye el signo negativo
  }
  // Si modFinal es 0, no se añade nada.
console.log(nuevaStr);

  return nuevaStr;
}


// --- Clase Generadora GenArma ---

class GenArma {
  /**
   * Crea una plantilla para generar armas de un tipo base con variaciones.
   * @param {string} nombreBase Nombre base del arma.
   * @param {number} pesoBase Peso estándar en kg.
   * @param {number} longitudBase Longitud estándar en cm.
   * @param {number} valorBase Valor estándar.
   * @param {Daño[]} dañosBase Array de objetos Daño estándar.
   * @param {object} opciones Variaciones y ratios.
   * @param {number} opciones.varLongPct Variación de longitud permitida (+/- porcentaje, ej: 0.1 = +/- 10%).
   * @param {number} opciones.ratioPesoLong Factor de cambio de peso relativo al cambio de longitud (ej: 0.8).
   * @param {number} opciones.umbralModDañoLargoPct Umbral de % de aumento longitud/peso para +1 daño (ej: 0.15).
   * @param {number} opciones.umbralModDañoCortoPct Umbral de % de descenso longitud/peso para -1 daño (ej: -0.15).
   * @param {number} [opciones.ratioValorLong=0.5] Factor de cambio de valor relativo al cambio de longitud.
   */
  constructor(nombreBase, pesoBase, longitudBase, valorBase, dañosBase, {
    varLongPct = 0.10, // +/- 10% por defecto
    ratioPesoLong = 0.8, // Peso cambia al 80% de lo que cambia la longitud
    umbralModDañoLargoPct = 0.15, // +1 daño si > +15% longitud/peso
    umbralModDañoCortoPct = -0.15, // -1 daño si < -15% longitud/peso
    ratioValorLong = 0.5 // Valor cambia al 50% de lo que cambia la longitud
  }) {
    this.nombreBase = nombreBase;
    this.pesoBase = pesoBase;
    this.longitudBase = longitudBase;
    this.valorBase = valorBase;
    // this.dañosBase = dañosBase.map(d => new Daño(d.dados, d.tipo)); // Copia profunda simple
    this.dañosBase = dañosBase; // Copia profunda simple

    // Opciones de generación
    this.varLongPct = varLongPct;
    this.ratioPesoLong = ratioPesoLong;
    this.umbralModDañoLargoPct = umbralModDañoLargoPct;
    this.umbralModDañoCortoPct = umbralModDañoCortoPct; // Debe ser negativo
    this.ratioValorLong = ratioValorLong;
  }

  /**
   * Genera una instancia de Arma con variaciones aleatorias.
   * @returns {Arma} Una nueva instancia de Arma.
   */
  generar() {
    // 1. Calcular variación de longitud
    // Multiplicador aleatorio entre (1 - varLongPct) y (1 + varLongPct)
    const multLong = 1 + (Math.random() * 2 - 1) * this.varLongPct;
    const longitudFinal = Math.round(this.longitudBase * multLong);
    const cambioLongPct = (longitudFinal - this.longitudBase) / this.longitudBase;

    // 2. Calcular peso final
    const pesoFinal = parseFloat((this.pesoBase * (1 + cambioLongPct * this.ratioPesoLong)).toFixed(1));

    // 3. Calcular modificador de daño
    let modDaño = 0;
    // Usamos el cambio de longitud como proxy principal para el modificador
    if (cambioLongPct >= this.umbralModDañoLargoPct) {
      modDaño = 1;
    } else if (cambioLongPct <= this.umbralModDañoCortoPct) {
      modDaño = -1;
    }
    console.log(modDaño);
    

    // 4. Modificar daños base
    console.log(this.dañosBase);
    
    // this.dañosBase.forEach(d => {
    //   if (d instanceof Daño) {
    //     console.log(d);
        
    //     d.dado = modificarDañoString(d.dado, modDaño); // Modificar daño
    //     console.log(d);
        
    //     // d.tipo = d.tipo; // No se modifica el tipo
    //   } else {  
    //     console.warn(`Elemento no es instancia de Daño: ${d}`);
    //   } 
    // } );
 
    const dañosFinales = this.dañosBase.map(d =>
      new Daño(d.dado, d.tipo)
    );
    // console.log(dañosFinales);
    

    // 5. Calcular valor final
    let valorFinal = Math.round(this.valorBase * (1 + cambioLongPct * this.ratioValorLong));
    valorFinal = Math.max(1, valorFinal); // Asegurar valor mínimo de 1

    // 6. (Opcional) Modificar nombre
    let nombreFinal = this.nombreBase;
    // if (modDaño > 0) nombreFinal += " Larga"; // Requiere manejo de género
    // if (modDaño < 0) nombreFinal += " Corta";

    // 7. Crear y devolver la nueva Arma
    return new Arma(nombreFinal, pesoFinal, longitudFinal, valorFinal, ...dañosFinales);
  }
}


// --- Mapa de Generadores de Armas ---
const GA = new Map();

// Ratios Peso/Longitud estimados:
// 0.6: Principalmente madera (Lanzas, Astas, Bastones, Herramientas mango largo)
// 0.7: Mezcla madera/metal o cabeza pesada (Hachas, Mazas, Martillos, Mayales)
// 0.8: Principalmente metal (Espadas, Dagas, Sai)

// Hachas (ratioPesoLong ~0.7)
GA.set("Hacha de combate", new GenArma("Hacha de combate", 1.0, 70, 100, [new Daño("1D8+2", "L")], { ratioPesoLong: 0.7 }));
GA.set("Hacha", new GenArma("Hacha", 0.5, 40, 25, [new Daño("1D6+1", "L")], { ratioPesoLong: 0.7, varLongPct: 0.15 })); // Más variación en pequeñas
GA.set("Gran hacha", new GenArma("Gran hacha", 2.0, 130, 120, [new Daño("2D6+2", "L")], { ratioPesoLong: 0.7 }));
GA.set("Hacha danesa", new GenArma("Hacha danesa", 2.5, 150, 150, [new Daño("3D6", "L")], { ratioPesoLong: 0.7 }));
GA.set("Hacha ancha", new GenArma("Hacha ancha", 1.8, 80, 130, [new Daño("2D6", "L")], { ratioPesoLong: 0.7 }));

// Dagas y Cuchillos (ratioPesoLong ~0.8)
GA.set("Daga", new GenArma("Daga", 0.5, 30, 33, [new Daño("1D4+2", "L"), new Daño("1D4+2", "P")], { ratioPesoLong: 0.8, varLongPct: 0.15 }));
GA.set("Cuchillo", new GenArma("Cuchillo", 0.2, 20, 10, [new Daño("1D3+1", "L")], { ratioPesoLong: 0.8, varLongPct: 0.20 })); // Mucha variación
GA.set("Main gauche", new GenArma("Main gauche", 0.5, 35, 55, [new Daño("1D4+2", "P")], { ratioPesoLong: 0.8 }));
GA.set("Kukri", new GenArma("Kukri", 0.5, 45, 120, [new Daño("1D4+3", "L")], { ratioPesoLong: 0.8 }));
GA.set("Garra de lucha", new GenArma("Garra de lucha", 0.1, 15, 100, [new Daño("1D4+1", "L")], { ratioPesoLong: 0.8, varLongPct: 0.05 })); // Precisión

// Armas Contundentes (ratioPesoLong ~0.7, excepto Sai=0.8, Nunchaku=0.7, Bastones=0.6)
GA.set("Sai", new GenArma("Sai", 1.0, 50, 60, [new Daño("1D6", "C")], { ratioPesoLong: 0.8 }));
GA.set("Bola y cadena", new GenArma("Bola y cadena", 2.0, 100, 250, [new Daño("1D10+1", "C")], { ratioPesoLong: 0.7 }));
GA.set("Triple cadena", new GenArma("Triple cadena", 2.0, 90, 240, [new Daño("1D6+2", "C")], { ratioPesoLong: 0.7 }));
GA.set("Maza de grano", new GenArma("Maza de grano", 1.0, 120, 10, [new Daño("1D6", "C")], { ratioPesoLong: 0.7, varLongPct: 0.20 })); // Improvisado
GA.set("Maza campesina militar", new GenArma("Maza campesina militar", 2.5, 150, 240, [new Daño("2D6+2", "C")], { ratioPesoLong: 0.7 }));
GA.set("Martillo de guerra", new GenArma("Martillo de guerra", 2.0, 75, 150, [new Daño("1D6+2", "C"), new Daño("1D6+2", "P")], { ratioPesoLong: 0.7 }));
GA.set("Gran martillo", new GenArma("Gran martillo", 2.5, 130, 250, [new Daño("2D6+2", "C"), new Daño("2D6+2", "P")], { ratioPesoLong: 0.7 }));
GA.set("Maza pesada", new GenArma("Maza pesada", 2.5, 85, 220, [new Daño("1D10", "C")], { ratioPesoLong: 0.7 }));
GA.set("Maza ligera", new GenArma("Maza ligera", 1.0, 70, 100, [new Daño("1D8", "C")], { ratioPesoLong: 0.7 }));
GA.set("Maza", new GenArma("Maza", 1.1, 75, 100, [new Daño("1D8", "C")], { ratioPesoLong: 0.7 }));
GA.set("Estrella del alba", new GenArma("Estrella del alba", 2.2, 90, 200, [new Daño("1D10+1", "C"), new Daño("1D8", "P")], { ratioPesoLong: 0.7 }));
GA.set("Palo de madera", new GenArma("Palo de madera", 0.5, 50, 4, [new Daño("1D6", "C")], { ratioPesoLong: 0.7, varLongPct: 0.25 })); // Muy variable
GA.set("Vara", new GenArma("Vara", 0.5, 160, 10, [new Daño("1D6", "C")], { ratioPesoLong: 0.6 })); // Bastón
GA.set("Cayado", new GenArma("Cayado", 1.5, 180, 20, [new Daño("1D8", "C")], { ratioPesoLong: 0.6 })); // Bastón pesado
GA.set("Garrote", new GenArma("Garrote", 2.5, 90, 80, [new Daño("1D10", "C")], { ratioPesoLong: 0.7, varLongPct: 0.15 }));
GA.set("Garrote de guerra", new GenArma("Garrote de guerra", 4.0, 110, 150, [new Daño("2D6+2", "C")], { ratioPesoLong: 0.7 }));
GA.set("Garrote de troll", new GenArma("Garrote de troll", 5.5, 140, 50, [new Daño("2D8", "C")], { ratioPesoLong: 0.7, varLongPct: 0.20 }));
GA.set("Nunchaku", new GenArma("Nunchaku", 0.8, 70, 70, [new Daño("1D6+1", "C")], { ratioPesoLong: 0.7 })); // Más como mayal corto

// Espadas (ratioPesoLong ~0.8)
GA.set("Rapier", new GenArma("Rapier", 1.0, 120, 100, [new Daño("1D6+1", "P")], { ratioPesoLong: 0.8 }));
GA.set("Gladius", new GenArma("Gladius", 1.0, 70, 100, [new Daño("1D6+1", "L"), new Daño("1D6+1", "P")], { ratioPesoLong: 0.8, varLongPct: 0.05 })); // Estandarizado
GA.set("Espada corta", new GenArma("Espada corta", 1.2, 80, 120, [new Daño("1D6+1", "L"), new Daño("1D6+1", "P")], { ratioPesoLong: 0.8 }));
GA.set("Espada ancha", new GenArma("Espada ancha", 1.5, 100, 175, [new Daño("1D8+1", "L"), new Daño("1D8+1", "C")], { ratioPesoLong: 0.8 }));
GA.set("Espada", new GenArma("Espada", 1.5, 100, 175, [new Daño("1D8+1", "L"), new Daño("1D8+1", "C")], { ratioPesoLong: 0.8 }));
GA.set("Cimitarra", new GenArma("Cimitarra", 1.5, 95, 200, [new Daño("1D6+2", "L"), new Daño("1D6+2", "C")], { ratioPesoLong: 0.8 }));
GA.set("Espada bastarda", new GenArma("Espada bastarda", 2.0, 125, 230, [new Daño("1D10+1", "L"), new Daño("1D10+1", "P")], { ratioPesoLong: 0.8 }));
GA.set("Mandoble", new GenArma("Mandoble", 3.5, 165, 320, [new Daño("2D8", "L")], { ratioPesoLong: 0.8 }));
GA.set("Katana", new GenArma("Katana", 1.8, 105, 300, [new Daño("1D10", "L")], { ratioPesoLong: 0.8, varLongPct: 0.07 })); // Calidad suele ser más consistente

// Armas de Asta y Lanzas (ratioPesoLong ~0.6)
GA.set("Alabarda", new GenArma("Alabarda", 3.0, 210, 250, [new Daño("3D6", "L"), new Daño("2D10", "P")], { ratioPesoLong: 0.6 }));
GA.set("Naginata", new GenArma("Naginata", 2.0, 200, 150, [new Daño("2D6+2", "L")], { ratioPesoLong: 0.6 }));
GA.set("Pilum", new GenArma("Pilum", 2.0, 180, 125, [new Daño("1D6+1", "P")], { ratioPesoLong: 0.6, varLongPct: 0.05 })); // Estandarizado
GA.set("Jabalina", new GenArma("Jabalina", 1.0, 150, 15, [new Daño("1D6", "P")], { ratioPesoLong: 0.6, varLongPct: 0.15 }));
GA.set("Lanza ", new GenArma("Lanza", 2.0, 170, 20, [new Daño("1D8+1", "P")], { ratioPesoLong: 0.6 }));
GA.set("Lanza corta", new GenArma("Lanza corta", 2.0, 170, 20, [new Daño("1D8+1", "P")], { ratioPesoLong: 0.6 }));
GA.set("Lanza larga", new GenArma("Lanza larga", 2.0, 250, 30, [new Daño("1D10+1", "P")], { ratioPesoLong: 0.6 }));
GA.set("Lanza de caballería", new GenArma("Lanza de caballería", 3.0, 350, 50, [new Daño("1D10+2", "P")], { ratioPesoLong: 0.6 }));
GA.set("Lanza de torneo", new GenArma("Lanza de torneo", 3.5, 320, 150, [new Daño("1D10+1", "C")], { ratioPesoLong: 0.6 }));
GA.set("Pica", new GenArma("Pica", 3.5, 450, 65, [new Daño("2D6+2", "P")], { ratioPesoLong: 0.6 }));
GA.set("Tridente", new GenArma("Tridente", 2.2, 180, 75, [new Daño("1D8+1", "P")], { ratioPesoLong: 0.6 }));

// Herramientas y Armas Improvisadas (ratioPesoLong ~0.6 para mangos largos, ~0.7 para otros)
GA.set("Azadón", new GenArma("Azadón", 2.0, 130, 5, [new Daño("1D6", "C")], { ratioPesoLong: 0.6, varLongPct: 0.15 }));
GA.set("Guadaña", new GenArma("Guadaña", 2.5, 170, 50, [new Daño("2D6", "L")], { ratioPesoLong: 0.6, varLongPct: 0.15 }));
GA.set("Hoz", new GenArma("Hoz", 0.5, 45, 40, [new Daño("1D6", "L")], { ratioPesoLong: 0.7, varLongPct: 0.20 }));
GA.set("Pala", new GenArma("Pala", 1.5, 140, 20, [new Daño("1D6+2", "C")], { ratioPesoLong: 0.6, varLongPct: 0.15 }));
GA.set("Pico", new GenArma("Pico", 2.8, 80, 30, [new Daño("1D8", "P"), new Daño("1D6+1", "C")], { ratioPesoLong: 0.7, varLongPct: 0.15 }));
GA.set("Horca", new GenArma("Horca", 2.0, 150, 15, [new Daño("1D6+1", "P")], { ratioPesoLong: 0.6, varLongPct: 0.15 }));

// Escudos (Golpes - ratioPesoLong bajo, ~0.5, ya que el área/grosor afecta más que la longitud lineal)
// No aplicaremos modificador de daño por tamaño a los golpes de escudo.
GA.set("Cesto pesado", new GenArma("Cesto pesado", 1.5, 80, 100, [new Daño("1D3+2", "C")], { ratioPesoLong: 0.5, umbralModDañoLargoPct: 1.0, umbralModDañoCortoPct: -1.0 })); // Desactivar mod daño
GA.set("Cesto ligero", new GenArma("Cesto ligero", 1.0, 60, 100, [new Daño("1D3+1", "C")], { ratioPesoLong: 0.5, umbralModDañoLargoPct: 1.0, umbralModDañoCortoPct: -1.0 })); // Desactivar mod daño


// --- Ejemplo de Uso ---

// Obtener el generador para un tipo de arma
const generadorEspadaAncha = GA.get("Espada ancha");

if (generadorEspadaAncha) {
  // Generar 3 espadas anchas diferentes
  console.log("--- Generando Espadas Anchas ---");
  for (let i = 0; i < 3; i++) {
    const espadaGenerada = generadorEspadaAncha.generar();
    console.log(espadaGenerada);
    
    console.log(`Espada ${i + 1}:`);
    console.log(`  Nombre: ${espadaGenerada.nombre}`);
    console.log(`  Longitud: ${espadaGenerada.longitud} cm (Base: ${generadorEspadaAncha.longitudBase} cm)`);
    console.log(`  Peso: ${espadaGenerada.peso} kg (Base: ${generadorEspadaAncha.pesoBase} kg)`);
    console.log(`  Valor: ${espadaGenerada.valor} (Base: ${generadorEspadaAncha.valorBase})`);
    console.log(`  Daños: ${espadaGenerada.daños.map(d => d.toString()).join(', ')}`);
    
    // Comprobar si el daño cambió respecto al base
    const dañoBaseStr = generadorEspadaAncha.dañosBase.map(d => `${d.dados} ${d.tipo}`).join(', ');
    if (espadaGenerada.daños.map(d => `${d.dados} ${d.tipo}`).join(', ') !== dañoBaseStr) {
         console.log(`  (Daño modificado respecto a base: ${dañoBaseStr})`);
    }
    console.log("----------");
  }
} else {
  console.log("Generador para 'Espada ancha' no encontrado.");
}

// Generar un Mandoble aleatorio
const generadorMandoble = GA.get("Mandoble");
if (generadorMandoble) {
    console.log("\n--- Generando Mandoble ---");
    const mandobleGenerado = generadorMandoble.generar();
    console.log(`Nombre: ${mandobleGenerado.nombre}`);
    console.log(`Longitud: ${mandobleGenerado.longitud} cm`);
    console.log(`Peso: ${mandobleGenerado.peso} kg`);
    console.log(`Valor: ${mandobleGenerado.valor}`);
    console.log(`Daños: ${mandobleGenerado.daños.map(d => d.toString()).join(', ')}`);
    const dañoBaseStr = generadorMandoble.dañosBase.map(d => `${d.dados} ${d.tipo}`).join(', ');
     if (mandobleGenerado.daños.map(d => d.toString()).join(', ') !== dañoBaseStr) {
         console.log(`(Daño modificado respecto a base: ${dañoBaseStr})`);
    }
}