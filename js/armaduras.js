// class Material{
// /**
//  *Creates an instance of Material.
//  * @param {*} nombre
//  * @param {*} pa puntos de armadura
//  * @param {number} [mPr=5] multiplicador de los puntos de resistencia
//  * @memberof Material
//  */
// constructor(nombre, pa,mPr=5){
//     this.nombre=nombre
//     this.pa=pa
//     this.mPr=mPr
//  }

// }

// IMPORTAR DESPUÉS DE INVENTARIO Y OBJETO

//ARMADURA SIMPLE para salir del paso rápido

// mangas = pj.cuerpo.darLocalizacion('Brazo D').todosNombres().concat(pj.cuerpo.darLocalizacion('Brazo I').todosNombres())
var ropa = {}


ropa['pantalones'] = ["Muslo Superior I", "Muslo Inferior I", "Rodilla I", "Pierna Inf I",
    "Muslo Superior D", "Muslo Inferior D", "Rodilla D", "Pierna Inf D",
    "Vientre", "Cadera D", "Ingle", "Cadera I"];

ropa['calzas'] = ropa['pantalón'] = ropa['pantalones'];

ropa['chaleco'] = ["Pecho", "Vientre", "Cadera D", "Cadera I"];
ropa['coleto'] = ropa['chaleco'].concat(["Hombro D", "Hombro I"])

// ropa['coleto']=["Hombro D", "Biceps D",
//                 "Hombro I", "Biceps I",
//                 "Pecho","Vientre", "Cadera D", "Cadera I"];


ropa['camisa'] = ["Hombro D", "Biceps D", "Antebrazo D", "Codo D",
    "Hombro I", "Biceps I", "Antebrazo I", "Codo I",
    "Pecho", "Vientre", "Cadera D", "Cadera I"];

ropa['gambesón'] = ropa['camisa'].concat(["Muslo Superior I", "Muslo Superior D"]);
ropa['joruca'] = ropa['gambesón'].concat(["Muslo Inferior I", "Muslo Inferior D"]);

ropa['camiseta'] = ["Hombro D", "Biceps D",
    "Hombro I", "Biceps I",
    "Pecho", "Vientre", "Cadera D", "Cadera I"];

ropa['guantes'] = ["Mano I", "Mano D"];
ropa['brazales'] = ["Antebrazo D", "Antebrazo I",]

ropa['coderas'] = ["Codo D", "Codo I"];
ropa['rodilleras'] = ["Rodilla I", "Rodilla D",]

ropa['guantes largos'] = ropa['guantes'].concat(ropa['brazales'])
ropa['zapatos'] = ["Pie I", "Pie D"];
ropa['espinilleras'] = ["Pierna Inf I", "Pierna Inf D",]
ropa['botas'] = ["Pierna Inf I", "Pie I",
    "Pierna Inf D", "Pie D"];

ropa['botas altas'] = ropa['botas'].concat(ropa['rodilleras']);

ropa['vestido'] = ["Hombro D", "Biceps D", "Antebrazo D", "Codo D",
    "Hombro I", "Biceps I", "Antebrazo I", "Codo I",
    "Pecho","Vientre", "Cadera D", "Ingle", "Cadera I",
    "Muslo Superior I", "Muslo Inferior I", "Rodilla I", "Pierna Inf I",
    "Muslo Superior D", "Muslo Inferior D", "Rodilla D", "Pierna Inf D"]
    ;





class Ropa extends Objeto {
    /**
     * Objeto vestible que puede proporcionar pa
     * @param {*} nombre 
     * @param {*} peso 
     * @param {*} valor 
     * @param {Number} pa numero de puntos de armadura
     * @param {Array} localizaciones array de  localizaciones que cubre
     */
    constructor(nombre, peso, valor, pa = 0, localizaciones) {
        super(nombre, peso, valor);
        this.localizaciones = localizaciones;
        this.pa = pa;
        if (!localizaciones) {
            this.parse(nombre);
        }
    }

    /**Rellena las localizaciones de la ropa por el nombre
     * @param {String} s un String con el nombre que incluye la capacidad
     */
    parse(s) {
        let PA = 0;
        var esRopa = false;
        s = s.toLowerCase()


        //PA
        var pb = new RegExp("(\\d+)\\s*pa", "i") // 7[]PA
        var re = /pa\s*[:|=|\s*](\d+)/i;    //pa[: ]6
        if (s.includes('cuero')) this.pa = 1; //en principio el cuero tiene 1PA
        var b = s.match(pb);
        if (!b) b = s.match(re); //si no encuntra pa detras busca delante

        if(b) this.pa=parseInt(b[1]);

        // if(esRopa) //-> tal vez si no tiene PA no hacer localizaciones??
        //TODO: localizaciones 
        for (let r in ropa) {
            // console.log(r);
            var pb = new RegExp(r + " ", "i");
            var b = s.match(pb);
            if (b) {
                console.log(b);
                // this.localizaciones=
                console.log((b[0]));
                this.localizaciones = ropa[r];
                esRopa = true;
            }
        }

        return esRopa;
    }
}

// class Armadura {
//     constructor(piezas) {
//         this.piezas = piezas
//     }

//     atacar(daño, localizacion) {
//         let armadura = this.daPiezas(localizacion);
//         return daño - armadura;
//     }

//     /** Devuelve los PA que cubren esa localización
//      *
//      * @param {string} localizacion la localización 
//      * @memberof Armadura
//      */
//     daPiezas(localizacion) {
//         let armadura = 0;
//         this.piezas.forEach(p => {
//             let l = p.localizaciones.indexOf(localizacion)
//             if (l > -1) { armadura += p.pa }
//         });
//         return armadura;
//     }
    
// }

// class Pieza {
//     /**
//      * 
//      * @param {*} localizaciones 
//      * @param {int} pa los Puntos de Armadura iniciales
//      * @param {int} mPr 0 si es indestructible
//      */
//     constructor(localizaciones, pa, mPr = 5) {
//         this.localizaciones = localizaciones
//         if (mPr=0) this._pa=pa;
//         else{
//             this.pr = pa*mPr;
//             this.mPr=mPr;
//         }
       
//     }

//     get pa(){
//         if(this._pa) return this._pa;
//         return Math.round(this.pr/this.mPr);
//     }
    
// }



// Clases de Armaduras compleja
// #region Armadura
// TODO ordenar paramnetros de constructores
// class Material {
//     constructor(nombre, pa, peso, precio) {
//         this.nombre = nombre;
//         this.peso = peso;
//         this.precio = precio;
//         this.pa = pa;
//     }
// }

// class Calidad {
//     constructor(nombre, peso, precio, pa) {
//         this.nombre = nombre;
//         this.peso = peso;
//         this.precio = precio;
//         this.pa = pa;
//     }
// }

// class TipoArmadura {
//     constructor(
//         nombre
//         , pa
//         , precio
//         , pinicial
//         , pmul
//         , rigida
//         , metal
//     ) {
//         this.nombre = nombre
//         this.pa = pa
//         this.precio = precio
//         this.pinicial = pinicial
//         this.pmul = pmul
//         this.rigida = rigida
//         this.metal = metal

//     }
// }


//TODO hacerla por capas?
class Armadura {
    constructor(piezas) {
        this.capas = 0; //capas de armaduras, acolchada, malla, peto, etc...
        this.piezas = piezas;
    }
    /**
     * Devuelve las piezas que cubren esa localización
     *
     * @param {string} localizacion la localización 
     * @memberof Armadura
     */
    daPiezas(localizacion) {
        let lista = [];
        this.piezas.forEach(p => {
            let l = (p.daLoc(localizacion))
            console.log(l);
            if (l) { lista.push((l)); console.log(l+" de "+p.nombre);}
        });

        // en que tiene un orden mayor recibe el impacto antes
        lista.sort(function (a, b) { return b.orden - a.orden });
        return lista;

    }

    /**
     * Devuelve los PA que cubren esa localización
     * @param {string} localizacion la localización
     * @returns {int} los PA que cubren esa localización
     * @memberof Armadura
     *   
     *  */

    daPA(localizacion) {
        let lista = this.daPiezas(localizacion);
        let pa = 0;
        lista.forEach(l => {
            pa += l.pa;
        });
        return pa;
    };

    atacar(daño, tipo, localizacion) {
        let d = daño;
        let lista = this.daPiezas(localizacion);
        if (lista.length < 1) return daño;
        lista.forEach(l => {
            if (d == 0) return 0;
            console.log(`Ataca con ${d} ${tipo} a ${l.nombre}`);
            d = l.atacar(d, tipo);
        });
        return d;
    }
}

/**
 *
 *  Clase que contiene todas las piezas por localizaciones LocPieza
 * @class Pieza
 */
class Pieza {
/**
 * 
 * @param {Array} localizacion las localizaciones que cubre
 * @param {int} pa PA iniciales
 * @param {int} mPr Los puntos de resistencia (PR) por cada PA, 0 si es irrompible
 * @param {int} L Lacerante si float multiplicador
 * @param {int} C Contundente si float multiplicador
 * @param {int} P Penetrante si float multiplicador
 * @param {int} orden creo que innecesario 
 */
    constructor(nombre,localizaciones,pa,mPr=5,L=0,C=0,P=0,orden) {
        this.nombre=nombre;
        this.localizaciones = [];
        //por cada nombre de localizacion se crea una 
        if(this.localizaciones.length>0) 
        localizaciones.forEach(l => {
            // this.localizaciones.push(new LocPieza(l, tipo.pa + material.pa, material.mPr))
            this.localizaciones.push(new LocPieza(l, pa, mPr, L,C,P,orden))
        });
    }

    add(localizacion){
        this.localizaciones.push(localizacion);

    }


    /**
     * Devuelve la localizacion por el nombre
     *
     * @param {string} nombre de la localización
     * @returns la LocPieza con esa localización
     * @memberof Pieza
     */
    daLoc(nombre) {
        let loc = false;
        this.localizaciones.forEach(l => {
            console.log(l.nombre + ":" + nombre);
            if (l.nombre == nombre) loc = l;
        });

        return loc;
    }

}


class LocPieza {
/**
 * 
 * @param {Array} localizacion las localizaciones que cubre
 * @param {int} pa PA iniciales
 * @param {int} mPr Los puntos de resistencia (PR) por cada PA, 0 si es irrompible
 * @param {int} L Lacerante(corte)
 * @param {int} C Contundente
 * @param {int} P Penetrante
 * @param {int} orden creo que innecesario 
 */
    constructor(localizacion, pa, mPr = 5,L=0,C=0,P=0, orden = 0) {
        this.nombre = localizacion;
        // this.pa = pa;
        /**
         * los puntos de armadura iniciales
         */
        this.PAi=pa;
        //La modificaciones a los tipos de daño
        this.L=L;
        this.C=C;
        this.P=P;
        /**
         * Los puntos de resistencia (PR) por cada PA, 0 si es irrompible
         */
        this.mPr=mPr;
        this.pr = pa * mPr + mPr //TODO
        //el orden de las capas (0 lo más pegado al cuerpo)
        this.orden = orden;
    }

    /**
     * los PA actuales
     */
    get pa() {
        if(this.mPr==0) return this.PAi;
        return Math.max(0,Math.round(this.pr / this.mPr)); //devuelve los puntos de resistancia entre su multiplicador
    }

    /**
     * 
     * @param {int} daño 
     * @param {'L'|'C'|'P'} tipo Lacerante, Contundente, Penetrante
     * @returns 
     */
    atacar(daño, tipo) {
        let mult=1;
        if (tipo){
            //TODO: ver si dejo que bonificación negativa influye en PR
            if(this[tipo]){
                let bon=this[tipo];
                console.log(tipo+"-se aplica bon:"+bon);
                if(Number.isInteger(bon)) daño=Math.max(0,daño-bon)
                    else mult=bon;
            }
        }
        console.log(daño);
        if (daño <= this.pa)
            return 0;
        else {
            let d = daño - Math.round(this.pa*mult);
            if(this.mPr>0) this.pr = this.pr - daño; //se restan PR
            return d;
        }
    }
/**
 * 
 * @param {int} daño Los PR dañados
 */
    dañar(daño){this.pr = this.pr - daño }

}

// #endregion

//me jode los arrays

// Array.prototype.lado = function (lado) {
//     let copia = []
//     this.forEach(element => {
//         element += " " + lado;
//         copia.push(element)
//     });
//     return copia;
// }

function lado(array,lado) {
    let copia = []
    array.forEach(element => {
        element += " " + lado;
        copia.push(element)
    });
    return copia;
}


//TODO: materiales, calidades, 

//Materiales
// const Hierro = new Material("Hierro", 1, 1, 0);
// const Acero = new Material("Acero", 1, 1.5, 1);
// const AcEnano = new Material("Acero Enano", 0.77, 13, 3);
// const AcElfico = new Material("Acero Élfico", 0.55, 20, 2);
// const AcLigero = new Material("Acero Ligero", 0.9, 1.5, 1);
// const AcPesado = new Material("Acero Pesado", 1.25, 1.3, 2);


// //Fluctuacion del Mithril
// const Mithril = new Material("Mithril", 0.25, 10000, 6);
// const MithrilNegro = new Material("Mithril Negro", 0.25, 30000, 7);

// //Materiales de Cuero
// const Normal = new Material("Normal", 1, 1, 0);
// const Excelente = new Material("Excelente", 1, 10, 1);
// const Unicornio = new Material("Unicornio", 1, 50000, 7);


//TODO: DEFINIR LAS CALIDADES (nombre, pa, peso, precio)
// const normal = new Calidad("Normal", 1, 1, 0);
// const superior = new Calidad("Superior", 1, 2, 1);
// const ligera = new Calidad("Ligera", 0.9, 1.6, 0);
// const muyLigera = new Calidad("Muy Ligera", 0.8, 2.3, 0);
// const eterea = new Calidad("Etérea", 0.7, 7, 1);
// const maestra = new Calidad("Obra Maestra", 0.77, 13.7, 2);


// const Cuero = new TipoArmadura("Cuero", 1, 20, false, 1.5, 0.1, false);
// const CueroDuro = new TipoArmadura("Cuero Duro", 2, 20, true, 3, 0.2, false);
// const Cuirbouilli = new TipoArmadura("Cuirbouilli", 3, 45, true, 3, 0.2, false);
// const Bezanteada = new TipoArmadura("Bezanteada", 4, 70, false, 4.5, 0.3, false);
// const CotaAnillos = new TipoArmadura("Anillos", 5, 110, false, 6, 0.4, true);
// const Lamelar = new TipoArmadura("Lamelar", 6, 200, true, 10, 0.75, true);
// const Escamas = new TipoArmadura("Escamas", 6, 120, true, 12, 0.8, true);
// const Brigandina = new TipoArmadura("Brigandina", 7, 120, true, 13.5, 0.9, true);
// const CotaMalla = new TipoArmadura("Malla", 7, 240, false, 12, 0.8, true);
// const Coraza = new TipoArmadura("Coraza", 8, 270, true, 15, 1, true);

// partes para crear distintas armaduras
let capucha = ["Craneo", "Cuello"];
let chaleco = ["Pecho", "Abdomen"];
let manga = ["Hombro", "Codo", "Brazo Superior", "Antebrazo"];

// manga = manga.lado('I')
manga = lado(manga,'I')

// let blusa = new Pieza(chaleco);


// let cota = new Pieza(chaleco, 1);
let coraza = new Pieza('coraza',chaleco, 5,5,1)
// let a = new Armadura([cota, blusa, coraza]);


var brazoD = []

brazoD = brazoD.concat("Hombro D")
brazoD = brazoD.concat("Biceps D")
brazoD = brazoD.concat("Antebrazo D")
brazoD = brazoD.concat("Codo D")
brazoD = brazoD.concat("Mano D")


let hombros = ["Hombro D", "Hombro I"];
let biceps = ["Biceps D", "Biceps I"];
let antebrazos = ["Antebrazo D", "Antebrazo I"];
let codos = ["Codo D", "Codo I"];
let manos = ["Mano D", "Mano I"];
// chaleco y dos mangas
todo = brazoD.concat(chaleco, manga, lado(brazoD,'I'))

let pa= new Pieza( 'camisa malla',ropa['camisa'], 8,5,2,0.5,0)
let vZ= new Pieza('Vestido de Zaahira',ropa['vestido'],6,0);
let arm = new Armadura([pa,vZ])

/**
 * Busca si alguna parte del texto está presente como clave en el objeto ropa
 * @param {string} texto - El texto a buscar dentro de las claves de ropa
 * @param {boolean} [exacto=false] - Si es true, busca coincidencia exacta; si es false, busca coincidencia parcial
 * @returns {Object|null} - Objeto con clave y localizaciones encontradas, o null si no hay coincidencia
 */
function buscarRopa(texto, exacto = false) {
    // Normalizar el texto de búsqueda
    const textoBusqueda = texto.toLowerCase().trim();
    
    // Resultados encontrados
    const resultados = [];
    
    // Buscar en todas las claves del objeto ropa
    for (const clave in ropa) {
        const claveNormalizada = clave.toLowerCase();
        
        // Determinar si hay coincidencia según el modo exacto o parcial
        let coincide = false;
        
        if (exacto) {
            // Coincidencia exacta
            coincide = (claveNormalizada === textoBusqueda);
        } else {
            // Coincidencia parcial (en cualquier dirección)
            coincide = (
                claveNormalizada.includes(textoBusqueda) || 
                textoBusqueda.includes(claveNormalizada)
            );
        }
        
        // Si hay coincidencia, agregar al resultado
        if (coincide) {
            resultados.push({
                clave: clave,
                localizaciones: ropa[clave]
            });
        }
    }
    
    // Devolver resultados
    return resultados.length > 0 ? resultados : null;
}

/**
 * Versión mejorada que devuelve la mejor coincidencia según porcentaje de similitud
 * @param {string} texto - El texto a buscar
 * @returns {Object|null} - Mejor coincidencia o null si no hay ninguna
 */
function buscarRopaMejorCoincidencia(texto) {
    const textoBusqueda = texto.toLowerCase().trim();
    let mejorCoincidencia = null;
    let mayorPorcentaje = 0;
    
    // Buscar en todas las claves del objeto ropa
    for (const clave in ropa) {
        const claveNormalizada = clave.toLowerCase();
        
        // Calcular porcentaje de coincidencia simple
        let porcentaje = 0;
        
        if (claveNormalizada === textoBusqueda) {
            // Coincidencia exacta
            porcentaje = 1;
        } else if (claveNormalizada.includes(textoBusqueda)) {
            // El texto de búsqueda está contenido en la clave
            porcentaje = textoBusqueda.length / claveNormalizada.length;
        } else if (textoBusqueda.includes(claveNormalizada)) {
            // La clave está contenida en el texto de búsqueda
            porcentaje = claveNormalizada.length / textoBusqueda.length;
        }
        
        // Actualizar mejor coincidencia si es necesario
        if (porcentaje > mayorPorcentaje) {
            mayorPorcentaje = porcentaje;
            mejorCoincidencia = {
                clave: clave,
                localizaciones: ropa[clave],
                porcentaje: porcentaje
            };
        }
    }
    
    return mejorCoincidencia;
}

const resultado = buscarRopa("camisa");
if (resultado) {
    console.log(`Se encontraron ${resultado.length} coincidencias:`);
    resultado.forEach(item => {
        console.log(`- ${item.clave}: cubre ${item.localizaciones.length} localizaciones`);
    });
} else {
    console.log("No se encontraron coincidencias");
}

const mejorCoincidencia = buscarRopaMejorCoincidencia("camiseta de algodón");
if (mejorCoincidencia) {
    console.log(`Mejor coincidencia: ${mejorCoincidencia.clave} (${Math.round(mejorCoincidencia.porcentaje * 100)}%)`);
}


//#region Armaduras

const armadurasPopularesMedievales = new Map([
    // Armadura de placas completa (siglos XV-XVI)
    ["Armadura de placas completa", new Armadura([
        new Pieza("Yelmo", ["Craneo", "Cara", "Cuello"], 10, 15, 1.8, 0.9, 1.5, 2),
        new Pieza("Peto y espaldar", ["Pecho", "Vientre"], 10, 15, 1.7, 0.9, 1.5, 2),
        new Pieza("Hombreras", ["Hombro D", "Hombro I"], 10, 15, 1.7, 0.8, 1.5, 2),
        new Pieza("Brazales", ["Antebrazo D", "Antebrazo I"], 10, 15, 1.7, 0.8, 1.5, 2),
        new Pieza("Codales", ["Codo D", "Codo I"], 10, 15, 1.7, 0.8, 1.3, 2),
        new Pieza("Guanteletes", ["Mano D", "Mano I"], 10, 15, 1.6, 0.8, 1.3, 2),
        new Pieza("Quijotes", ["Muslo Superior D", "Muslo Superior I"], 10, 15, 1.7, 0.8, 1.5, 2),
        new Pieza("Rodilleras", ["Rodilla D", "Rodilla I"], 10, 15, 1.7, 0.8, 1.3, 2),
        new Pieza("Grebas", ["Pierna Inf D", "Pierna Inf I"], 10, 15, 1.7, 0.8, 1.5, 2),
        new Pieza("Escarpes", ["Pie D", "Pie I"], 10, 15, 1.6, 0.8, 1.4, 2)
    ])],
    
    // Cota de malla completa (siglos XII-XV)
    ["Cota de malla completa", new Armadura([
        new Pieza("Almófar (capucha de malla)", ["Craneo", "Cuello"], 7, 10, 1.5, 0.5, 0.9, 1),
        new Pieza("Loriga (cota de malla)", ropa["camisa"], 7, 10, 1.5, 0.5, 0.9, 1),
        new Pieza("Calzas de malla", ropa["pantalones"], 7, 10, 1.5, 0.5, 0.9, 1),
        new Pieza("Manoplas de malla", ropa["guantes"], 6, 8, 1.4, 0.5, 0.8, 1),
        new Pieza("Gambesón (acolchado bajo malla)", ropa["gambesón"], 3, 5, 1.0, 1.2, 0.6, 0)
    ])],
    
    // Brigandina (siglos XIV-XV)
    ["Brigandina", new Armadura([
        new Pieza("Brigandina", ["Pecho", "Vientre", "Hombro D", "Hombro I"], 8, 12, 1.3, 0.8, 1.2, 1),
        new Pieza("Mangas de brigandina", ["Biceps D", "Biceps I", "Antebrazo D", "Antebrazo I"], 7, 10, 1.3, 0.8, 1.2, 1),
        new Pieza("Faldón de brigandina", ["Muslo Superior D", "Muslo Superior I"], 7, 10, 1.3, 0.8, 1.2, 1),
        new Pieza("Bacinete", ["Craneo"], 8, 12, 1.4, 0.7, 1.3, 2),
        new Pieza("Gambesón (acolchado)", ropa["gambesón"], 3, 5, 1.0, 1.2, 0.6, 0)
    ])],
    
    // Armadura de cuero endurecido (cuirbouilli)
    ["Cuirbouilli", new Armadura([
        new Pieza("Capacete de cuero", ["Craneo"], 4, 6, 1.2, 0.7, 0.8, 1),
        new Pieza("Coraza de cuero endurecido", ["Pecho", "Vientre"], 5, 7, 1.2, 0.7, 0.8, 1),
        new Pieza("Brazales de cuero", ["Antebrazo D", "Antebrazo I"], 4, 6, 1.1, 0.7, 0.7, 1),
        new Pieza("Guantes de cuero reforzados", ropa["guantes"], 3, 5, 1.0, 0.6, 0.7, 1),
        new Pieza("Musleras de cuero", ["Muslo Superior D", "Muslo Superior I"], 4, 6, 1.1, 0.7, 0.7, 1),
        new Pieza("Grebas de cuero", ["Pierna Inf D", "Pierna Inf I"], 4, 6, 1.1, 0.7, 0.7, 1)
    ])],
    
    // Armadura de escamas (siglos XI-XV)
    ["Armadura de escamas", new Armadura([
        new Pieza("Casco cónico con protector nasal", ["Craneo"], 7, 10, 1.4, 0.7, 1.0, 1),
        new Pieza("Coraza de escamas", ["Pecho", "Vientre"], 7, 10, 1.4, 0.7, 1.0, 1),
        new Pieza("Hombreras de escamas", ["Hombro D", "Hombro I"], 6, 9, 1.4, 0.7, 0.9, 1),
        new Pieza("Brazales de escamas", ["Antebrazo D", "Antebrazo I"], 6, 9, 1.4, 0.7, 0.9, 1),
        new Pieza("Faldón de escamas", ["Muslo Superior D", "Muslo Superior I"], 6, 9, 1.4, 0.7, 0.9, 1),
        new Pieza("Gambesón (acolchado bajo escamas)", ropa["gambesón"], 3, 5, 1.0, 1.2, 0.6, 0)
    ])],
    
    // Armadura lamelar (influencia oriental/bizantina)
    ["Armadura lamelar", new Armadura([
        new Pieza("Casco lamelar", ["Craneo"], 7, 10, 1.5, 0.9, 1.1, 1),
        new Pieza("Coraza lamelar", ["Pecho", "Vientre"], 7, 11, 1.5, 0.9, 1.1, 1),
        new Pieza("Hombreras lamelares", ["Hombro D", "Hombro I"], 7, 10, 1.5, 0.9, 1.1, 1),
        new Pieza("Faldón lamelar", ["Muslo Superior D", "Muslo Superior I"], 7, 10, 1.5, 0.9, 1.1, 1),
        new Pieza("Brazales lamelares", ["Antebrazo D", "Antebrazo I"], 6, 9, 1.5, 0.9, 1.1, 1)
    ])],
    
    // Equipo básico de infantería medieval (siglos XII-XIV)
    ["Equipo de infantería", new Armadura([
        new Pieza("Capacete simple", ["Craneo"], 6, 9, 1.2, 0.8, 1.0, 1),
        new Pieza("Gambesón completo", ropa["gambesón"], 3, 5, 1.0, 1.2, 0.6, 0),
        new Pieza("Gorjal de cuero reforzado", ["Cuello"], 4, 6, 1.1, 0.7, 0.7, 1),
        new Pieza("Guantes de cuero", ropa["guantes"], 2, 4, 0.9, 0.6, 0.5, 0)
    ])],
    
    // Armadura de torneo (siglos XV-XVI)
    ["Armadura de torneo", new Armadura([
        new Pieza("Yelmo de torneo reforzado", ["Craneo", "Cara", "Cuello"], 12, 18, 2.0, 1.3, 1.8, 2),
        new Pieza("Coraza reforzada", ["Pecho", "Vientre"], 12, 18, 2.0, 1.3, 1.8, 2),
        new Pieza("Hombreras de torneo", ["Hombro D", "Hombro I"], 12, 18, 2.0, 1.3, 1.8, 2),
        new Pieza("Brazales de torneo", ["Antebrazo D", "Antebrazo I", "Codo D", "Codo I"], 12, 18, 2.0, 1.3, 1.8, 2),
        new Pieza("Guanteletes reforzados", ropa["guantes"], 12, 18, 2.0, 1.3, 1.7, 2),
        new Pieza("Musleras de torneo", ["Muslo Superior D", "Muslo Superior I", "Muslo Inferior D", "Muslo Inferior I"], 12, 18, 2.0, 1.3, 1.8, 2),
        new Pieza("Grebas de torneo", ["Pierna Inf D", "Pierna Inf I", "Rodilla D", "Rodilla I"], 12, 18, 2.0, 1.3, 1.8, 2)
    ])],
    
    // Cota de anillos (anterior a cota de malla)
    ["Cota de anillos", new Armadura([
        new Pieza("Cota de anillos", ropa["camisa"], 5, 8, 1.2, 0.4, 0.7, 1),
        new Pieza("Calzas de anillos", ropa["pantalones"], 5, 8, 1.2, 0.4, 0.7, 1),
        new Pieza("Casco cónico simple", ["Craneo"], 6, 9, 1.2, 0.8, 1.0, 1),
        new Pieza("Túnica acolchada", ropa["camisa"], 2, 3, 0.9, 1.1, 0.5, 0)
    ])]
]);


//#endregion