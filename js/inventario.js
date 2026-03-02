/* Roberto Lozano Sáez 2019 */

// import { D } from '/D.js';


class Objeto extends Modificable {
  constructor(nombre, peso = 0, valor = 0) {
    super()
    // this.clase = this.constructor.name;
    // console.log(this.clase);
    this.nombre = nombre || "";
    this.peso = peso;
    this.valor = valor;
    this.bonificador = null;
    this.efectos = null;
    this.mods = {}

  }

  get pesa() {
    return this.peso
  }

  // setAll(o) {
  //   // const keys = Object.keys(this);
  //   // const oKeys = Object.keys(o);

  //   // const values = Object.values(o);
  //   for (let key in o) {
  //     this[key] = o[key];
  //   }
  //   // this.nombre = o.nombre;
  //   // this.peso =   o.peso ;
  //   // this.valor =  o.valor ;
  // }


  //para los select de la tabla
  get id() {
    return this.nombre + this.ctd + this.peso + this.valor;
  }

    /**
   * 
   * @param {ModHab} mod El modificador de objeto
   */
    addMod(mod) {
      console.log(mod);
      if (!this.mods[mod.atributo])
        this.mods[mod.atributo] = {}
  
      this.mods[mod.atributo][mod.id] = mod;
      //ÑAPA para que actualize el valor total
      // this.valor++; this.valor--;
    }
  
    /**
   * 
   * @param {ModHab} mod El modificador de objeto a eliminar
   */
    delMod(mod) {
      console.log(mod);
      if (!this.mods[mod.atributo])
        return;
  
      //ÑAPA para que actualize el valot total
      this.valor++; this.valor--;
  
      delete this.mods[mod.atributo][mod.id];
      // this.t=this.total();
  
    }

/**
 * 
 * @param {Animal} pj El personaje en el que se equipa el objeto
 */
    equipar(pj){
      this.equipado=true;
      if(this.listaMods){
        for(let m in this.listaMods){
          console.error(m);
          pj.addModificadores(this.listaMods[m])
        }
        
      }
    }

    /**
 * 
 * @param {Animal} pj El personaje en el que se desequipa el objeto
 */
    desequipar(pj){
      this.equipado=false;
      if(this.listaMods){

        for(let m in this.listaMods){
          console.error(m);
          pj.delModificadores(m)
          // pj.delModificadores(this.listaMods[m])
        }
        
      }
    }

}

class Objetos extends Objeto {
  constructor(nombre, peso, valor, ctd = 1) {
    super(nombre, peso, valor);
    this.ctd = ctd;
  }

  setAll(o) {
    super.setAll(o);
    // this.nombre = o.nombre;
    // this.peso =   o.peso ;
    // this.valor =  o.valor ;
    this.ctd = o.ctd || 1;
  }

  // devuelve el precio de la cantidad total
  precioTotal() {
    return this.ctd * this.valor;
  }

  get pesa() { return roundTo(4, this.ctd * this.peso); } //roundTo está en index.html


  //incrementar la cantidad, negativos para decrementar
  inc(valor = 1) {
    this.ctd += valor;
  }

  /**
   * 
   * @param {Number} numero un numero con la cantidad de objetos a separar
   * @returns {Objetos}
   */
  separar(numero) {
    if (numero > 0 && numero < this.ctd) {
      var copia = copiar(this)
      copia.setAll(this);
      copia.ctd = numero;
      this.ctd = this.ctd - numero;

      return copia;
    }

  }

  unir(array) {
    var total = this.ctd;
    var no = false;
    array.forEach(o => {
      if (o instanceof Objetos && o.ctd > 0 &&
        this.nombre == o.nombre &&
        this.peso == o.peso &&
        this.efectos == o.efectos &&
        this.valor == o.valor) {

        total += +o.ctd;

      }
      else {
        console.log('falla ' + o.nombre);
        no = true;
        return false;
      }
    });

    if (no) return false;
    var copia = copiar(this)
    copia.setAll(this);
    copia.ctd = total;
    return copia;

  }


}



class Usable extends Objeto {
  constructor(nombre, peso, valor) {
    super(nombre, peso, valor);
  }
  usar() {
    console.log(`${this.nombre} usado`);
  }
}

class Gema extends Usable {
  constructor(nombre = 'Gema', peso, valor, capacidad, pm = 0) {
    super(nombre, peso, valor);
    this.capacidad = capacidad;
    this.pm = pm;
  }
  /**
   * Rellena cierta cantidad de PM
   * @param {number} ctd PM a rellenar
   * @returns los puntos de magia por llenar todavía
   */
  rellenar(ctd) {
    this.pm += ctd;
    if (this.pm > this.capacidad) this.pm = this.capacidad; //evito que se rellene de más
    return this.capacidad - this.pm;

  }
  /**
   * Gasta cierta cantidad de PM
   * @param {number} ctd PM a gastar
   * @returns los puntos de magia que le faltan a la gema
   */
  gastar(ctd) {
    let resto = ctd - this.pm
    this.pm -= ctd;
    if (this.pm < 0) pm = 0; //si son negativos se quedan en 0
    return resto;
  }

  /**Rellena la capacidad de la gema por el nombre
 * 
 * @param {String} s un String con el nombre que incluye la capacidad
 */
  parse(s) {
    s = s.toUpperCase().replace('GEMA', '');
    if (s.toUpperCase().includes('PM')) s = s.replace('PM', '')
    s = s.trim()
    let puntos = parseInt(s);

    if (puntos) {
      this.capacidad = puntos;
    }


  }

  //sobreescribe
  get id() {
    // return this.nombre + this.ctd + this.peso + this.valor;
    return super.id + this.pm + this.capacidad;
  }


}

class Pociones extends Objetos {
  constructor(nombre = "Poción", peso = 0.1, valor, ctd, efectos) {
    super(nombre, peso, valor, ctd);
    this.efectos = efectos;

  }
  tomar() {
    console.log("me meto en tomar:" + this.efectos);
    if (this.ctd <= 0) return;
    eval(this.efectos);
    // (pj.inventario.navegar(nav).darObjeto(this)).ctd--;
    if (this.ctd == 1)
      pj.inventario.navegar(nav).sacar(this); //si ya no quedan más se borra
    else
      --this.ctd;
    // 
    pj.save();
  }

  /**Rellena efectos de la poción (solo pM,G,F  por ahora)
   * 
   * @param {String} s un String con el nombre de la poción que da sus efectos
   */
  parse(s) {
    s = s.replace('Poción', '');
    let p;

    if (s.toUpperCase().includes(' PM')) { p = 'PM'; s = s.replace('PM', '') }
    else
      if (s.toUpperCase().includes(' PG')) { p = 'PG'; s = s.replace('PG', '') }
      else
        if (s.toUpperCase().includes(' PF')) { p = 'PF'; s = s.replace('PF', '') }

    s = s.trim()
    let puntos = parseInt(s);

    if (p && puntos) {
      this.efectos = `pj.modificarPuntos(${p}, ${puntos})`
    }


  }

}
class Contenedor extends Objeto {
  constructor(nombre, peso, valor, max, multiplicador = 1) {
    super(nombre, peso, valor);
    this.multiplicador = multiplicador;
    this.max = max||null;
    this.objetos = [];

  }

  setAll(o) {
    this.nombre = o.nombre;
    this.peso = o.peso;
    this.valor = o.valor;
    this.max = o.max|| null;
    // this.objetos= o.objetos ;
    let ot = [];



    for (let ob of o.objetos) {
      //miro los distintos tipos de objetos por una propiedad única
      //TODO: tal vez poner el tipo de clase en una propiedad
      let oo;
      // console.log(ob);
      try {
        oo = Clase.convertir(ob);
        // if (ob.hasOwnProperty("pm")) { oo = new Gema(); }
        // else
        //   if (ob.hasOwnProperty("efectos")) { oo = new Pociones(); }
        //   else
        //     if (ob.hasOwnProperty("capacidad")) { oo = new Gema(); }
        //     else
        //       if (ob.hasOwnProperty("objetos")) { oo = new Contenedor(); }
        //       else
        //         if (ob.hasOwnProperty("daño")) { oo = new Arma(); }
        //         else
        //           if (ob.hasOwnProperty("ctd")) { oo = new Objetos(); }
        //           else { oo = new Objeto() }
        oo.setAll(ob);
        ot.push(oo);
        
      } catch (error) {
        console.error(ob);
        console.error(error);
      }

    }


    this.objetos = ot;

  }


  get carga() {
    let c = 0;
    for (var o of this.objetos)
      // c+=o.pesoTotal(); //da problemas con los datos de firebase database, terndria que convertir el array en objetos
      c += o.pesa;
    return c * this.multiplicador;
  }

  add(objeto, index) {
    // if(this.pesoLibre()>=objeto.pesoTotal)
    // console.log('add', objeto, index);
    // else (console.log("Demasiado peso")); 
    if (typeof index === 'number')
      this.objetos.splice(index, 0, objeto);
    else
      this.objetos.push(objeto);
  }


  get pesa() {
    return this.carga + this.peso;
  }

  pesoLibre() {
    return this.max - this.carga;
  }

  darObjeto(objeto) {
    var resultado=null;
    if (typeof objeto === "string") {
      return Object.values(this.objetos).filter(obj => obj.nombre === objeto)[0]
      this.objetos.forEach(o => {
        console.log(o.nombre);
        if(o.nombre===objeto){
          console.log("ENCONTARDO");
          console.log(resultado);
          resultado=o;
          return resultado;
        } 
      });
    }
    else {
      var pos = this.objetos.indexOf(objeto);
      console.log("Encontrado en pos:" + pos);
      if (pos > -1) return this.objetos[pos];
    }


  }

  //saca el objeto en la posición 'objeto' si está
  sacar(objeto) {
    var pos = this.objetos.indexOf(objeto);
    console.log("Encontrado en pos:" + pos);
    if (pos > -1) {
      this.objetos.splice(pos, 1);
      return objeto;
    }
  }
  //quita el objeto en la posición 'i' y lo retorna
  sacarIndex(i) {
    var pos = this.objetos[i];
    this.objetos.splice(i, 1);
    return pos;
  }

  sacarTodo() {
    this.objetos = [];
  }

  navegar(indices) {

    if (indices.length == 0) {
      // console.log("devuelvo" + this.nombre + " queda: " + indices);
      // console.log(this);
      return this;
    }

    if (this.objetos[indices[0]] instanceof Contenedor) {
      let resto = indices.slice(1);
      // console.log(resto);
      return this.objetos[indices[0]].navegar(resto)
    }
  }

  //ok
  /**
   * @param {*} objeto el objeto a mover, si es un numero es el índice que ocupa en el contenedor
   * @param {*} otroContenedor el contenedor al que se va a mover
   */
  mover(objeto, otroContenedor) {
    if (typeof objeto === "number") {
      if (objeto < 0 || objeto >= this.objetos.length) return; //si está fuera de indices no hace nada
      objeto = this.sacarIndex(objeto)
    }

    else
      this.sacar(objeto);

    otroContenedor.add(objeto);
  }

  subir(objeto) {
    let i = this.objetos.indexOf(objeto);
    this.add(this.sacar(objeto), i - 1);

  }



  //  /**
  //   * Se da el contenedor que hay en la ruta especificada
  //   * @param {number[]} ruta el array ordenado de la ruta a seguir
  //   */
  //     darContenedorRuta(ruta){
  //         //TODO: hacer comprobaciones d eque la ruta sea de contenedores
  //         if(ruta.length==0) return this;



  //     }

  /**
   * Hace una búsqueda recursiva de los contenedores
   * @param {Array} lista lista de contenedores, vacio si quiere que devuelva nueva
   * @returns Array con todos lso contenedores
   */
  darContenedores(lista = null) {
    if (lista === null) var lista = [];
    if (this instanceof Contenedor) lista.push(this);
    this.objetos.forEach(element => {
      if (element instanceof Contenedor) {
        // console.log(element.nombre + " es contenedor");
        element.darContenedores(lista);
      }
    });
    return lista;
  }
  /**
   *  Da una lista con todos los objetos de esa clase 
   * buscando recursivamente (dentro de cada contenedor)
   * 
   * @param {class} clase la clase que se quiere buscar
   * @returns
   * @memberof Contenedor
   */
  darClaseRecursiva(clase, lista = null,) {
    if (lista === null) var lista = [];
    this.objetos.forEach(element => {
      if (element instanceof Contenedor) {
        element.darClaseRecursiva(clase, lista);
      }
      if (element instanceof clase) { lista.push(element); }
    });
    return lista;
  }

  /**
   *  Da una lista con todos los objetos de esa clase en
   * el presente inventario (llevarlo encima)
   *
   * @param {class} clase la clase que se quiere buscar
   * @returns
   * @memberof Contenedor
   */
  darClase(clase) {
    return this.objetos.filter(obj => obj instanceof clase);
  }

  /**
   * 
   * @param {string} texto El texto del que extraer los objetos
   */
  escanear(texto) {
    var lineas = texto.split("\n");
    lineas.forEach(linea => {
      try {
        porLinea(this, linea, "\t")
      } catch (e) {
        console.log("error en linea: " + linea);
      }
    });

    function porLinea(contenedor, linea, separador = ";") {
      if (linea.startsWith(separador) || linea.startsWith("_")) return; // si la linea no tiene nombre se vuelve o si empieza en ___
      var h = linea.split(separador, 3); //nombre,peso,ctd
      let nombre = h[0];
      if (!nombre) return;
      let peso = h[1] ? Number.parseFloat(h[1].replace(',', '.')) : 0;
      let ctd = parseInt(h[2]) || 1;
      var item;

      if (ctd > 1)
        item = new Objetos(h[0], peso, 0, ctd);
      else
        item = new Objeto(h[0], peso);

      contenedor.add(item);
      console.log(item);
    }

  }

  //Guarda el contenedor entero en el firebase
  // guardarFirebase(fbInventario){
  //     fbInventario.child(this.nombre).set(this);
  // }
}

function creaInventario(nombre = "mochila") {
  var contenedor = new Contenedor(nombre, 2, 100, 15);

  //pasta

  contenedor.add(new Objetos("mm", 0.007, 1000, 2));
  contenedor.add(new Objetos("mo", 0.02, 10, 13));
  contenedor.add(new Objetos("mp", 0.02, 1, 15));
  contenedor.add(new Objetos("mb", 0.02, 0.1, 5));
  for (let i = 0; i < 5; i++) {
    contenedor.add(new Objetos("objetos" + i, i, i));
  }
  for (let i = 0; i < 5; i++) {
    contenedor.add(new Objeto("objeto" + i, i, i));
  }
  //meter un contenedor dentro de otro
  var bolsa = new Contenedor("bolsa", 1, 10, 10);
  for (let i = 0; i < 5; i++) {
    bolsa.add(new Objeto("dentro" + i, i, i));
  }

  contenedor.add(bolsa);

  var fal = new Contenedor("faltriquera", 1, 10, 10);
  for (let i = 0; i < 3; i++) {
    fal.add(new Objeto("cosa" + i, i, i));
  }


  var bolsita = new Contenedor("bolsita", 1, 1, 5);
  bolsita.add(new Objeto("anillo", 1, 10));
  bolsita.add(new Objeto("cadena", 1, 20));

  bolsa.add(bolsita);
  bolsita.add(fal);

  // bolsita.mover(bolsita.sacarIndex(0), bolsa);
  //contenedor.add(new Arma("espada", 1.2, 200));

  return contenedor;
}

/**
 * 
 * @extends Objeto
 * @implements Modificable
 */
class Arma extends Objeto {
  constructor(nombre, peso, longitud, valor, ...daños) {
    super(nombre, peso, valor);
    this.daños = daños;
    this.longitud=longitud||null;
    // console.log(this.daños);
    if (this.daños)
      this.index = 0
  }

  set daño(valor) {
    // console.log(typeof valor);
    if (typeof valor === 'string') {
      this.daños.forEach((d, i) => {
        // console.log(d.dado, i);
        if (d.dado === valor)
          this.index = i;
      });
    }
    else
      if (typeof valor === 'number' && valor >= 0 &&
        valor < this.daños.length) {
        this.index = valor
      }
      else
        if (valor instanceof Daño) {
          //si es daño con el string del dado para que lo busque
          this.daño = valor.dado
        }
    // TODO: hacer string y Daño
    this.dañar()
  }
  /**
   * Devuelve el daño indexado
   */
  get daño() {
    return this.daños[this.index]
  }

  //con mayusculas será el valor númerico
  /**
   * 
   */
  set Daño(valor) {
    // console.log(typeof valor);
    this.dmg=valor;
  }
  get Daño() {
   if (this.dmg){
    return this.dmg;
   }
   //else return 0;
   else this.dmg= this.daño.tirar();
  }

  setAll(o) {
    super.setAll(o);
    // this.nombre = o.nombre;
    // this.peso   = o.peso ;
    // this.valor  = o.valor ;
    this.daños = o.daños;
    // console.log(o.daños);
    //cargar cada daño
    this.daños = []
    // TODO: probar
    o.daños?.forEach(d => {
      if (d?.dado && d?.tipo) {
        let da = new Daño(d.dado, d.tipo);

        // console.log(da);
        this.daños.push(da)
      }


      // this.index=0;
    });
    // o.daños.forEach(element => console.log(element.dado));



  }
  dañar() {
    console.log(this.daños[this.index]);
  }

  toString() {
    let info=this.nombre;
        this.daños?.forEach(d => {
      if (d?.dado && d?.tipo) {
       info+= " "+d.dado+ d.tipo+ "."
      }

    });
     return info;
    }


}




/**
 * ARMAS A DISTANCIA COMO ARCOS Y BALLESTAS
 */
class ArmaDistancia extends Arma {
  constructor(nombre, peso, valor, daño, alcance) {
    super(nombre, peso, valor, daño);
    this.alcance = alcance;
  }

  /**
   * Sobreescribe el daño para que cuente la munición
   * @override
   *{@link Municion.daño}
   */
  get daño() {
    if (this.municion && this.municion.daño) {
      return new Daño(
        this.daños[this.index].dado + this.municion.daño,
        this.daños[this.index].tipo
      )
    }else
    return this.daños[this.index] //o super()
  }

  /**
   * No debe haber municiones distintas con el mismo nombre
   * @param {Municion} municion la munición a utilizar
   */
  utilizar(municion) {
    if (this.municion) {
      this.quitar();
    }
    this.municion = municion;
    //Las modificaciones de la munición en el arma
    if(municion.modArma)
    this.addModificadores(municion.modArma)
    console.log(this.municion);
  }
/**
 * quita la Municion actual
 */
  quitar() {
    this.delModificadores(this.municion.nombre)
    this.municion=null;

  }


}

// class Municion extends Objetos {
//   constructor(nombre, peso, valor,ctd=1, daño, alcanceRecto, alcance,
//     bonApuntado = 0, bonCritico = 0, bonDiana = 0, bonLocalización = 0) {
//     super (nombre, peso, valor, ctd = 1)
//     this.daño=daño;
//     this.alcance = alcance;
//     this.alcanceRecto = alcanceRecto
//     this.alcance = alcance
//     this.bonApuntado = bonApuntado
//     this.bonCritico = bonCritico
//     this.bonDiana = bonDiana
//     this.bonLocalización = bonLocalización
//     console.log("Municiones"+this.ctd);
//   }
// }

/**
 * Clase Munición con Mods {@link modArma}
 * @extends Objetos
 */
class Municion extends Objetos {
  constructor(nombre, peso, valor,ctd=1, daño, modArma
   ) {
    //TODO: ver si lo pongo como mods normales
    super (nombre, peso, valor, ctd = 1)

    if (daño)
    /**
     * El daño que sumar al arco. Debe empezar por + o - 
     * @type {string}*/
    this.daño=daño;

    if(modArma)
    /**
     * Es el Modificaciones que se aplicara al Arco
     * @type {Modificaciones} 
     */
    this.modArma = new Modificaciones(nombre,modArma);
  
    // console.log("Municiones"+this.ctd);
  }

  

  
}

class Arco extends ArmaDistancia {
  constructor(nombre, peso, valor, daño, alcanceRecto, alcance, FUE, bonApuntado = 0, bonCritico = 0, bonDiana = 0, bonLocalización = 0) {
    super(nombre, peso, valor, daño, alcance);
    this.alcanceRecto = alcanceRecto
    this.alcance = alcance
    this.FUE = FUE
    this.bonApuntado = bonApuntado
    this.bonCritico = bonCritico
    this.bonDiana = bonDiana
    this.bonLocalización = bonLocalización

  }

}

//#region POSESIONES
class Deposito {
  constructor(banco, cantidad, fecha, interes, vencimiento) {
    this.banco = banco
    this.cantidad = cantidad
    this.fecha = fecha
    this.interes = interes
    this.vencimiento = vencimiento
  }

  /**
   * Devuelve el dinero inicial más los intereses a la fecha
   * @param {Date} fecha fecha a la que devuelve el dinero
   */
  dinero(fecha = fechaMundo) {
    console.log(fecha, this.fecha);
    let dias = ((fecha - this.fecha) / (1000 * 60 * 60 * 24));
    var d = this.cantidad * (1 + (this.interes / 100 * dias / 365))
    return d;
  }

  /**
   * 
   * @param {Number} diferencia si se mete o se saca dinero
   * @param {Date} fecha la fecha actual
   * @param {Number} interes el interés si es distinto
   */
  actualizar(diferencia = 0, fecha = fechaMundo, interes = this.interes) {
    this.cantidad = Math.round(this.dinero(fecha) + diferencia);
    this.fecha = fecha;
    this.interes = interes;
  }
}

/**
 * Un crédito, como el depósito pero con el dinero en negativo
 */
class Credito extends Deposito {
  dinero(fecha = fechaMundo) {
    return -super.dinero(fecha)
  }
}


////#endregion

// export {Objeto, Objetos, Arma, Contenedor};



//PROBATURAS

// var array = new Array();
// var contenedor=new Contenedor("bolsa",2,100,15);
// var cz=new Contenedor("zurrón",1,100,15);
// var s;
// for(let i=0;i<10;i++){
//     var o=new Objeto("objeto"+i,i, i);
//     if(i==3) s=o;
//     contenedor.add(o);
// }
//     contenedor.mover(s,cz);
//     contenedor.mover(contenedor.sacarIndex(1),cz);
// var a1= new Arma("arma1",1,1,"1d10");
// var a2 = new Arma();
// a2.setAll(a1);
// a2.nombre="arma2";

// console.log(a1);
// console.log(a2);


// console.log("Carga:"+contenedor.carga + " , Peso libre"+contenedor.pesoLibre());

//#region Armas
var armas = [];
armas.push(new Arma("Hacha de combate", 1, 100, new Daño('1d8', 'L')));
armas.push(new Arma("Hacha de mano", 0.5, 25, new Daño('1d6', 'L')));
armas.push(new Arma("Gran hacha", 2, 120, new Daño('2d6', 'L')));
armas.push(new Arma("Alabarda", 3, 250, new Daño('3d6', 'P')));
armas.push(new Arma("Hacha danesa", 2.5, 150, new Daño('3d6', 'L')));
armas.push(new Arma("Daga", 0.5, 33, new Daño('1d4', 'P')));
armas.push(new Arma("Cuchillo", 0.2, 10, new Daño('1d3', 'L')));
armas.push(new Arma("Main gauche", 0.5, 55, new Daño('1d4', 'P')));
armas.push(new Arma("Sai", 1, 60, new Daño('1d6', 'C')));
armas.push(new Arma("Bola y cadena", 2, 250, new Daño('1d10', 'C')));
armas.push(new Arma("Triple cadena", 2, 240, new Daño('1d6', 'C')));
armas.push(new Arma("Maza de grano", 1, 10, new Daño('1d6', 'C')));
armas.push(new Arma("Martillo de guerra", 2, 150, new Daño('1d6', 'C')));
armas.push(new Arma("Gran martillo", 2.5, 250, new Daño('2d6', 'C')));
armas.push(new Arma("Maza pesada", 2.5, 220, new Daño('1d10', 'C')));
armas.push(new Arma("Maza ligera", 1, 100, new Daño('1d8', 'C')));
armas.push(new Arma("Palo de madera", 0.5, 4, new Daño('1d6', 'C')));
armas.push(new Arma("Vara", 0.5, 10, new Daño('1d6', 'C')));
armas.push(new Arma("Maza pesada", 2.5, 220, new Daño('1d10', 'C')));
armas.push(new Arma("Cayado", 1.5, 20, new Daño('1d8', 'C')));
armas.push(new Arma("Garrote de guerra", 2.5, 150, new Daño('1d10', 'C')));
armas.push(new Arma("Garrote de trabajo", 4, 150, new Daño('2d6', 'C')));
armas.push(new Arma("Garrote de troll", 5.5, 50, new Daño('2d8', 'C')));
armas.push(new Arma("Rapier", 1, 100, new Daño('1d6', 'P')));
armas.push(new Arma("Kukri", 0.5, 120, new Daño('1d4', 'L')));
armas.push(new Arma("Gladius", 1, 100, new Daño('1d6', 'P')));
armas.push(new Arma("Jabalina", 1.5, 100, new Daño('1d6', 'P')));
armas.push(new Arma("Pilum", 2, 125, new Daño('1d6', 'P')));
armas.push(new Arma("Lanza de torneo", 3.5, 150, new Daño('1d10', 'P')));
armas.push(new Arma("Lanza corta", 2, 20, new Daño('1d8', 'P')));
armas.push(new Arma("Lanza larga", 2, 30, new Daño('1d10', 'P')));
armas.push(new Arma("Pica", 3.5, 65, new Daño('2d6', 'P')));
armas.push(new Arma("Naginata", 2, 150, new Daño('2d6', 'P')));
armas.push(new Arma("Espada bastarda", 2, 230, new Daño('1d10', 'L'), new Daño('1d6', 'P')));
armas.push(new Arma("Espada ancha", 1.5, 175, new Daño('1d8', 'L')));
armas.push(new Arma("Cimitarra", 1.5, 200, new Daño('1d6', 'L')));
armas.push(new Arma("Espada de doble puño", 3.5, 320, new Daño('2d8', 'L')));
armas.push(new Arma("Azadón", 2, 5, new Daño('1d6', 'C')));
armas.push(new Arma("Guadaña", 2.5, 50, new Daño('2d6', 'L')));
armas.push(new Arma("Hoz", 0.5, 40, new Daño('1d6', 'L')));
armas.push(new Arma("Pala", 1.5, 20, new Daño('1d6', 'C')));
armas.push(new Arma("Cesto pesado", 1.5, 100, new Daño('1d3', 'C')));
armas.push(new Arma("Cesto ligero", 1, 100, new Daño('1d3', 'C')));
armas.push(new Arma("Garra de lucha", 0.1, 100, new Daño('1d4', 'L')));

function filtroArmas(array, precioMax, tipoDaño) {
  if (precioMax) {
    array = array.filter(item => item.valor <= precioMax)
  }
  if (tipoDaño) {

    array = array.filter(item => item.daños.some(d => d.tipo === tipoDaño))
    // array = array.filter(item => item.daño.tipo == tipoDaño)
  }
  //DEBUG: DEVUELVE UN ARRAY CON LOS NOMBRES
  console.log(array.map(item => item.nombre));
   
  return array;
}

//#endregion