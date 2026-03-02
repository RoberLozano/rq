var colors = ["ForestGreen","FireBrick","LightSlateGray", "blue","Maroon","PaleGreen","Sienna","Teal", "orange", "grey", "purple","GoldenRod","Cyan","PaleGoldenRod"];
var color = colors[0];

class Tirador {
    constructor(nombre, arco, color,suerte=[]) {
        this.nombre = nombre
        this.arco = arco
        if(!color) this.color= colors.pop()
        else
        this.color = color
        this.suerte=suerte
        this.tiros = []
    }


    tirar(tirada) {
        this.tiros.push(tirada);

    }

    dados(d) {
        this.tiros.push(this.tirada(d));
        
    }

    tirada(t) {
        let habilidad=this.arco;

        if (t == 100)
            return 0; //la pifia siempre es pifia
    
        /**
    * da el valor con las bonificaciones sumada
    * TODO: utiliza la variable global pj, tal vez deberia hacerlo desde Animal
    * o incluso un map golbal de Animales que se acceda por nombre
    */
    
    
        //poner posibles bonificaciones en especialñ y crítico
        var e = Math.round(habilidad * 0.2)
        var c = Math.round(habilidad * 0.05)
    
        if (this.suerte.length > 0) {
            // console.log("SUERTE"+this.suerte);
            let mejor = tirada(t);
            this.suerte.forEach(valor => {
                // let v= parseInt(valor)+parseInt(t);//si no concatena el hdp
                let v = +valor + (+t) //así parece q suma
                let x = tirada(v, habilidad);
                // console.log(` mejor=${mejor}, tirada(${v})=${x}`);
                if (x > mejor) mejor = x;
            });
            return mejor;
        }
        var d = 0;
        //TODO: soporte para -1,etc en tiradas?
        switch (true) {
            case (t == 7 || t == 77):
                console.log("SUPERCRÍTICO");
                 return diana(d,this.color);
            case (t == 100):
                break; //calcular otras pifias
            case (t <= c):
                d = t * (20 / (c));
                 console.log(t + "->" + d + " CRÍTICO");
                  return diana(d,this.color);
            case (t <= e):
                d = (t-e) * (10 / e) + 20;
                 console.log(t + "->" + d + " ESPECIAL");
                  return diana(d,this.color);
            case (t <= habilidad):
                // d = (t - e) * ((70 + e) / habilidad) + 30;console.log(t + "->" + d + " éxito"); return diana(d,this.color);
                d = (t - e) * ((70 + e) / habilidad) + 30
                // d = escalar(t,e,100,30,100);
                 console.log(t + "->" + d + " éxito");
                  return diana(d,this.color);
            case (t > habilidad):
                console.log("FALLO " + t); return 0; break;
            default:
                ;
        }
    }
    

    total() {
        var total = 0;
        for (let i of this.tiros) total += i;
        return +total.toFixed(1);
    }

    mejor() {
        return Math.max(...this.tiros);
    }

    peor() {
        return Math.min(...this.tiros);
    }

    numTiros() { return this.tiros.length }


}

class Torneo {
    constructor(nombre, distancia, rondas, tiros) {
        this.nombre = nombre
        this.distancia = distancia
        this.rondas = rondas
        this.tiros = tiros
        this.participantes = []
    }
    /**
     * 
     * @param {Tirador} participante añade un participante
     */
    add(participante) {
        this.participantes.push(participante)
    }

    acabarRonda() {
        var maxR = this.participantes.reduce((a, b) => a.numTiros() > b.numTiros() ? a : b).numTiros();

        console.log(maxR)
        this.participantes.forEach((t, i) => {
             color = t.col;
            if (t.numTiros() < maxR)
                t.dados(d(100));
            // t.tirar(tirada(d(100),t.arco))
        });
        this.tabla()
    }

    max() {
        let max = this.participantes.reduce((a, b) => a.total() > b.total() ? a : b).total();
        let nombre = this.participantes.reduce((a, b) => a.total() > b.total() ? a : b).nombre;
        console.log(max, nombre)
    }
    mejor() {
        let max = this.participantes.reduce((a, b) => a.mejor() > b.mejor() ? a : b);
        // let nombre= this.participantes.reduce((a,b)=>a.total()>b.total()?a:b).nombre;
        console.log(max)
        console.log(max.mejor());
    }
    lanzarRonda(veces = 1) {
        for (let index = 0; index < veces; index++) {
            this.participantes.forEach((t, i) => {
                color = colors[i];
                t.dados(d(100));
            });
        }
        this.tabla()

    }


    /**
     * Genera una tabla del torneo
     * @param {String} t El id de la tabla
     */
    tabla(t = 'tbTorneo') {
        limpiar(t);
        var table = document.getElementById(t);
        this.participantes.forEach((p, index) => {
            var row = table.insertRow();
            var cell = row.insertCell(0);
            // cell.innerHTML = '<i data-toggle="tooltip"  id="' + p.nombre + '" title=' + p.arco  + '>' + p.nombre + '</i>';
            cell.innerHTML = `<span data-toggle="tooltip"  id="${p.nombre}" title="${p.arco}%" >  <b>${p.nombre}</b> <span style="color: ${p.color};">&#11044</span>  </span>`
            // cell.tooltip({title: `<h1><strong>HTML</strong> ${p.arco} <code>the</code> <em>tooltip</em></h1>`, html: true, placement: "bottom"});

            for (var i = 0; i < p.numTiros(); i++) {

                var cell = row.insertCell(i + 1);
                // cell.innerHTML = '<i data-toggle="tooltip"  id="' + p.nombre + "| tiro" + i + '" title=' + p.nombre + '>' + (p.tiros[i]) + '</i>';
                cell.innerHTML = `<span data-toggle="tooltip"  id="${p.nombre}|tiro" title="${p.nombre}" >  ${p.tiros[i]}  </span>`
                // cell.tooltip({title: "<h1><strong>HTML</strong> $keys[i] <code>the</code> <em>tooltip</em></h1>", html: true, placement: "bottom"});
                // console.log(keys[i] + ":" + values[i]); //check your console to see it!
            }
            cell = row.insertCell(i + 1);
            cell.innerHTML = `<i data-toggle="tooltip"  id="${p.nombre} total" title="total"> <b> ${p.total()} <b> </i>`
            //el total

        });


    }
}

// class TipoTirada {
//   //TODO: quitar static para que vaya en firefox
//   static tirada = ["PIFIA", "FALLO", "EXITO", "ESPECIAL", "CRITICO", "SUPERCRITICO"];
//   static get PIFIA() {
//       return 0;
//   }
//   static get FALLO() {
//       return 1;
//   }
//   static get EXITO() {
//       return 2;
//   }
//   static get ESPECIAL() {
//       return 3;
//   }
//   static get CRITICO() {
//       return 4;
//   }
//   static get SUPERCRITICO() {
//       return 5;
//   }


// }



/* <g id="tiros" fill="#fe0f0b" stroke-width="1.4137"></g> */
function limpiar(id = 'tiros') {
    document.getElementById(id).innerHTML = "";
}

//** Diana horizontal*/
function dh(tirada, color = "green", r = "0.1") {
    var x = tirada
    let at = { 'cx': x / 10, 'cy': 0, 'r': r, 'fill': color }
    appendSVGChild('circle', document.getElementById('tiros'), at)
    // console.log("Puntuacion " +((100-tirada)/20+5))
    // console.log("Puntuacion " +((100-tirada)/10))

    let puntuacion = ((100 - tirada) / 10)

    return puntuacion;

}

function diana(tirada,color, r = "0.2") {
    var x = re(tirada, 0); //x aleatorio
    var t2 = tirada * tirada;
    var x2 = x * x;
    // console.log(t2,x2);
    var y = Math.sqrt(t2 - x2);

    var sx = Math.random() < 0.5 ? -1 : 1;
    var sy = Math.random() < 0.5 ? -1 : 1;
    

    let at = { 'cx': sx * x / 10, 'cy': sy * y / 10, 'r': r, 'fill': color,'stroke':"black", 'stroke-width':0.04,'title':"Hola" }
    appendSVGChild('circle', document.getElementById('tiros'), at)
    // console.log("Puntuacion " +((100-tirada)/20+5))
    // console.log("Puntuacion " +((100-tirada)/10))
    let puntuacion = +((100 - tirada) / 10).toFixed(1)

    return (puntuacion) ? puntuacion : 0;

}

//random
function re(max, min = 1) {

    return (Math.random() * max + min);
}

// un dado de min a max
function d(max, min = 1) {
    return Math.floor(Math.random() * max + min);
}

/**
 * Especial
 * @param {int} habilidad porcentaje habilidad
 */
function e(habilidad) {
    return Math.round(habilidad * 0.2)
}
/** crítico */
function c(habilidad) {
    return Math.round(habilidad * 0.05)

}
/** El 10% */
function diez(habilidad) {
    return Math.round(habilidad * 0.1)
}

/**
     * Te devuelve que tipo de tirada se obtiene con t
     * @param {number} t la tirada del dado
     */
function tirada(t, habilidad, suerte = []) {

    if (t == 100)
        return 0; //la pifia siempre es pifia

    /**
* da el valor con las bonificaciones sumada
* TODO: utiliza la variable global pj, tal vez deberia hacerlo desde Animal
* o incluso un map golbal de Animales que se acceda por nombre
*/


    //poner posibles bonificaciones en especialñ y crítico
    var e = Math.round(habilidad * 0.2)
    var c = Math.round(habilidad * 0.05)

    if (suerte.length > 0) {
        // console.log("SUERTE"+suerte);
        let mejor = tirada(t);
        suerte.forEach(valor => {
            // let v= parseInt(valor)+parseInt(t);//si no concatena el hdp
            let v = +valor + (+t) //así parece q suma
            let x = tirada(v, habilidad);
            // console.log(` mejor=${mejor}, tirada(${v})=${x}`);
            if (x > mejor) mejor = x;
        });
        return mejor;
    }
    var d = 0;
    //TODO: soporte para -1,etc en tiradas?
    switch (true) {
        case (t == 7 || t == 77):
            console.log("SUPERCRÍTICO");
             return diana(d);
        case (t == 100):
            break; //calcular otras pifias
        case (t <= c):
            d = t * (20 / (c));
             console.log(t + "->" + d + " CRÍTICO");
              return diana(d);
        case (t <= e):
            d = (t-e) * (10 / e) + 20;
             console.log(t + "->" + d + " ESPECIAL");
              return diana(d);
        case (t <= habilidad):
            // d = (t - e) * ((70 + e) / habilidad) + 30; console.log(t + "->" + d + " éxito"); return diana(d);
            d = escalar(t,e,100,30,100);
             console.log(t + "->" + d + " éxito");
              return diana(d);
        case (t > habilidad):
            console.log("FALLO " + t); return 0; break;
        default:
            ;
    }
}


function t1(t, habilidad, suerte = []) {
    let toriginal=t;

    if (t == 100)
        return; //la pifia siempre es pifia

    /**
* da el valor con las bonificaciones sumada
* TODO: utiliza la variable global pj, tal vez deberia hacerlo desde Animal
* o incluso un map golbal de Animales que se acceda por nombre
*/


    //poner posibles bonificaciones en especial y crítico
    var e = Math.round(habilidad * 0.2)
    var c = Math.round(habilidad * 0.05)


    if (suerte.length > 0) {
        // console.log("SUERTE"+suerte);
        let mejor = tirada(t,habilidad);
        suerte.forEach(valor => {
            // let v= parseInt(valor)+parseInt(t);//si no concatena el hdp
            let v = +valor + (+t) //así parece q suma
            let x = tirada(v);
            // console.log(` mejor=${mejor}, tirada(${v})=${x}`);
            if (x > mejor) {mejor = x;t=v}
        });
        
    }

    var d = 0;
    //TODO: soporte para -1,etc en tiradas?
    switch (true) {
        case (t == 7 || t == 77):
            console.log("SUPERCRÍTICO"); diana(d); break;
        case (t == 100):
            break; //calcular otras pifias
        case (t <= c):
            d = t * (20 / (c)); console.log(toriginal+ "->"+ t + "->" + d + " CRÍTICO"); diana(d); log("crítico"); break;
        case (t <= e):

            d = (t) * (10 / e) + 20;
            //  d = escalar(t,c,e,20,30)
            console.log(toriginal+ "->"+ t + "->" + d + " ESPECIAL"); diana(d, 'orange'); break;
           

        case (t <= habilidad):
            // d = escalar(t,e,100,30,100); console.log(t + "->" + d + " éxito"); diana(d, 'grey'); break;
            d = (t - e) * ((70 + e) / habilidad) + 30; console.log(toriginal+ "->"+ t + "->" + d + " éxito"); return diana(d);
        case (t > habilidad):
            console.log("FALLO");; break;
        default:
            ;
    }
}


function todos(porcentaje, veces = 1, suerte=[]) {
    let sum = 0;
    for (; veces > 0; veces--)
        for (let index = 1; index <= 100; index++) {
            tirada(index, porcentaje,suerte);
            sum++;

        }

    console.log(sum);
}

// function puntos(habilidad, tirada) {
//   switch (tirada) {
//     case (TipoTirada.SUPERCRITICO): return 0;
//     case ( TipoTirada.PIFIA): return 100;
//     case ( TipoTirada.CRITICO): return 
//     case ( TipoTirada.ESPECIAL):
//     case ( TipoTirada.EXITO):
//     case ( TipoTirada.FALLO):
//     default:
//         ;
// }

// }

function appendSVGChild(element, target, attributes = {}, text = '') {
    let e = document.createElementNS('http://www.w3.org/2000/svg', element);
    e.id = element + "Creado";
    lastElement = e;
    Object.entries(attributes).map(a => e.setAttribute(a[0], a[1]));
    if (text) {
        e.textContent = text;
    }
    target.appendChild(e);
    return e;
};

// let resultados = [];
// for (let i = 0; i < 10; i++)
// 	resultados[i] = 0;
// for (let i = 0; i < 10000; i++) {
// 	// Alex intenta entender qué hago aquí
// 	resultados[d(10) - 1]++;
// }
// console.log(resultados);

function log(params) {
    document.getElementById('log').innerHTML = params
}

function escalar(x,m1,M1,m2,M2) {
    let d1=M1-m1;
    let d2=M2-m2;
    return (x-m1)*(d2/d1)+m2;
}

let x=0;
m1=69
M1=100
m2=1
M2=68
// for (x = m1; x <= M1; x++) {
//     console.log(x+"->"+escalar(x,m1,M1,m2,M2));
    
// }


var ti1 = new Tirador("tirador 1", 50,"grey");
var ti2 = new Tirador("tirador 2", 45, "blue");
var ti3 = new Tirador("tirador 3", 36,);
var ti4 = new Tirador("tirador 4", 20);
var ti5 = new Tirador("tirador 5", 99);
// var ti6 = new Tirador("tirador 6", 99);
// var ti7 = new Tirador("tirador 7", 99);
var roci = new Tirador("Rosssel", 69,"ForestGreen");


var torneo = new Torneo("nombre", 100, 3, 3);

window.onload = function () {

torneo.add(roci);
torneo.add(ti1);
torneo.add(ti2);
torneo.add(ti3);
torneo.add(ti4);
torneo.add(ti5);
// torneo.add(ti6);
// torneo.add(ti7);



    // torneo.lanzarRonda(10)
    // torneo.lanzarRonda()
    // torneo.lanzarRonda()
    // torneo.lanzarRonda()

    // ti1.tirar(13)
    torneo.tabla();
};