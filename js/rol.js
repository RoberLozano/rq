//import
// import {Habilidad, BonHabilidad} from './habilidades';
// import {Objeto, Objetos, Arma, Contenedor} from './inventario';


// var Clases = {}
// Clases['Caballo']=Caballo
// Clases['Dragon']=Dragon
// Clases['Humanoide']=Humanoide


var fechaMundo = new Date(778, 0, 1, 0, 0, 0, 0);

const FUE = "FUE"
const CON = "CON"
const TAM = "TAM"
const INT = "INT"
const POD = "POD"
const DES = "DES"
const ASP = "ASP"

const Agilidad = "Agilidad"
const Comunicación = "Comunicación"
const Conocimiento = "Conocimiento"
const Magia = "Magia"
const Manipulación = "Manipulación"
const Percepción = "Percepción"
const Sigilo = "Sigilo"

const PF = "PF"
const PG = "PG"
const PM = "PM"

const PA = "PA" //Puntos de armadura naturales

const PUNTOS = ["PF", "PG", "PM"]

const CP = ["FUE", "CON", "TAM", "INT", "POD", "DES", "ASP"];

const TipoHabilidades =
  ["Agilidad"
    , "Comunicación"
    , "Conocimiento"
    , "Magia"
    , "Manipulación"
    , "Percepción"
    , "Sigilo"]



var personajesOnline = new Set();
//Cargo el firebase
try {
  var config = JSON.parse(de(coor));
  firebase.initializeApp(config);
  var database = firebase.database();
  console.log('firebase iniciado');

  database.ref('personajes').once('value').then((snapshot) => {
    const characters = snapshot.val();
    for (const key in characters) {
      personajesOnline.add(key);
    }
  });

} catch (error) {
  // alert('Error en firebase')
  console.log('Error en firebase')
}



class Efecto {
  // constructor(nombre, efecto, obj, fecha = 0) {
  constructor(nombre, efecto = new Daño('1d3', 'Fuego'), fecha = 0) {
    this.nombre = nombre;
    this.efecto = efecto;
    // this.obj = obj;
    this.fecha = fecha;
  }

  setAll(o) {
    for (let key in o) {
      this[key] = o[key];
      // console.log( this[key] + o[key]);    
    }
  }

  ok() {
    // let diferencia=0
    //   if(this.fecha==0) diferencia=0
    //   else{
    //     var fechaSub
    //     fechaSub=this.fecha
    //     console.log("fin:"+ fechaSub);
    //     console.log("act:"+ fechaAct);
    //     //los minisegundos son negativos pq es anterior a 1970
    //     //diferencia en dias
    //     diferencia = ( -fechaSub.getTime() + fechaAct.getTime() )/ 86400000 ;
    //   }	
    //   console.log("diferencia:"+ diferencia);
    //   return diferencia;

    // console.log(this.nombre+" fin:"+ this.fecha);
    // console.log(this.nombre+" act:"+ fechaMundo);
    return fechaMundo <= this.fecha;

  }

}



class Bon {
  constructor(
    {
      FUE = 0,
      CON = 0,
      TAM = 0,
      INT = 0,
      POD = 0,
      DES = 0,
      ASP = 0,

      Agilidad = 0
      , Comunicación = 0
      , Conocimiento = 0
      , Magia = 0
      , Manipulación = 0
      , Percepción = 0
      , Sigilo = 0

      , PF = 0
      , PG = 0
      , PM = 0
    }

  ) {
    //Características
    this.FUE = FUE
    this.CON = CON
    this.TAM = TAM
    this.INT = INT
    this.POD = POD
    this.DES = DES
    this.ASP = ASP

    //Habilidades
    this.Agilidad = Agilidad
    this.Comunicación = Comunicación
    this.Conocimiento = Conocimiento
    this.Magia = Magia
    this.Manipulación = Manipulación
    this.Percepción = Percepción
    this.Sigilo = Sigilo

    //Puntos
    this.PF = PF
    this.PG = PG
    this.PM = PM


  }
}

class Modificaciones extends Clase {
  constructor(id, efectos, temp = false) {
    super();
    this.id = id
    this.efectos = efectos
    this.temp = temp

  }

  buscarMod(string = this.efectos) {
    //para que multiplique con * tambien
    string = string.replace('*', 'x');

    // var av = string.match(/\s*(\+|-|x|\/)\s*(\d+\.?\d*|(\d+d\d+)?([+|-](\d+|(\d+d\d+))))([ECPG])?\s*(.*)/i);
    // var av = string.match(/\s*(\+|-|x|\/)\s*(\d+\.?\d*|\d+d\d+\+?d*)([ECPG])?\s*(.*)/i);
    var av = string.match(/\s*(\+|-|x|\/)\s*(\d+[\.\d+]*)([ECPG])?\s*(.*)/i);
    if (av) {
      let atributoHabilidad = av[3];
      let op = av[1]; let ctd = av[2]; let magnitud = av[4];
      if (atributoHabilidad) {
        return new ModHab(this.id, op, ctd, magnitud, atributoHabilidad);
        //hacer lo de añadir en la habilidad
      }
      console.log(`op ${op}, ctd ${ctd}, magnitud ${magnitud} ,
      atributoHabilidad  ${atributoHabilidad}`);
      return new Mod(this.id, op, ctd, magnitud);
    }

  }
}

class Mod extends Clase {
  /**
   * 
   * @param {*} id 
   * @param {*} op operacion a realizar (+,-,/,x,*)
   * @param {*} ctd 
   * @param {*} magnitud el atributo de la clase sobre el que se hace la modificación
   */
  constructor(id, op, ctd, magnitud) {
    super();
    this.id = id
    this.op = op
    this.ctd = ctd
    this.magnitud = magnitud
  }
  /**
   * 
   * @param {number} v El valor sobre el que hacer la operación
   * @returns El valor tras la modificación
   */
  valor(v) {

    // console.log(v);

    // console.log(this.id+". V:"+v);

    if (Array.isArray(v)) {
      // console.log((this.ctd));
      // console.log(v.concat(+this.ctd));
      // if(v.length==0) return v.concat(this.ctd);
      return v.concat(parseInt(this.op + this.ctd));
    }
    //TODO: si no es number hacer otros
    if (isNumber(v)) {
      // console.log("Estoy en num:"+v+this.ctd);

      switch (this.op) {
        case '+':
          return v + +this.ctd
          break;
        case '-':
          return v - +this.ctd
          break;
        case '/':
          return v / +this.ctd;
          break;

        default:
          return v * +this.ctd;
          break;
      }

    }



  }

  /**
   * Devuelve un nuevo ModHab a partir de un mod;
   * @param {Mod} mod El mod origen
   * @param {String||null} atributo el nombre del atributo donde aplicar la mod, v, e, c
   */
  toModHab(atributo) {
    if (!atributo) atributo = 'v';
    return new ModHab(
      this.id,
      this.op,
      this.ctd,
      this.magnitud,
      atributo)
  }

}


class ModHab extends Mod {
  constructor(id, op, ctd, magnitud, atributo = 'v') {
    super(id, op, ctd, magnitud); // Pasar argumentos al constructor base
    this.atributo = atributo;
    // super(); // Ya no son necesarios si super() los asigna
    // this.id = id
    // this.op = op
    // this.ctd = ctd
    // this.magnitud = magnitud
    // this.atributo = atributo

    //TODO: añadir localizacion(es) ej: correr, saltar, Marciales
  }


}



class ArmaNatural {
  constructor(nombre, daño, localizacion) {
    this.nombre = nombre
    this.daño = daño
    this.localizacion = localizacion
  }

  set daño(valor) {
    // console.log(typeof valor);
    if (typeof valor === 'string') {
      // var regex = /^(\d+d\d+)?([+|-](\d+|(\d+d\d+)))*[C|P|F]$/;
      // var re = new RegExp(regex);
      // console.log(re.test(valor));

      this._daño = new Daño(valor.substring(0, valor.length - 1), valor.substring(valor.length - 1))
    }
    else
      if (valor instanceof Daño) {
        //si es daño con el string del dado para que lo busque
        this._daño = valor
      }

  }
  get daño() {
    return this._daño;
  }
}

class Animal extends Clase {
  constructor(
    {
      nombre = "Anónimo",
      peso = 60, //en kg

      FUE = 10,
      CON = 10,
      TAM = 10,
      INT = 10,
      POD = 10,
      DES = 10,
      ASP = 10,

      PA = 0 //puntos de armadura natural
    }

  ) {
    super();
    // this.clase = this.constructor.name;
    this.car = {}
    this.nombre = nombre
    this.peso = peso
    this.FUE = FUE
    this.CON = CON
    this.TAM = TAM
    this.INT = INT
    this.POD = POD
    this.DES = DES
    this.ASP = ASP
    this.PA = PA //puntos de armadura natural

    // this.fecha= fechaMundo;

    this.bonificacion = new Bon({});

    // this.inventario = creaInventario("Cuerpo");
    // this.inventario = new Contenedor(this.nombre)
    this.inventario = {}

    /** Si se le puede sumar o restar a la tirada */
    this.suerte = []

    this.habilidades = {}
    this.efectos = [];
    this.mods = {}
    this.listaMods = {}
    // this.backup = null
    this.act();
    this.cuerpo = new Localizaciones(this.getMaxPuntos(PG), this.pa);
    // console.log('cuerpo' + this.getMaxPuntos(PG));
  }

  //TODO: ovwerwitr setAll()
  setAll(o) {
    super.setAll(o);
    // this.mods = ;
    // console.log(o.mods);
    //ÑAPA, Como son objetos anidados no hace bien el SetAll (imagino)
    //Sobreescribo, pero como va con id da igual
    for (let key in o.listaMods) {
      this.addModificadores(o.listaMods[key]);
    }

    // for (let key in o.mods) {
    //   for( let m in o.mods[key])
    //   console.log(o.mods[key][m])
    //   this.addModificadores( o.mods[key][m]);
    //   }



    // this.mods =o.mods;
  }

  // Puntos de magia y de fatiga para que te los den redondeados
  set pf(valor) { this.PF = valor; }
  get pf() { return this.getTotal(PF) }

  set pm(valor) { this.PM = valor; }
  get pm() { return this.getTotal(PM) }

  set pa(valor) { this.PA = valor; }
  get pa() { return this.getTotal(PA) || 0 }

  get pg() { return this.getMaxPuntos('PG') - this.cuerpo.darDaño() }

  set nacimiento(valor) {
    if (typeof valor === 'string') {
      // let d=new Date(valor+'T00:00:00')
      let d = new Date(valor)
      if (d instanceof Date && !isNaN(d)) this.nacimiento = d
      else
        console.log('error de conversion en nacimiento');
    }
    else
      if (valor instanceof Date) {
        //si es daño con el string del dado para que lo busque
        this._nacimiento = valor.fechahora();
      }

    // console.log('Nacimiento',this.nacimiento);

  }

  get nacimiento() {
    return new Date(this._nacimiento);
  }

  set edad(valor) {
    // console.log(typeof valor);
    console.log(valor);
    if (typeof valor === 'string') {
      // let d=new Date(valor+'T00:00:00')
      let d = new Date(valor)
      if (d instanceof Date && !isNaN(d)) this.nacimiento = d
      else
        this.edad = parseInt(valor)
      // this.edad=parseFloat(valor)
    }
    else
      if (valor instanceof Date) {
        //si es daño con el string del dado para que lo busque
        this.nacimiento = valor
      }
      else
        if (isNumber(valor)) {
          this.nacimiento = fechaMundo.mod('año', -valor)
        } else {
          console.log('Formato inadecuado');
        }

  }
  get edad() {
    if (fechaMundo > this.nacimiento) {
      let a = fechaMundo.getFullYear() - this.nacimiento.getFullYear();
      let m = fechaMundo.getMonth() - this.nacimiento.getMonth();
      let d = fechaMundo.getDate() - this.nacimiento.getDate();
      console.log(a, m, d);
    }
    return (fechaMundo - this.nacimiento) / (3600000 * 24 * 365);
  }

  //TODO: esto para que haga la trampa Angular
  set _FUE(value) { this.FUE = value }
  get _FUE() {
    this.act();
    return this.FUE;
  }

  /**
   * Regenera los puntos (PM,PG,PF) durante el tiempo transcurrido
   */
  regenerar(fechaActual = fechaMundo) {
    var tiempo = (fechaActual - this.fecha) / 1000; //en segundos
    let s_minuto = 60;
    let s_hora = 3600;
    var rPM, rPG, rPF;
    //recupera los PM en un día
    rPM = this.getMaxPuntos(PM) / (24 * s_hora)
    //1 PG por día por cada 10 de CON y localización
    rPG = (this.getCar(CON) / 10) / (24 * s_hora)
    //recupera los pF en una hora
    rPF = this.getMaxPuntos(PF) / (s_hora)

    //TODO simplificar a 3 decimales

    this.PM = Math.min(this.getMaxPuntos(PM), this.PM + rPM * tiempo)
    this.PF = Math.min(this.getMaxPuntos(PF), this.PF + rPF * tiempo)

    console.log('PM', this.PM, rPM * tiempo);
    console.log('PG', this.PG, rPG * tiempo);

    //TODO: hacer curar con sanar de cuerpo
    // esto iría sanando tods las localizaciones a la vez
    // this.PG = Math.min(this.getMaxPuntos(PG), this.PG + rPG * tiempo)


  }

  /**
   *Da la característica más su bonificación
   *
   * @param {string} car El nombre de la característica 
   * @returns el valor de la característica más su bonificación
   * @memberof Animal
   */
  getCar(car) {
    // return +this[car] + (+this.bonificacion[car] || 0);
    return this.getTotal(car);

  }
  /**
   * Hace una lista de los bonificadores de daño
   */
  listarBD() {
    // return ((this.getCar(FUE)+this.getCar(CON))-20)/5
    for (let i = 7; i < 30; i++) {
      // console.log(`FUE y CON: ${i}  (${i*2} ), BON: ${this.bdR(i,i)}`);
      console.log(`FUE: ${i}  (${i} ), BON: ${this.bd(i)}`);
    }
  }

  /**
   * Devuelve Bonificación de daño del personaje
   */
  getPD() {
    return this.bd(this.getCar(FUE), this.getCar(CON))
  }

  /**
   * Bonificación de daño según Runequest
   * @param {number} fue 
   * @param {number} con 
   */
  bdR(fue = this.getCar(FUE), con = this.getCar(CON)) {
    //runequest
    return ((fue + con) - 20) / 5;
  }

  /**
   * Bonificación de daño según mis reglas, sólo teniendo en cuenta la FUE
   * @param {number} fue 
   */
  bd(fue = this.getCar(FUE)) {
    return (fue - 10) / 5;
  }


  /**
   * Pone una bonificacion, acumulativa si es un string con + o -
   * o total si es un número
   * @param {string} car Nombre de la característica
   * @param {*} valor "+5"/"-2" o un número si es el valor final
   */
  sb(car, valor) {
    if (typeof valor === 'string' && (valor.startsWith("+") || valor.startsWith("-")))
      this.bonificacion[car] += parseInt(valor);
    else
      this.bonificacion[car] = valor;
    this.act();
  }

  setMaxPuntos() {
    this.PF = (this.getCar(FUE) + this.getCar(CON))
    this.PG = Math.round((this.getCar(TAM) + this.getCar(CON)) / 2)
    this.PM = Math.round((this.getCar(INT) + this.getCar(POD)) / 2)
  }


  //#region MODIFICADORES

  buscarMod(string, id = 'id') {
    // var av = string.match(/\s*(\+|-|x|\/)\s*(\d+)\s*(.*)/i);

    // // let av= string.match(/(\+|-) (\d+)/i);
    // let op = av[1]; let ctd = parseInt(av[2]); let magnitud = av[3];
    // if (av) {
    //   console.log(av[1], av[2], av[3]);
    // }

    string = string.replace('*', 'x');
    var av = string.match(/\s*(\+|-|x|\/)\s*(\d+\.?\d*)([ECPG])?\s*(.*)/i);
    // var av = string.match(/\s*(\+|-|x|\/)\s*(\d+)([ECPG])?\s*(.*)/i);
    // let av= string.match(/(\+|-) (\d+)/i);
    if (av) {
      // console.log(av);
      let atributoHabilidad = av[3];
      let op = av[1]; let ctd = av[2]; let magnitud = av[4];
      if (atributoHabilidad) {
        return new ModHab(id, op, ctd, magnitud, atributoHabilidad);
        //hacer lo de añadir en la habilidad
      }

      // let op = av[1]; let ctd = av[2]; let magnitud = av[3];

      // console.log(av[1], av[2], av[3], av[4]);
      // console.log(`op ${op}, ctd ${ctd}, magnitud ${magnitud} ,atributoHabilidad  ${atributoHabilidad}`);
      return new Mod(id, op, ctd, magnitud);
    }

    // return [op, ctd, magnitud];

  }


  getMod(car) {
    return this.mods[car];
  }

  getTotal(magnitud) {
    let total = this[magnitud];
    // console.log(this.mods[magnitud]);
    if (!this.mods[magnitud]) {
      // console.log("No hay mods"+ magnitud);
      return total;
    }
    let sumas =
      Object.values(this.mods[magnitud]).filter(x => (x.op == '+' || x.op == '-'));

    let multis =
      Object.values(this.mods[magnitud]).filter(x => (x.op == 'x' || x.op == '/'));


    if (sumas) {
      // console.log("SUMAS");
      // console.log(sumas);
      for (let s of sumas) {
        // console.log(s);
        total = s.valor(total);
      }
    }
    //  console.log(total);

    if (multis) {
      // console.log("multis");
      // console.log(multis);
      for (let s of multis) {
        total = s.valor(total);
      }

    }

    // Redondear??
    // return Math.round(total);
    return total;
  }

  //TODO: quitar
  getModTotal(magnitud) {
    let sum = 0;

    for (let key in this.mods[magnitud]) {
      sum += +this.mods[magnitud][key].ctd;
    }
    // console.log(magnitud, sum);

    this.bonificacion[magnitud] = sum;
    return sum;
  }

  /**
   * 
   * @param {Modificaciones|String} m El modificador o el nombre (id)
   */
  delModificadores(m) {
    let id;
    if (m instanceof Modificaciones)
      id = m.id
    else
      id = m;

    if (!(this.listaMods[id])) {
      // console.log("no hay efecto con esa id");
      return;
    }

    let efectos = this.listaMods[id].efectos;
    var ae = efectos.split(',')
    ae.forEach(e => {
      var mod = this.buscarMod(e, id);
      // console.log(mod);
      if (this.getHabilidad(mod.magnitud)) {
        // console.log('Lo reconoce como mod Habilidad');
        if (!(mod instanceof ModHab)) {
          mod = mod.toModHab('v');
        }
      }
      if (mod instanceof ModHab)
        this.habilidades[mod.magnitud].delMod(mod);
      else
        delete (this.mods[mod.magnitud][id])

      // this.getModTotal(mod.magnitud);

    });

    delete (this.listaMods[id]);

    // let efectos = m.efectos;
    // var ae = efectos.split(',')
    // ae.forEach(e => {
    //   var mod = this.buscarMod(e);
    //   delete (this.mods[mod.magnitud][id])
    //   this.getModTotal(mod.magnitud);

    // });
    this.act();
    // this._FUE++; this._FUE--;

  }
  /**
   * 
   * @param {Modificaciones} m La modificaciones a añadir
   */
  addModificadores(m) {
    //sobreescribe el mismo id
    this.listaMods[m.id] = m;
    // console.log(m);
    let efectos = m.efectos;
    var ae = efectos.split(',')
    ae.forEach(e => {
      var mod = this.buscarMod(e, m.id);
      //TODO:hacerlo con lo de Modificadores.buscarMod
      // var mod = m.buscarMod(e);
      // console.log(mod);
      if (this.getHabilidad(mod.magnitud)) {
        console.log('Lo reconoce como mod Habilidad');
        if (!(mod instanceof ModHab)) {
          mod = mod.toModHab('v');
        }
        // console.log(mod);
        this.habilidades[mod.magnitud].addMod(mod);
        return;
      }
      if (!this.mods[mod.magnitud])
        this.mods[mod.magnitud] = {}

      this.mods[mod.magnitud][m.id] = mod;
      // this.mods[magnitud][m.id] = +ctd;

      this.getModTotal(mod.magnitud);

    });

    this.act();

  }



  //#endregion
  /**
   * Hace una tirada contando con la suerte total de personaje
   * @param {Habilidad|string} habilidad La habilidad o su nombre
   * @param {number} dados la tirada, si vacía se hace una nueva 1d100
   * @returns {number} el número correspondiente a la tirada
   */
  tirarHabilidad(habilidad, dados = new D(1, 100).norm()) {
    if (typeof habilidad === 'string')
      var h = this.getHabilidad(habilidad);
    else
      if (habilidad instanceof Habilidad)
        var h = habilidad;

    let tirada = h.tirada(dados, this.getTotal('suerte'));
    return tirada

  }



  //#region ENTRENAMIENTO

  entrenarHabilidad(habilidad, horas) {
    if (typeof habilidad === 'string')
      var h = this.getHabilidad(habilidad);
    else
      if (habilidad instanceof Habilidad)
        var h = habilidad;
    var inicial = h.valor;
    var bon = h.bh;
    var subir = inicial - bon;
    var valor = inicial;
    let d100 = new D(1, 100)
    let d = new D(1, 6);

    while (horas >= valor) {
      horas -= valor;
      let subida = 0;
      let dados = d100.norm()
      function p(v) { return Math.min(100, 101 - Math.round((100 - v) * 0.05)) }
      let tirada = h.tirada(dados, this.suerte);
      if (tirada == TipoTirada.SUPERCRITICO)
        subida = d.max() * 2;
      else if (dados == 100) subida = d.max() + d.norm();
      else if (dados >= p(subir)) subida = d.max();
      else
        if (dados >= subir)
          subida = d.norm()

      // console.log(dados + "->" + subida);
      valor += subida;
      // console.log("total->" + valor);
      subir = Math.min(100, valor) - bon;

    }
    h.horasEntrenadas = horas;

    return valor;

  }

  entrenarHabilidadX(habilidad, horas, x = 3) {
    var h = this.getHabilidad(habilidad);
    var inicial = h.valor;
    var valor = inicial;

    while (horas >= valor) {
      horas -= valor;
      valor += x;
    }
    console.log(valor);
  }

  simularTiradasMedia(habilidad, veces, repeticiones = 1) {
    let total = 0
    for (let index = 0; index < repeticiones; index++) {
      total += this.simularTiradasHabilidad(habilidad, veces);
    }
    let media = total / repeticiones
    console.log(`Media de ${repeticiones} repeticiones:  ${media}`);

  }

  simularHabilidadesArray(horas) {
    var ah = [] //array Habilidades
    var suma = 0;

    this.getHabilidades().forEach(habilidad => {
      suma += habilidad.valor;
    });

    console.log('SUMA:' + suma);
    // var arrayOriginal = this.getHabilidades();

    //copio habilidades
    this.getHabilidades().forEach(habilidad => {
      //sin cambiarlas
      var h = new Habilidad()
      h.setAll(habilidad);
      ah.push(h);
      // console.log(h.valor+0.00);
      let xhoras = horas * h.valor / suma

      console.log(`Entreno ${h.nombre} ${xhoras} horas`);

      h.valor = this.entrenarHabilidad(h, xhoras)
    });

    // (diferencia(arrayOriginal,ah));
    return ah;
  }

  simularHabilidades(horas) {
    var ah = {} // Habilidades
    //copio habilidades
    var suma = 0;

    for (const key in this.habilidades) {
      if (this.habilidades.hasOwnProperty(key)) {
        // console.log(this.habilidades[key]);
        var h = new Habilidad()
        h.setAll(this.habilidades[key]);
        ah[key] = h;
        suma += h.valor;
      }
    }

    console.log('SUMA:' + suma);

    for (const key in ah) {
      if (ah.hasOwnProperty(key)) {
        let h = ah[key]
        let xhoras = horas * h.valor / suma
        console.log(`Entreno ${h.nombre} ${xhoras} horas`);
        h.valor = this.entrenarHabilidad(h, xhoras)
      }
    }

    console.log('DIFERENCIAS');
    (diferencia(this.habilidades, ah));
    return ah;
  }



  simularTiradasHabilidad(habilidad, veces) {
    var h = new Habilidad()
    h.setAll(this.getHabilidad(habilidad));
    let d100 = new D(1, 100)
    let d = new D(1, 3);
    function p(v) { return Math.min(100, 101 - Math.round((100 - v) * 0.05)) }
    let vecessubidas = 0;
    for (let index = 0; index < veces; index++) {
      // console.log(index);
      h.xpTirada(d100.norm(), this.suerte);

      h.fecha = 0;
      let subida = 0;

      if (h.subible() < 50) {
        let dados = d100.norm();
        let tirada = h.tirada(dados, this.suerte);
        if (tirada == TipoTirada.SUPERCRITICO)
          subida = d.max() * 2;
        else if (dados == 100) subida = d.max() + d.norm();
        else if (dados >= p(h.subible())) subida = d.max();
        else
          if (dados >= h.subible())
            subida = d.norm()

        h.subir(subida);
        if (subida) vecessubidas++;
        // console.log(index,subida);

      }

    }
    console.log(h.valor, vecessubidas);
    return h.valor;

  }

  simularTiradasDia(habilidad, veces, dias) {
    var data = []
    var h = new Habilidad()
    h.setAll(this.getHabilidad(habilidad));
    let d100 = new D(1, 100)
    let d = new D(1, 3);
    function p(v) { return Math.min(100, 101 - Math.round((100 - v) * 0.05)) }
    let vecessubidas = 0;
    fechaMundo = new Date('0007-07-07');

    console.log(fechaMundo);
    data[0] = [];
    data[1] = [];

    for (let dia = 0; dia < dias; dia++) {

      for (let index = 0; index < veces; index++) {
        // console.log(index);
        h.xpTirada(d100.norm(), this.suerte);
        let subida = 0;

        if (h.subible() < 80) {
          console.log('xp', h.xp);
          let dados = d100.norm();
          let tirada = h.tirada(dados, this.suerte);
          if (tirada == TipoTirada.SUPERCRITICO)
            subida = d.max() * 2;
          else if (dados == 100) subida = d.max() + d.norm();
          else if (dados >= p(h.subible())) subida = d.max();
          else
            if (dados >= h.subible())
              subida = d.norm()

          h.subir(subida);
          if (subida) vecessubidas++;
          // console.log(index,subida);

        }
        if (subida) {
          console.log(fechaMundo, h.valor, +subida);
          data[0].push(fechaMundo / 1000);
          data[1].push(h.valor);

        }

      }

      fechaMundo = fechaMundo.mod('dia', 1);

    }

    console.log(h.valor, vecessubidas);
    console.log(data);
    return data;
    return h.valor;

  }

  simularTiradasSemana(habilidad, veces, semanas) {
    var h = new Habilidad()
    h.setAll(this.getHabilidad(habilidad));
    let d100 = new D(1, 100)
    let d = new D(1, 3);
    function p(v) { return Math.min(100, 101 - Math.round((100 - v) * 0.05)) }
    let vecessubidas = 0;
    fechaMundo = new Date('0007-07-07');
    console.log(fechaMundo);

    for (let dia = 0; dia < dias; dia += 7) {
      for (let index = 0; index < veces; index++) {
        // console.log(index);
        h.xpTirada(d100.norm(), this.suerte);
        let subida = 0;

        if (h.subible() < 80) {
          console.log('xp', h.xp);
          let dados = d100.norm();
          let tirada = h.tirada(dados, this.suerte);
          if (tirada == TipoTirada.SUPERCRITICO)
            subida = d.max() * 2;
          else if (dados == 100) subida = d.max() + d.norm();
          else if (dados >= p(h.subible())) subida = d.max();
          else
            if (dados >= h.subible())
              subida = d.norm()

          h.subir(subida);
          if (subida) vecessubidas++;
          // console.log(index,subida);

        }
        if (subida) {
          console.log(fechaMundo, h.valor, +subida);
        }


      }

      fechaMundo = fechaMundo.mod('dia', 1);

    }

    console.log(h.valor, vecessubidas);
    return h.valor;

  }

  //#endregion



  /**
   * 
   * @param {string} tipo PF,PG,PM
   * @param {*} valor el valor a subir o bajar, "max", por defecto, para dejarlo en el máximo de puntos, vale cualquier string
   */
  modificarPuntos(tipo, valor = "max") {
    //si es un numero se le añade (positivo o negativo)
    if (typeof valor === 'number') {
      console.log(`valor inicial: ${this[tipo]} `);
      this[tipo] += valor;
      let max = this.getMaxPuntos(tipo);//busco el máximo
      if (this[tipo] > max) this[tipo] = max;//si es mayor lo dejo en el límite
      console.log(`valor: ${valor} puntos finales:${this[tipo]} `);
      return;
    }
    this[tipo] = this.getMaxPuntos(tipo);
  }
  /**
   * Gasta n puntos de magia
   * 
   * @param {*} n numero de PM a gastar
   * @param {boolean} gemas si se quiere gastar los pm de las gemas 
   * @returns un boolean que indica si se pueden gastar esos puntos
   */
  gastarPM(n, gemas = false) {
    let pm = this[PM];
    if (pm >= n) {
      this[PM] -= n; return true;
    }
    if (gemas == false) return false;
    //Con gemas
    let extra = this.pmGemas();
    if (pm + extra < n) return false; //si no llega con gemas
    n = n - pm; this[PM] = 0;//gasto los míos
    this.gastarPMGemas(n);  //gasto las gemas

  }
  /**
   * Gasta n puntos de magia de las gemas
   * @param {number} n 
   */
  gastarPMGemas(n) {
    var quedan = n // los pm que quedan por gastar
    console.log("n:" + n);
    (this.inventario.darClaseRecursiva(Gema)).forEach(gema => {
      quedan = gema.gastar(n);
      console.log(`${gema.nombre} : y quedan ${quedan}`);
      if (quedan <= 0) return;
      n = quedan;

    });
  }

  /**
   * Devuelve el valor máximo del tipo de punto pasado
   * @param {string} puntos PF,PG,PM
   */
  getMaxPuntos(puntos) {
    switch (puntos) {
      case PF: return (this.getCar(FUE) + this.getCar(CON));
      case PG: return Math.round((this.getCar(TAM) + this.getCar(CON)) / 2);
      case PM: return Math.round((this.getCar(INT) + this.getCar(POD)) / 2);
      default:
        console.log('No hay puntos ' + puntos + '.');
    }

  }

  /**
   * Modifica una característica base y actualiza
   * @param {string} car La caracteristica: FUE,PM, etc...
   * @param {number} valor El nuevo valor
   * @param {Boolean} actualizar Si se actualiza después de subir, true por defecto
   */
  set(car, valor, actualizar = true) {
    this[car] = valor;
    if (actualizar) this.act();
  }

  /**
   * añade o modifica la habilidad en el objeto sin guardar
   * @param {Habilidad} h la habilidad que se añadirá/sobrescribirá
   */
  setHabilidad(h) {
    if (h instanceof Habilidad) {
      //Machaca lo que haya
      this.habilidades[h.nombre] = h;
      //no guardar por ahora, sino con el personaje entero
      // h.save();
    }
  }
  /**
   * añade o modifica la habilidad en el firebase
   * @param {*} h La Habilidad h, o el nombre (string) de la habilidad
   */
  saveHabilidad(h) {
    if (h instanceof Habilidad) {
      // console.log(h);
      this.habilidades[h.nombre] = h;
      console.log("guardando: personajes" + this.nombre + ("habilidades") + (h.nombre));
      database.ref("personajes").child(this.nombre).child("habilidades").child(h.nombre).set(h);
    }
    else
      if (typeof h === 'string') {
        h = this.habilidades[h.nombre];
        console.log("guardando por nombre: personajes" + this.nombre + ("habilidades") + (h.nombre));
        database.ref("personajes").child(this.nombre).child("habilidades").child(h.nombre).set(h);
      }

  }


  getHabilidad(nombre) {
    return this.habilidades[nombre];
  }

  getClaseHabilidad(clase) {
    if (typeof clase === "string") {
      return Object.values(this.habilidades).filter(obj => obj.constructor.name === clase)
    }

    return Object.values(this.habilidades).filter(obj => obj instanceof clase);
  }

  /**
   * Devuelve un array con las habilidades filtradas, o todas si no hay filtro
   * @param {*} filtro el método que filtra las habilidades
   */
  getHabilidades(filtro) {
    if (filtro)
      return Object.values(this.habilidades).filter(filtro);
    else return Object.values(this.habilidades);
  }

  // /**
  //  * Para tratar con habilidades de otros personaje, daria el .v
  //  * TODO: el E y C
  //  * @param {string} nombre de la habilidad
  //  * @returns el valor dw la habilidad con todos los bonificadores
  //  * @memberof Animal
  //  */
  // vHabilidad(nombre) {
  //   let hab = this.habilidades[nombre];
  //   hab.valor
  //   return hab.valor + hab.bvalor + this.getCar(hab.tipo)
  // }

  /**
   * 
   * @param {string} forma2 el nombre de la segunda forma
   */
  cambiaformas(forma2) {

    if (forma2 instanceof Animal)
      var f2 = forma2
    else
      var f2 = cargaLocalObjeto(forma2);
    // var _this={}
    // var _f2={}

    // PUNTOS.forEach(p => {
    //   // console.log(p,this[p]);
    //   if(this[p]){
    //     let m=this[p]/this.getMaxPuntos(p);
    //     let valor=f2.getMaxPuntos(p)*m;
    //     f2.set(p,Math.round(valor),false)
    //     // console.log(p,valor,f2.getMaxPuntos(p));
    //   }

    // });

    // limpiar daños para que no acumule de antes
    // f2.cuerpo.sanar(99999); //sanar parece que falla
    console.log('sanar ' + f2.nombre);

    f2.cuerpo.todas().forEach(l => {
      l.daño = 0;
    });

    // console.log(this.cuerpo.todas());
    this.cuerpo.todas().forEach(l => {
      // console.log(l,(l.min+l.max)/2);
      //  let fl= f2.cuerpo.darLocalizacion(l.min);
      let fl = f2.cuerpo.darLocalizacion((l.min + l.max) / 2);

      console.log(l.nombre + ' equivale a ' + fl.nombre);
      if (l.daño)
        fl.dañar(fl.pg * (l.daño / l.pg), false);
      // f2.cuerpo.dañarLocalizacion(fl.pg*(l.daño / l.pg),l.min)

    });


    return f2;

    // this.forma2 = forma2;

  }


  /**
    * Combate contra un enemigo
    * @param {Animal} enemigo El enemigo contra el que combatir
    */
  combatir(enemigo) {
    this.enemigo = enemigo
  }

  print() {
    for (let key in this) {
      console.log(key + ":" + this[key]);
    }
  }

  printCar() {
    //in para los putos índices, o no
    for (let i in CP) {
      console.log(CP[i] + ":" + this.getCar(CP[i]));
    }
  }

  //Positivos, negativos y secundarios
  P(car) { return this.getCar(car) - 10 }
  N(car) { return 10 - this.getCar(car) }
  S(car) { return Math.round((this.getCar(car) - 10) / 2) }
  SN(car) { return Math.round((10 - this.getCar(car)) / 2) }

  /**
   * actualiza el valor de los tipo de habilidades y guarda la bonificacion en las habilidades
   */
  act() {
    // this.Agilidad = this.P("DES") + this.S("FUE") + this.SN("TAM")
    // this.Comunicación = this.P("INT") + this.P("ASP")
    // this.Conocimiento = this.P("INT")
    // this.Magia = this.P("INT") + this.P("POD")
    // this.Manipulación = this.P("DES") + this.S("FUE") + this.P("INT")
    // this.Percepción = this.P("CON")
    // this.Sigilo = this.P("DES") + this.S("FUE") + this.N("TAM")

    //guardo las anteriores 
    // let oldAgilidad =this.Agilidad;
    // let oldComunicación =this.Comunicación;
    // let oldConocimiento =this.Conocimiento;
    // let oldMagia =this.Magia;
    // let oldManipulación =this.Manipulación;
    // let oldPercepción =this.Percepción;
    // let oldSigilo =this.Sigilo;

    //Roberquest (como en Excel)
    // this.Agilidad = this.P("DES") + this.S("FUE") + this.SN("TAM")
    this.Agilidad = this.P("DES") + this.S("FUE")
    this.Comunicación = this.P("INT") + this.P("ASP")
    this.Conocimiento = this.P("INT")
    this.Magia = this.P("INT") + this.P("POD") + this.S("DES")
    this.Manipulación = this.P("DES") + this.S("FUE") + this.P("INT")
    this.Percepción = this.P("CON") + this.P("INT")
    this.Sigilo = this.P("DES") + this.S("INT") + this.SN("TAM");

    // if(oldAgilidad !=this.Agilidad) actBonHab(Agilidad);
    // if(oldComunicación !=this.Comunicación) actBonHab(Comunicación);
    // if(oldConocimiento !=this.Conocimiento) actBonHab(Conocimiento);
    // if(oldMagia !=this.Magia) actBonHab(Magia);
    // if(oldManipulación !=this.Manipulación) actBonHab(Manipulación);
    // if(oldPercepción !=this.Percepción) actBonHab(Percepción);
    // if(oldSigilo !=this.Sigilo) actBonHab(Sigilo);
    if (!this.PF) this.PF = this.getMaxPuntos(PF)
    if (!this.PM) this.PM = this.getMaxPuntos(PM)

    this.actTodosBonHab();
    this.cuerpo?.actPG(this.getMaxPuntos(PG));

  }

  actTodosBonHab() {
    // console.log("actualizar todos bonificadores");
    // console.log(this.habilidades);
    // if(this.habilidades)

    for (let h in this.habilidades) {
      // console.log(h);
      // console.log("setAll habilidades"+k);
      let hab = this.habilidades[h];
      hab.bh = this.getCar(hab.tipo);
      // console.log(`${hab.bh} = ${this.getCar(hab.tipo)}`);
    }

  }
  actBonHab(tipo) {
    let bon = this.getCar(tipo);
    if (this.habilidades)
      this.habilidades.forEach(h => {
        if (h.tipo == tipo) h.bh = bon;
      });
  }

  pmGemas() {
    //TODO:
    let p = 0;
    (this.inventario.darClaseRecursiva(Gema)).forEach(element => {
      p += element.pm;
    });
    return p;
    // console.log(this.inventario.darContenedores());
  }

  pesoTotal() {
    return this.peso + this.inventario.pesoTotal();
  }

  /**
   * guarda en firebase
   */
  save() { //creo que da referencias cíclicas
    try {
      database.ref("personajes").child(this.nombre).set(this);
      console.log("GUARDADO:" + this.nombre);
    } catch (error) {
      console.log('error en Firebase, guardando local');
      console.error(error);
      this.saveLocal()
    }


  }

  /**
   * Guarda localmente en el navegador
   */
  saveLocal() {
    // let st=JSON.stringify(this)
    // console.log(st);
    // console.log(JSON.parse(st));
    this.enemigo = null; //referencias cíclicas
    localStorage.setItem(this.nombre, JSON.stringify(this));
  }

  cargarLocal(nombre = this.nombre) {
    this.setAll(JSON.parse(localStorage.getItem(nombre)))
  }

  aplicar(efecto) {
    // el efecto sólo se debería aplicar en las bonificaciones
    // a no ser que sea permanente (algo muy raro)
    // var obj = efecto.obj
    if (efecto.ok(fechaMundo))
      eval(efecto.efecto);
  }
  //TODO: mirar si quitar lo del backup
  aplicarEfectos() {
    let log = ""
    if (this.backup == null) {
      let copy = new Animal({});
      copy.setAll(this);
      this.backup = copy;
      console.log("BACKUP");

      this.backup.print();
      // console.log("backup");
      // console.log(this.backup);
      // console.log("END backup");
    }
    else {
      this.setAll(this.backup);
      console.log("cargo el backup");
      this.printCar()

    }

    this.bonificacion = new Bon({});

    for (let e of this.efectos) {

      if (e.ok()) {
        console.log("*******" + e.nombre + " aplicado " + e.fecha + " en " + this.nombre);
        log += e.nombre + " aplicado " + e.fecha.toLocaleString() + "<br>";
        this.aplicar(e);
        // this.printCar();
        // this.print();

      }
    }
    return log;
  }

  addEfecto(efecto) {
    this.efectos.push(efecto);
  }

  // sanar(tipoPuntos, valor){
  //   this.car[tipoPuntos]+= valor;
  // }

  //#region IU

  cuerpoDaño(canvas, scale = 1) {

    canvas = document.getElementById(canvas);
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // var img = document.getElementById("cuerpo");
    // ctx.drawImage(img, 0, 0, 500 * scale,  * scale);
    let todos = [];
    console.log("cuerpoDano de " + this.nombre);

    this.cuerpo.todosDaños(todos);
    console.log(todos);
    console.log(this.cuerpo);
    var y = 30;
    var x = 50;
    todos.forEach(l => {
      // console.log(l.nombre,l.daño);
      // string += `${l.nombre} :<b>${l.daño}</b>/${l.pg}<br>`
      // string+=l.nombre+":"+l.daño+"<br>";
      y += 40;


      // Texto
      ctx.globalAlpha = 1
      ctx.font = (4 * 2 + 20) * scale + 'px Sans-serif';
      ctx.strokeStyle = 'black';
      ctx.textAlign = "left"
      ctx.textBaseline = "bottom";
      // ctx.textAlign = "end" 
      ctx.lineWidth = 5;
      ctx.strokeText(l.nombre + ':' + l.daño + "/" + l.pg, x * scale, y * scale);
      ctx.fillStyle = l.daño >= 2 * l.pg ? 'red' : l.daño >= l.pg ? 'orange' : 'white';
      // ctx.fillStyle = 'white';
      ctx.fillText(l.nombre + ':' + l.daño + "/" + l.pg, x * scale, y * scale);

      //quesito
      // let cx=x;
      // let cy=y;
      // ctx.beginPath();
      // ctx.moveTo(cx, cy);
      // ctx.arc(cx, cy, 30, 0, (l.daño/l.pg)*2* Math.PI, false);
      // ctx.closePath();
      // ctx.fillStyle = l.daño>=l.pg?'red':'orange';
      // ctx.strokeStyle = 'black';
      // ctx.fill();
      // ctx.stroke();

      // ctx.globalAlpha = 0.77
      // ctx.beginPath();
      // ctx.arc(x * scale, y * scale, l.pg * 5 * scale, 0, Math.PI, false);
      // ctx.fillStyle = "grey";
      // ctx.fill();

      // ctx.globalAlpha = 1
      // ctx.font = (l.daño * 2 + 20) * scale + 'px Sans-serif';
      // ctx.strokeStyle = 'black';
      // ctx.textAlign = "center"
      // ctx.textBaseline = "top";
      // // ctx.textAlign = "end" 
      // ctx.lineWidth = 5;
      // ctx.strokeText(l.daño, x * scale, y * scale);
      // ctx.fillStyle = 'white';
      // ctx.fillText(l.daño, x * scale, y * scale);
      ctx.globalAlpha = 1;


    });
  }

  /**
   * Da el tooltip de las modificaciones de la caracteristica c, o sin c, todas als modificaciones
   * @param {string} c La caracteristica de la quedar el Tooltip de Mods o nada para dar el general
   * @returns El texto en html del Tooltip
   */
  darTooltipMods(c) {

    let html = "";
    if (c) {
      for (const key in this.getMod(c)) {
        let valor = this.getMod(c)[key];
        // let color=valor>0?'green':'red';
        let color = this.getCar(c) > this[c] ? 'green' : 'red';
        html += `${key}: <b style="color: ${color}">${valor.op} ${valor.ctd}</b><br>`
        // html += `${key}: <b style="color: ${color}">${c} ${valor.op} ${valor.ctd} </b><br>`
      }

    }
    else {
      for (const key in this.listaMods) {
        let mod = this.listaMods[key];
        // let color=valor>0?'green':'red';
        let color = this.getCar(c) > this[c] ? 'green' : 'red';
        html += `${key}: <b style="color: ${color}">${this.listaMods[key].efectos} </b><br>`
      }

    }

    return html;

    // return pj.getModTotal(c);

  }


  //#endregion IU
}
//Bonificación en Animal
var d = new Dado("3d6");

class Caballo extends Animal {
  constructor(
    {
      nombre = "Caballo",
      peso = 500, //en kg

      FUE = new Dado("4d6+18").tirar(),
      CON = d.tirar(),
      TAM = new Dado("4d6+18").tirar(),
      INT = 4,
      POD = d.tirar(),
      DES = new Dado("2d6+6").tirar(),
      ASP = d.tirar()
    }

  ) {
    super({})
    this.car = {}
    this.nombre = nombre
    this.peso = peso
    this.FUE = FUE
    this.CON = CON
    this.TAM = TAM
    this.INT = INT
    this.POD = POD
    this.DES = DES
    this.ASP = ASP




    this.bonificacion = new Bon({});

    // this.inventario = creaInventario("Cuerpo");
    this.inventario = {}

    this.habilidades = {}
    this.efectos = [];
    this.carga = [];
    // this.backup = null
    this.act();

    // // Carga ligera (permite correr)		=	(FUE + CON) x 1,0 	Kilogramos
    // this.carga["ligera"] = this.getCar(FUE) + this.getCar(FUE);
    // console.log("carga"+this.getCar(FUE) + this.getCar(FUE));
    // // Carga normal (permite mov 100%)		=	(FUE + CON) x 2,2 	Kilogramos 
    // this.carga["normal"] = (this.getCar(FUE) + this.getCar(FUE)) * 2.2;
    // // Carga elevada (movimiento al 50%)	=	(FUE + CON) x 3,4	Kilogramos
    // this.carga["elevada"] = (this.getCar(FUE) + this.getCar(FUE)) * 3.4;
    // // Carga máxima (movimiento al 10%)	=	(FUE + CON) x 4,6 	Kilogramos
    // this.carga["máxima"] = (this.getCar(FUE) + this.getCar(FUE)) * 4.6;
  }

  act() {
    super.act();
    this.carga = [];
    this.carga["ligera"] = this.getCar(FUE) + this.getCar(FUE);
    // Carga normal (permite mov 100%)		=	(FUE + CON) x 2,2 	Kilogramos 
    this.carga["normal"] = (this.getCar(FUE) + this.getCar(FUE)) * 2.2;
    // Carga elevada (movimiento al 50%)	=	(FUE + CON) x 3,4	Kilogramos
    this.carga["elevada"] = (this.getCar(FUE) + this.getCar(FUE)) * 3.4;
    // Carga máxima (movimiento al 10%)	=	(FUE + CON) x 4,6 	Kilogramos
    this.carga["máxima"] = (this.getCar(FUE) + this.getCar(FUE)) * 4.6;
  }

  cargas() {
    for (let c in this.carga) {
      console.log(c + ":" + this.carga[c]);
    }

  }
}


class Dragon extends Animal {
  constructor(
    {
      nombre = "Dragón",
      peso = 500, //en kg

      FUE = new Dado("20d6").tirar(),
      CON = new Dado("10d6").tirar(),
      TAM = new Dado("20d6").tirar(),
      INT = new Dado("2d6+10").tirar(),
      POD = new Dado("4d6+6").tirar(),
      DES = d.tirar(),
      ASP = d.tirar()
    }

  ) {
    super({})
    this.car = {}
    this.nombre = nombre
    this.peso = peso
    this.FUE = FUE
    this.CON = CON
    this.TAM = TAM
    this.INT = INT
    this.POD = POD
    this.DES = DES
    this.ASP = ASP




    this.bonificacion = new Bon({});

    // this.inventario = creaInventario("Cuerpo");
    this.inventario = {}

    this.habilidades = {}
    this.efectos = [];
    this.carga = [];
    this.crearCuerpo();
    // this.backup = null
    this.act();

  }

  act() {
    super.act();
    this.carga = [];
    this.carga["ligera"] = this.getCar(FUE) + this.getCar(FUE);
    // Carga normal (permite mov 100%)		=	(FUE + CON) x 2,2 	Kilogramos 
    this.carga["normal"] = (this.getCar(FUE) + this.getCar(FUE)) * 2.2;
    // Carga elevada (movimiento al 50%)	=	(FUE + CON) x 3,4	Kilogramos
    this.carga["elevada"] = (this.getCar(FUE) + this.getCar(FUE)) * 3.4;
    // Carga máxima (movimiento al 10%)	=	(FUE + CON) x 4,6 	Kilogramos
    this.carga["máxima"] = (this.getCar(FUE) + this.getCar(FUE)) * 4.6;
  }

  cargas() {
    for (let c in this.carga) {
      console.log(c + ":" + this.carga[c]);
    }

  }

  crearCuerpo() {
    this.imagen = 'img/Dragon.jpg';
    this.cuerpo = new Localizaciones(this.getMaxPuntos(PG));

    //Puntos de armadura
    let pa = 12;

    // var cabeza = new Localizacion("Cola", 0.25, 1, 2, pa, 320, 795); this.cuerpo.add(cabeza);
    // cabeza = new Localizacion("Pata Trasera Derecha", 0.333, 3, 4, pa, 230, 527); this.cuerpo.add(cabeza);
    // cabeza = new Localizacion("Pata Trasera Izquierda", 0.333, 5, 6, pa, 269, 660); this.cuerpo.add(cabeza);
    // cabeza = new Localizacion("Cuartos Traseros", 0.4, 7, 8, pa); this.cuerpo.add(cabeza);
    // cabeza = new Localizacion("Cuartos Delanteros", 0.4, 9, 10, pa); this.cuerpo.add(cabeza);
    // cabeza = new Localizacion("Ala Derecha", 0.25, 11, 12, pa); this.cuerpo.add(cabeza);
    // cabeza = new Localizacion("Ala Izquierda", 0.25, 13, 14, pa); this.cuerpo.add(cabeza);
    // cabeza = new Localizacion("Pata Delantera Derecha", 0.333, 15, 16, pa); this.cuerpo.add(cabeza);
    // cabeza = new Localizacion("Pata Delantera Izquierda", 0.333, 17, 18, pa); this.cuerpo.add(cabeza);
    // cabeza = new Localizacion("Cabeza", 0.333, 19, 20, pa, 350, 320); this.cuerpo.add(cabeza);


    var cabeza = new Localizacion("Cabeza", 0.333, 1, 10, pa, 350, 320); this.cuerpo.add(cabeza);
    cabeza = new Localizacion("Pata Delantera Derecha", 0.333, 11, 20, pa); this.cuerpo.add(cabeza);
    cabeza = new Localizacion("Pata Delantera Izquierda", 0.333, 21, 30, pa); this.cuerpo.add(cabeza);
    cabeza = new Localizacion("Ala Derecha", 0.25, 31, 40, pa); this.cuerpo.add(cabeza);
    cabeza = new Localizacion("Ala Izquierda", 0.25, 41, 50, pa); this.cuerpo.add(cabeza);
    cabeza = new Localizacion("Cuartos Delanteros", 0.4, 51, 60, pa); this.cuerpo.add(cabeza);
    cabeza = new Localizacion("Cuartos Traseros", 0.4, 61, 70, pa); this.cuerpo.add(cabeza);
    cabeza = new Localizacion("Pata Trasera Derecha", 0.333, 71, 80, pa, 230, 527); this.cuerpo.add(cabeza);
    cabeza = new Localizacion("Pata Trasera Izquierda", 0.333, 81, 90, pa, 269, 660); this.cuerpo.add(cabeza);
    cabeza = new Localizacion("Cola", 0.25, 91, 100, pa, 320, 795); this.cuerpo.add(cabeza);

  }


  cuerpoDaño(canvas, scale = 1) {

    canvas = document.getElementById(canvas);
    var ctx = canvas.getContext("2d");

    // var img = document.getElementById("cuerpo");
    var img = new Image();
    img.src = this.imagen;

    let alto = img.height;
    let ancho = img.width;
    console.log(alto, ancho);
    ctx.canvas.width = ancho; ctx.canvas.height = alto;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.drawImage(img, 0, 0, ancho * scale, alto * scale);

    let todos = [];
    console.log("cuerpoDano de " + this.nombre);

    this.cuerpo.todosDaños(todos);
    console.log(todos);
    todos.forEach(l => {
      // console.log(l.nombre,l.daño);
      // string += `${l.nombre} :<b>${l.daño}</b>/${l.pg}<br>`
      // string+=l.nombre+":"+l.daño+"<br>";
      if (l.x && l.y) {
        console.log("dibujo ", l.nombre, l.x, l.y, l.daño * 5, l.pg);
        ctx.globalAlpha = 0.5
        ctx.beginPath();
        ctx.arc(l.x * scale, l.y * scale, l.daño * 5 * scale, 0, Math.PI, true);
        // ctx.arc(l.x, l.y, 45, 0, (l.daño/l.pg)*2* Math.PI, false);
        ctx.fillStyle = l.daño >= l.pg ? 'red' : 'orange';
        ctx.fill();

        // Texto
        ctx.globalAlpha = 1
        ctx.font = (l.daño * 2 + 20) * scale + 'px Sans-serif';
        ctx.strokeStyle = 'black';
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom";
        // ctx.textAlign = "end" 
        ctx.lineWidth = 5;
        ctx.strokeText(l.daño + "/" + l.pg, l.x * scale, l.y * scale);
        ctx.fillStyle = 'white';
        ctx.fillText(l.daño + "/" + l.pg, l.x * scale, l.y * scale);

        //quesito
        // let cx=l.x;
        // let cy=l.y;
        // ctx.beginPath();
        // ctx.moveTo(cx, cy);
        // ctx.arc(cx, cy, 30, 0, (l.daño/l.pg)*2* Math.PI, false);
        // ctx.closePath();
        // ctx.fillStyle = l.daño>=l.pg?'red':'orange';
        // ctx.strokeStyle = 'black';
        // ctx.fill();
        // ctx.stroke();

        ctx.globalAlpha = 0.77
        ctx.beginPath();
        ctx.arc(l.x * scale, l.y * scale, l.pa * 5 * scale, 0, Math.PI, false);
        ctx.fillStyle = "grey";
        ctx.fill();

        ctx.globalAlpha = 1
        ctx.font = (l.pa * 2 + 20) * scale + 'px Sans-serif';
        ctx.strokeStyle = 'black';
        ctx.textAlign = "center"
        ctx.textBaseline = "top";
        // ctx.textAlign = "end" 
        ctx.lineWidth = 5;
        ctx.strokeText(l.pa, l.x * scale, l.y * scale);
        ctx.fillStyle = 'white';
        ctx.fillText(l.pa, l.x * scale, l.y * scale);
        ctx.globalAlpha = 1;
      }

    });
  }
}

class Lobo extends Animal {
}

class Storvarg extends Lobo {

}
class Tigre extends Animal {

}
class Tigerfløyen extends Tigre {

}

class Leshtor extends Tigre {

}



/**
 * Modifica una fecha.
 * 
 * @param interval  One of: año, mes, dia, segundo,...
 * @param units  Numero de unidades a añadir o restar, si negativas.
 */
Date.prototype.mod = function (interval, units) {
  var ret = new Date(this.valueOf()); //don't change original date

  switch (interval.toLowerCase()) {
    case 'año': ret.setFullYear(ret.getFullYear() + units); break;
    case 'mes': ret.setMonth(ret.getMonth() + units); break;
    case 'semana': ret.setDate(ret.getDate() + 7 * units); break;
    case 'dia': ret.setDate(ret.getDate() + units); break;
    case 'hora': ret.setTime(ret.getTime() + units * 3600000); break;
    case 'minuto': ret.setTime(ret.getTime() + units * 60000); break;
    case 'segundo': ret.setTime(ret.getTime() + units * 1000); break;
    default: ret = undefined; break;//en default undefined o pasar la original?
  }
  return ret;
}

var _3d6 = new Dado('3d6');
class Humanoide extends Animal {
  constructor(
    {
      // nombre = "Humanoide",
      peso = 60, //en kg
      FUE = _3d6.tirar(),
      CON = _3d6.tirar(),
      TAM = _3d6.tirar(),
      INT = _3d6.tirar(),
      POD = _3d6.tirar(),
      DES = _3d6.tirar(),
      ASP = _3d6.tirar()

      // FUE = 10,
      // CON = 10,
      // TAM = 10,
      // INT = 10,
      // POD = 10,
      // DES = 10,
      // ASP = 10
    }

  ) {
    super({})
    this.car = {}
    // this.nombre=nombre
    this.peso = peso
    this.FUE = FUE
    this.CON = CON
    this.TAM = TAM
    this.INT = INT
    this.POD = POD
    this.DES = DES
    this.ASP = ASP




    this.bonificacion = new Bon({});


    this.inventario = new Contenedor("Cuerpo");
    // this.inventario = creaInventario("Cuerpo");
    // this.inventario = new Contenedor("Cuerpo");

    this.habilidades = {}
    this.efectos = [];
    this.carga = [];
    this.crearCuerpo();


    // this.backup = null
    this.act();

    // // Carga ligera (permite correr)		=	(FUE + CON) x 1,0 	Kilogramos
    // this.carga["ligera"] = this.getCar(FUE) + this.getCar(FUE);
    // console.log("carga"+this.getCar(FUE) + this.getCar(FUE));
    // // Carga normal (permite mov 100%)		=	(FUE + CON) x 2,2 	Kilogramos 
    // this.carga["normal"] = (this.getCar(FUE) + this.getCar(FUE)) * 2.2;
    // // Carga elevada (movimiento al 50%)	=	(FUE + CON) x 3,4	Kilogramos
    // this.carga["elevada"] = (this.getCar(FUE) + this.getCar(FUE)) * 3.4;
    // // Carga máxima (movimiento al 10%)	=	(FUE + CON) x 4,6 	Kilogramos
    // this.carga["máxima"] = (this.getCar(FUE) + this.getCar(FUE)) * 4.6;
  }

  crearCuerpo() {
    this.imagen = 'Body.png';
    // this.imagen='img/Dragon.jpg';
    this.cuerpo = new Localizaciones(this.getMaxPuntos(PG), this.pa);
    // console.log(this.nombre + ' cuerpo-> PG:' + this.getMaxPuntos(PG));
    //Menteniendo junta toda la localización
    //constructor(nombre, mpg, min, max, pa = 0,x=null,y=null) {
    var cabeza = new Localizacion("Cabeza", 0.333, 1, 9, 0)
    var brazoD = new Localizacion("Brazo D", 0.25, 10, 26, 0)
    var brazoI = (new Localizacion("Brazo I", 0.25, 27, 43, 0))
    //TODO:Habría que hacer subLocalización?
    var pecho = (new Localizacion("Pecho", 0.4, 44, 58, 0, 243, 277))

    var abdomen = (new Localizacion("Abdomen", 0.333, 59, 72, 0))
    var piernaD = (new Localizacion("Pierna D", 0.333, 73, 86, 0))
    var piernaI = (new Localizacion("Pierna I", 0.333, 87, 100, 0))

    // <area shape="circle" coords="243,130,30" alt="cuello" onclick="console.log('Hostia en cuello')">
    // <area shape="circle" coords="242,60,40" alt="cara" title="cara" onclick="console.log('Hostia en cara')">
    // <area shape="circle" coords="243,19,20" alt="craneo" title="craneo" onclick="console.log('Hostia en craneo');">

    cabeza.add(new Localizacion("Cráneo", 1, 1, 4, 0, 243, 69))
    cabeza.add(new Localizacion("Cara", 1, 5, 7, 0, 242, 110))
    cabeza.add(new Localizacion("Cuello", 1, 8, 9, 0, 243, 180))

    brazoD.add(new Localizacion("Hombro D", 1, 10, 13, 0, 155, 227))
    brazoD.add(new Localizacion("Biceps D", 1, 14, 18, 0, 144, 308))
    brazoD.add(new Localizacion("Antebrazo D", 1, 19, 23, 0, 126, 405))
    brazoD.add(new Localizacion("Codo D", 1, 24, 24, 0, 137, 357))
    brazoD.add(new Localizacion("Mano D", 1, 25, 26, 0, 97, 496))

    brazoI.add(new Localizacion("Hombro I", 1, 27, 30, 0, 335, 227))
    brazoI.add(new Localizacion("Biceps I", 1, 31, 35, 0, 343, 311))
    brazoI.add(new Localizacion("Antebrazo I", 1, 36, 40, 0, 362, 405))
    brazoI.add(new Localizacion("Codo I", 1, 41, 41, 0, 354, 357))
    brazoI.add(new Localizacion("Mano I", 1, 42, 43, 0, 389, 496))

    abdomen.add(new Localizacion("Vientre", 1, 59, 65, 0, 243, 398))
    abdomen.add(new Localizacion("Cadera D", 1, 66, 68, 0, 183, 440))
    abdomen.add(new Localizacion("Ingle", 1, 69, 69, 0, 243, 498))
    abdomen.add(new Localizacion("Cadera I", 1, 70, 72, 0, 306, 440))

    piernaD.add(new Localizacion("Muslo Sup D", 1, 73, 77, 0, 195, 553))
    piernaD.add(new Localizacion("Muslo Inf D", 1, 78, 80, 0, 203, 607))
    piernaD.add(new Localizacion("Rodilla D", 1, 81, 81, 0, 207, 680))
    piernaD.add(new Localizacion("Pierna Inf D", 1, 82, 85, 0, 207, 787))
    piernaD.add(new Localizacion("Pie D", 1, 86, 86, 0, 205, 900))

    piernaI.add(new Localizacion("Muslo Sup I", 1, 87, 91, 0, 287, 553))
    piernaI.add(new Localizacion("Muslo Inf I", 1, 92, 94, 0, 282, 607))
    piernaI.add(new Localizacion("Rodilla I", 1, 95, 95, 0, 282, 680))
    piernaI.add(new Localizacion("Pierna Inf I", 1, 96, 99, 0, 277, 787))
    piernaI.add(new Localizacion("Pie I", 1, 100, 100, 0, 283, 900))

    //Valores de antes de hacer la imagen más alta
    // cabeza.add(new Localizacion("Cráneo", 1, 1, 4, 0, 243, 19))
    // cabeza.add(new Localizacion("Cara", 1, 5, 7, 0, 242, 60))
    // cabeza.add(new Localizacion("Cuello", 1, 8, 9, 0, 243, 130))

    // brazoD.add(new Localizacion("Hombro D", 1, 10, 13, 0, 155, 177))
    // brazoD.add(new Localizacion("Biceps D", 1, 14, 18, 0, 144, 258))
    // brazoD.add(new Localizacion("Antebrazo D", 1, 19, 23, 0, 126, 355))
    // brazoD.add(new Localizacion("Codo D", 1, 24, 24, 0, 137, 307))
    // brazoD.add(new Localizacion("Mano D", 1, 25, 26, 0, 97, 446))

    // brazoI.add(new Localizacion("Hombro I", 1, 27, 30, 0, 335, 177))
    // brazoI.add(new Localizacion("Biceps I", 1, 31, 35, 0, 343, 261))
    // brazoI.add(new Localizacion("Antebrazo I", 1, 36, 40, 0, 362, 355))
    // brazoI.add(new Localizacion("Codo I", 1, 41, 41, 0, 354, 307))
    // brazoI.add(new Localizacion("Mano I", 1, 42, 43, 0, 389, 446))

    // abdomen.add(new Localizacion("Vientre", 1, 59, 65, 0, 243, 348))
    // abdomen.add(new Localizacion("Cadera D", 1, 66, 68, 0, 183, 390))
    // abdomen.add(new Localizacion("Ingle", 1, 69, 69, 0, 243, 448))
    // abdomen.add(new Localizacion("Cadera I", 1, 70, 72, 0, 306, 390))

    // piernaD.add(new Localizacion("Muslo Sup D", 1, 73, 77, 0, 195, 503))
    // piernaD.add(new Localizacion("Muslo Inf D", 1, 78, 80, 0, 203, 557))
    // piernaD.add(new Localizacion("Rodilla D", 1, 81, 81, 0, 207, 630))
    // piernaD.add(new Localizacion("Pierna Inf D", 1, 82, 85, 0, 207, 737))
    // piernaD.add(new Localizacion("Pie D", 1, 86, 86, 0, 205, 850))

    // piernaI.add(new Localizacion("Muslo Sup I", 1, 87, 91, 0, 287, 503))
    // piernaI.add(new Localizacion("Muslo Inf I", 1, 92, 94, 0, 282, 557))
    // piernaI.add(new Localizacion("Rodilla I", 1, 95, 95, 0, 282, 630))
    // piernaI.add(new Localizacion("Pierna Inf I", 1, 96, 99, 0, 277, 737))
    // piernaI.add(new Localizacion("Pie I", 1, 100, 100, 0, 283, 850))

    this.cuerpo.add(cabeza);
    this.cuerpo.add(brazoD);
    this.cuerpo.add(brazoI);
    this.cuerpo.add(pecho);
    this.cuerpo.add(abdomen);
    this.cuerpo.add(piernaD);
    this.cuerpo.add(piernaI);


  }

  cuerpoDaño(canvas, scale = 1) {

    console.warn("cuerpoDaño de Humanoide");


    canvas = document.getElementById(canvas);
    var ctx = canvas.getContext("2d");


    // var img = document.getElementById("cuerpo");
    var img = new Image();
    img.src = this.imagen;

    let alto = img.height;
    let ancho = img.width;
    console.log(alto, ancho);
    ctx.canvas.width = ancho; ctx.canvas.height = alto;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.drawImage(img, 0, 0, ancho * scale, alto * scale);
    let todos = [];
    console.log("cuerpoDano de " + this.nombre);

    this.cuerpo.todosDaños(todos);
    console.log(todos);
    todos.forEach(l => {
      // console.log(l.nombre,l.daño);
      // string += `${l.nombre} :<b>${l.daño}</b>/${l.pg}<br>`
      // string+=l.nombre+":"+l.daño+"<br>";
      if (l.x && l.y) {
        console.log("dibujo ", l.nombre, l.x, l.y, l.daño * 5, l.pg);
        ctx.globalAlpha = 0.5
        ctx.beginPath();
        ctx.arc(l.x * scale, l.y * scale, l.daño * 5 * scale, 0, Math.PI, true);
        // ctx.arc(l.x, l.y, 45, 0, (l.daño/l.pg)*2* Math.PI, false);
        ctx.fillStyle = l.daño >= l.pg ? 'red' : 'orange';
        ctx.fill();

        // Texto
        ctx.globalAlpha = 1
        ctx.font = (l.daño * 2 + 20) * scale + 'px Sans-serif';
        ctx.strokeStyle = 'black';
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom";
        // ctx.textAlign = "end" 
        ctx.lineWidth = 5;
        ctx.strokeText(l.daño + "/" + l.pg, l.x * scale, l.y * scale);
        ctx.fillStyle = 'white';
        ctx.fillText(l.daño + "/" + l.pg, l.x * scale, l.y * scale);

        //quesito
        // let cx=l.x;
        // let cy=l.y;
        // ctx.beginPath();
        // ctx.moveTo(cx, cy);
        // ctx.arc(cx, cy, 30, 0, (l.daño/l.pg)*2* Math.PI, false);
        // ctx.closePath();
        // ctx.fillStyle = l.daño>=l.pg?'red':'orange';
        // ctx.strokeStyle = 'black';
        // ctx.fill();
        // ctx.stroke();


        //PA
        // let pa=pj.cuerpo.darLocalizacion(l.nombre).pa;
        //CUIDADO VAYA O NO FUNCIONE BIEN
        let pa = l.pa;
        if (this.cuerpo?.armadura) { //PETA AL NO HABER ARMADURA?
          pa += this.cuerpo.armadura.daPA(l.nombre);

        }
        ctx.globalAlpha = 0.77
        ctx.beginPath();
        ctx.arc(l.x * scale, l.y * scale, pa * 5 * scale, 0, Math.PI, false);
        ctx.fillStyle = "grey";
        ctx.fill();

        ctx.globalAlpha = 1
        ctx.font = (pa * 2 + 20) * scale + 'px Sans-serif';
        ctx.strokeStyle = 'black';
        ctx.textAlign = "center"
        ctx.textBaseline = "top";
        // ctx.textAlign = "end" 
        ctx.lineWidth = 5;
        ctx.strokeText(pa, l.x * scale, l.y * scale);
        ctx.fillStyle = 'white';
        ctx.fillText(pa, l.x * scale, l.y * scale);
        ctx.globalAlpha = 1;
      }

    });
  }

  cuerpoDañoSolo(canvas, scale = 1) {

    console.warn("cuerpoDañoSolo de Humanoide");

    canvas = document.getElementById(canvas);
    var ctx = canvas.getContext("2d");
    // var img = document.getElementById("cuerpo");
    var img = new Image();
    img.src = this.imagen;

    let alto = img.height;
    let ancho = img.width;
    console.log(alto, ancho);
    ctx.canvas.width = ancho; ctx.canvas.height = alto;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.drawImage(img, 0, 0, ancho * scale, alto * scale);
    let todos = [];
    console.log("cuerpoDano de " + this.nombre);

    this.cuerpo.todosDaños(todos);
    console.log(todos);
    todos.forEach(l => {

      if (l.x && l.y) {
        console.log("dibujo ", l.nombre, l.x, l.y, l.daño * 5, l.pg);

        // Texto
        ctx.globalAlpha = 1
        ctx.font = (50 + 20) * scale + 'px Sans-serif';
        ctx.strokeStyle = 'black';
        ctx.textAlign = "center"
        ctx.textBaseline = "center";
        ctx.lineWidth = 5;
        ctx.strokeText(l.daño, l.x * scale, l.y * scale);
        ctx.fillStyle = 'white';
        ctx.fillStyle = l.daño >= l.pg ? 'red' : 'orange';
        ctx.fillText(l.daño, l.x * scale, l.y * scale);

      }

    });
  }


}

class Humano extends Humanoide {
  constructor() {
    super({});

  }
}

class Elfo extends Humanoide {
  constructor() {
    super({
      FUE: new Dado('2d6+7').tirar(),
      DES: new Dado('3d6+6').tirar(),
      ASP: new Dado('3d6+6').tirar()
    });
    this.nombre = 'Legolas';
    this.peso = 60;
    this.haBasicas();
    this.crearCuerpo();
  }

  haBasicas() {
    //generado con AI
    // Habilidades básicas
    this.setHabilidad(new Habilidad("Esquivar", Agilidad, 50));
    this.setHabilidad(new Habilidad("Montar", Agilidad, 40));

    this.setHabilidad(new Habilidad("Remar", Agilidad, 30));
    this.setHabilidad(new Habilidad("Nadar", Agilidad, 25));
    this.setHabilidad(new Habilidad("Trepar", Agilidad, 40));
    this.setHabilidad(new Habilidad("Correr", Agilidad, 50));
    this.setHabilidad(new Habilidad("Saltar", Agilidad, 30));
    this.setHabilidad(new Habilidad("Esconderse", Sigilo, 40));
    this.setHabilidad(new Habilidad("Deslizarse en Silencio", Sigilo, 40));
    this.setHabilidad(new Habilidad("Buscar", Percepción, 50));
    this.setHabilidad(new Habilidad("Escuchar", Percepción, 50));
    this.setHabilidad(new Habilidad("Otear", Percepción, 50));
    this.setHabilidad(new Habilidad("Rastrear", Percepción, 40));
    this.setHabilidad(new Habilidad("Oler", Percepción, 30));
    this.setHabilidad(new Habilidad("Orientación", Percepción, 40));
    this.setHabilidad(new Habilidad("Cantar", Comunicación, 40));
    this.setHabilidad(new Habilidad("Actuar", Comunicación, 30));
    this.setHabilidad(new Habilidad("Intimidar", Comunicación, 20));
    this.setHabilidad(new Habilidad("Regatear", Comunicación, 30));
    this.setHabilidad(new Habilidad("Enseñar", Comunicación, 30));
    this.setHabilidad(new Habilidad("Silbar", Comunicación, 20));
    this.setHabilidad(new Habilidad("Seducir", Comunicación, 30));
    this.setHabilidad(new Habilidad("Animal", Conocimiento, 30));
    this.setHabilidad(new Habilidad("Vegetal", Conocimiento, 50));
    this.setHabilidad(new Habilidad("Mineral", Conocimiento, 20));
    this.setHabilidad(new Habilidad("Mundo", Conocimiento, 30));
    this.setHabilidad(new Habilidad("Raza Propia", Conocimiento, 50));
    this.setHabilidad(new Habilidad("Otras Razas", Conocimiento, 30));
    this.setHabilidad(new Habilidad("Leer y escribir", Conocimiento, 40));
    this.setHabilidad(new Habilidad("Navegación", Conocimiento, 30));
    this.setHabilidad(new Habilidad("Primeros Auxilios", Conocimiento, 30));
    this.setHabilidad(new Habilidad("Tasación", Conocimiento, 30));
    this.setHabilidad(new Habilidad("Inventar", Conocimiento, 30));
    this.setHabilidad(new Habilidad("Lanzar", Manipulación, 30));
    this.setHabilidad(new Habilidad("Construir", Manipulación, 30));

    // Habilidades de combate
    this.setHabilidad(new HabilidadMarcial("Arco", Manipulación, 60, true));
    this.setHabilidad(new HabilidadMarcial("Espada", Manipulación, 50, true));
    this.setHabilidad(new HabilidadMarcial("Daga", Manipulación, 40, true));
    this.setHabilidad(new HabilidadMarcial("Puño", Manipulación, 30, true));
    this.setHabilidad(new HabilidadMarcial("Patada", Manipulación, 25, true));

    //Artes de magía, como en habilidades.js
    this.setHabilidad(new Arte("Intensidad", Magia, 20));
    this.setHabilidad(new Arte("Duración", Magia, 20));
    this.setHabilidad(new Arte("Alcance", Magia, 20));

    //Hechizos
    this.setHabilidad(new Hechizo("Luz", Magia, 20));
    this.setHabilidad(new Hechizo("Curación", Magia, 20));
    this.setHabilidad(new Hechizo("Bola de Fuego", Magia, 20));
  }
}




class Enano extends Humanoide {
  constructor() {
    super({ FUE: new Dado('3d6+6').tirar(), CON: new Dado('3d6+6').tirar() });
    this.nombre = 'Durin';
    this.peso = 77;
    this.haBasicas();
    this.crearCuerpo();
  }

  haBasicas() {

    this.setHabilidad(new Habilidad("Esquivar", Agilidad, 20));
    this.setHabilidad(new Habilidad("Montar", Agilidad, 20));
    this.setHabilidad(new Habilidad("Nadar", Agilidad, 5));
    this.setHabilidad(new Habilidad("Remar", Agilidad, 20));
    this.setHabilidad(new Habilidad("Saltar", Agilidad, 20));
    this.setHabilidad(new Habilidad("Trepar", Agilidad, 20));
    this.setHabilidad(new Habilidad("Correr", Agilidad, 20));

    this.setHabilidad(new Habilidad("Cantar", Comunicación, 20));
    this.setHabilidad(new Habilidad("Actuar", Comunicación, 20));
    this.setHabilidad(new Habilidad("Intimidar", Comunicación, 20));
    this.setHabilidad(new Habilidad("Regatear", Comunicación, 20));
    this.setHabilidad(new Habilidad("Enseñar", Comunicación, 20));
    this.setHabilidad(new Habilidad("Silbar", Comunicación, 20));
    this.setHabilidad(new Habilidad("Seducir", Comunicación, 20));

    this.setHabilidad(new Habilidad("Animal", Conocimiento, 20));
    this.setHabilidad(new Habilidad("Vegetal", Conocimiento, 20));
    this.setHabilidad(new Habilidad("Mineral", Conocimiento, 50));
    this.setHabilidad(new Habilidad("Mundo", Conocimiento, 20));
    this.setHabilidad(new Habilidad("Raza Propia", Conocimiento, 50));
    this.setHabilidad(new Habilidad("Otras Razas", Conocimiento, 20));
    this.setHabilidad(new Habilidad("Leer y escribir", Conocimiento, 20));
    this.setHabilidad(new Habilidad("Navegación", Conocimiento, 20));
    this.setHabilidad(new Habilidad("Primeros Auxilios", Conocimiento, 10));
    this.setHabilidad(new Habilidad("Tasación", Conocimiento, 30));
    this.setHabilidad(new Habilidad("Inventar", Conocimiento, 20));

    this.setHabilidad(new Habilidad("Lanzar", Manipulación, 20));
    this.setHabilidad(new Habilidad("Robar", Manipulación, 20));
    this.setHabilidad(new Habilidad("Construir", Manipulación, 20));

    this.setHabilidad(new Habilidad("Buscar", Percepción, 20));
    this.setHabilidad(new Habilidad("Escuchar", Percepción, 20));
    this.setHabilidad(new Habilidad("Otear", Percepción, 20));
    this.setHabilidad(new Habilidad("Rastrear", Percepción, 20));
    this.setHabilidad(new Habilidad("Oler", Percepción, 20));
    this.setHabilidad(new Habilidad("Orientación", Percepción, 20));

    this.setHabilidad(new Habilidad("Deslizarse en Silencio", Sigilo, 20));
    this.setHabilidad(new Habilidad("Esconderse", Sigilo, 20));

    this.setHabilidad(new HabilidadDistancia("Ballesta", Manipulación, 50));
    this.setHabilidad(new HabilidadMarcial("Puño", Manipulación, 50));
    this.setHabilidad(new HabilidadMarcial("Patada", Manipulación, 20));
    this.setHabilidad(new HabilidadMarcial("Mordisco", Manipulación, 20));




  }
}

class Orco extends Humanoide {
  constructor() {
    super({
      ASP: new Dado('1d6+3').tirar(),
      CON: new Dado('2d6+6').tirar(),
      INT: new Dado('1d6+6').tirar(),
      TAM: new Dado('2d6+3').tirar()
    });
    this.nombre = 'Orgak';
    this.peso = 55;
    this.haBasicas();
    this.crearCuerpo();
  }

  haBasicas() {

    this.setHabilidad(new Habilidad("Esquivar", Agilidad, 20));

    this.setHabilidad(new Habilidad("Nadar", Agilidad, 5));
    this.setHabilidad(new Habilidad("Remar", Agilidad, 20));
    this.setHabilidad(new Habilidad("Saltar", Agilidad, 20));
    this.setHabilidad(new Habilidad("Trepar", Agilidad, 20));
    this.setHabilidad(new Habilidad("Correr", Agilidad, 20));
    this.setHabilidad(new Habilidad("Intimidar", Comunicación, 20));


    this.setHabilidad(new Habilidad("Animal", Conocimiento, 20));
    this.setHabilidad(new Habilidad("Vegetal", Conocimiento, 20));
    this.setHabilidad(new Habilidad("Mineral", Conocimiento, 50));
    this.setHabilidad(new Habilidad("Mundo", Conocimiento, 20));
    this.setHabilidad(new Habilidad("Raza Propia", Conocimiento, 50));

    this.setHabilidad(new Habilidad("Robar", Manipulación, 20));
    this.setHabilidad(new Habilidad("Construir", Manipulación, 20));

    this.setHabilidad(new Habilidad("Buscar", Percepción, 20));
    this.setHabilidad(new Habilidad("Escuchar", Percepción, 20));
    this.setHabilidad(new Habilidad("Otear", Percepción, 20));
    this.setHabilidad(new Habilidad("Rastrear", Percepción, 20));
    this.setHabilidad(new Habilidad("Oler", Percepción, 20));
    this.setHabilidad(new Habilidad("Orientación", Percepción, 20));

    this.setHabilidad(new Habilidad("Deslizarse en Silencio", Sigilo, 30));
    this.setHabilidad(new Habilidad("Esconderse", Sigilo, 30));

    this.setHabilidad(new HabilidadMarcial("Puño", Manipulación, 50));
    this.setHabilidad(new HabilidadMarcial("Patada", Manipulación, 20));
    this.setHabilidad(new HabilidadMarcial("Mordisco", Manipulación, 30));




  }
}




/**
 * variable global con el personaje sobre
 * el que se harán todas las acciones en la página
 */
// var pj = new Humanoide({});
var pj = new Enano();
let ballesta = new Arco('Ballesta', 3, 1, new Daño('1d8', 'P'), 35, 200);
let virote = new Municion('Virote de vuelo', 0.08, 0, 10, '-1',
  "*1.2 alcanceRecto, *1.3 alcance")
virote.ctd = 100;
pj.inventario.add(ballesta)
pj.inventario.add(virote)
pj.act();



/**
 * variable global con el personaje sobre
 * el que recaerán las acciones del pj,
 * como un ataque, pasar un objeto, sanar, etc
 */
var pnj;

/**
 * Objeto sobre el que se realizarán las acciones
 * por ejemplo click, edición, etc..
 */
var objetoActual;

/**
 * Contenedor sobre el que se añadirán
 * nuevos objetos
 */
var contenedorActual;

// let a = new Animal({ nombre: "Animal A" });
// // for(i of CP){
// //   a[i]=7;
// // }


// // console.log(a);
// let v = new Humanoide({ FUE: 13, DES: 7, nombre: "Paco" });
// // let v=new Bon({FUE:1, DES: 2, Agilidad:20, PF:3});
// console.log("HUMANOIDE");

// console.log(v);

// v.cuerpo.dañarLocalizacion(4, 4)
// a.bonificacion=v;
// a.set(DES, 30);
// console.log(a);
// console.log(DES+a.getCar(DES));
// console.log("Agi"+a.getCar("Agilidad"));


// database.ref("personajes").child(a.nombre).set(a);

//cargo el personaje desde firebase
// firebase.database().ref("personajes").child(a.nombre).once('value').then(function(snapshot) {
//   var recuperado = snapshot.val() ;
//   console.log(recuperado);

// });


// pj.setAll(recuperado);
// pj.act();
// pj.save();
// console.log("Animal Recuperado");
// console.log("carga:"+pj.inventario.pesoTotal());
// console.log(pj);


// v.setAll(pj);
// v.nombre="BACKUP"
// console.log(v);
// console.log(fechaMundo);

var añoMas = new Date(773, 9, 7, 1, 0, 0, 0);
var finDeAnio = new Date(776, 11, 31, 23, 59, 59, 999);
fechaMundo = añoMas;


function en(s) {
  let x = [];
  for (c in s) {
    x.push(+s.codePointAt(c) + 7)

  }

  console.log(x.toString());
  // console.log(s.charCodeAt(c));

  return x;
}

function de(s) {
  let x = "";
  for (c of s) {
    x += String.fromCodePoint(+c - 7);

  }
  // x+=s.charCodeAt(c));

  console.log(x.toString());
  return x;
}

// efNombre = new Efecto("cambiarNombre", `this.nombre="Activo"`, null, fechaMundo.add("año", 4));
// efFuerza = new Efecto("fuerza", `this.sb(FUE,"+5")`,  fechaMundo.add("dia", 4));
// efDes = new Efecto("des", `this.DES+=5`,  fechaMundo.add("dia", 4));
// efTam = new Efecto("tamaño", `this.sb(TAM,5)`,   fechaMundo.add("dia", 4));
// efAsp = new Efecto("aspecto", `this.ASP=18`,   fechaMundo.add("dia", 4));
// efReflex = new Efecto("Reflejos felinos", `this.DES+=5; this.sb(Agilidad,'+5') `,   fechaMundo.add("dia", 4));
// efPermanente = new Efecto("Permanente", `this.ASP+=5; this.sb(Comunicación,'+5') `);

// // pj.addEfecto(efNombre)

// pj.addEfecto(efFuerza)
// pj.addEfecto(efDes)
// pj.addEfecto(efTam)
// pj.addEfecto(efAsp)
// pj.addEfecto(efReflex)
// pj.addEfecto(efPermanente)

// pj.aplicarEfectos()

// console.log("4 años despues");
// let fechas=fechaMundo.mod("año", 1);
// pj.aplicarEfectos()

// //salvar personaje


// console.log(pj);

// console.log(pj.backup);


// Modificaciones
// let mdf= new Modificaciones('Cansado','/2 PF',false);
// pj.addModificadores(mdf);
// pj.act();



/**
 * 
 * @param {string} nombre del objeto con .clase a cargar
 */
function cargaLocalObjeto(nombre) {
  var obj = JSON.parse(localStorage.getItem(nombre))

  let clase = obj.clase;

  if (clase) {
    var o;
    // eval(`o=new ${clase}({})`) //un poco más rápida pero menos segura
    o = (Function('return new ' + clase))() //se supone que es más segura
    //TODO: hacer pruebas de rendimiento;
    o.setAll(obj)
    console.log(o);
    return o;
  }

}



function cargarPersonajeOnline(nombre) {
  try {
    let ruta = `personajes/${nombre}/`;
    // console.log("CARGAR RUTA:" + ruta);

    fbActual = database.ref(ruta);

    // si lo hago así es menos eficiente,
    // porque siempre que haya un cambio
    // donde sea me, va a cargar el personaje entero
    fbActual.on('value', function (item) {
      console.log("onvalue personaje" + item.val().nombre);

      let nuevo = item.val();
      if (nuevo.clase) {
        // pj =  new Humanoide({});
        pj = Clase.convertir(item.val())
      }
      else
        pj = new Humanoide({});
      // pj = new Animal({});
      pj.setAll(item.val());

      console.log("CARGA EL PUTO PERSONAJE:" + pj.nombre);

      document.title = pj.nombre;

      console.log(pj);

    });

  } catch (error) {
    console.log("ERROR EN CARGA ONLINE");
    alert("ERROR EN CARGA ONLINE")

  }

}

/**
 * Carga un personaje online buscando el nombre más parecido en Firebase.
 * @param {string} nombre El nombre del personaje a buscar.
 */
function cargarPersonajeOnlineParecido(nombre) {
  return new Promise((resolve, reject) => {
    const ref = database.ref('personajes');
    ref.once('value', (snapshot) => {
      const personajes = snapshot.val();
      if (personajes) {
        const nombres = Object.keys(personajes);
        const parecido = nombres.reduce((prev, curr) => {
          const prevSimilitud = jaroWrinker(nombre, prev);
          const currSimilitud = jaroWrinker(nombre, curr);
          return currSimilitud > prevSimilitud ? curr : prev;
        }, nombres[0]);
        cargarPersonajeOnline(parecido);
        resolve(parecido);
      } else {
        reject('No se encontraron personajes.');
      }
    }, (error) => {
      reject(error);
    });
  });
}

/**
 * Carga un personaje local buscando el nombre más parecido en localStorage.
 * @param {string} nombre El nombre del personaje a buscar.
 */
function cargarPersonajeLocalParecido(nombre) {
  return new Promise((resolve, reject) => {
    const nombres = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (item && item.clase && (item.clase === 'Humanoide' || item.clase === 'Animal')) {
          nombres.push(key);
        }
      } catch (e) {
        console.warn(`No se pudo parsear el objeto con clave ${key}`);
      }
    }

    if (nombres.length > 0) {
      const parecido = nombres.reduce((prev, curr) => {
        const prevSimilitud = jaroWrinker(nombre, prev);
        const currSimilitud = jaroWrinker(nombre, curr);
        return currSimilitud > prevSimilitud ? curr : prev;
      }, nombres[0]);
      cargarPersonaje(parecido);
      resolve(parecido);
    } else {
      reject('No se encontraron personajes guardados localmente.');
    }
  });
}

function historial(valor, campo = 'habilidades') {
  console.log("guardando en historial: personajes" + pj.nombre + ("habilidades"));
  database.ref("historial").child(campo).child(pj.nombre).child(valor.nombre).set(valor);


}

function guerrero(personaje, nivel, ...armas) {

  personaje.setHabilidad(new HabilidadMarcial("Esquivar", Agilidad, 25 + (nivel * 5), false));
  personaje.setHabilidad(new HabilidadMarcial("Puñetazo D", Manipulación, 25 + (nivel * 5), true, "Brazo D"));
  armas.forEach((a, index) => {
    var d1 = new Daño('1d6', 'F')
    var d2 = new Daño('1d8', 'P')
    let arma = new Arma(a, 1.5 - index * 0.3, 10, d1, d2);
    personaje.inventario.add(arma);
    personaje.setHabilidad(new HabilidadMarcial(a, Manipulación, 25 + (nivel * 10), true, "Brazo D", arma));

    personaje.setHabilidad(new Tecnica('Matalobos', Manipulación, 30, 3, true))

    personaje.act();
  });



  // personaje.inventario.add(new Municion('Flecha voladora', 0, 0, 1, 1, +2, 1, 0, 0, 1));
  // personaje.inventario.add(new Municion('Svartor', 0, 0, +3, 20, 50, 7, 7, 7, 7));
  // ;
  // // personaje.inventario.add(new Arco('Arco Largo',2,100,'1d8P',40,13));
  // personaje.inventario.add(new Arco('Arco Largo', 2, 100, new Daño('1d8', 'P'), 40, 180));

  // console.log(personaje.inventario.darClase(Arma));
  // // personaje.save();
  // console.log(personaje.habilidades);
  // for( h in personaje.habilidades){
  //   if
  // }

  // console.log(Object.values(personaje.habilidades).filter(h => (!h.ataque)));
  // console.log(personaje.getHabilidades(h => (!h.ataque)));
  // console.log(personaje.getHabilidades());

}


function mago(personaje, nivel = 5) {

  personaje.setHabilidad(new HabilidadMarcial("Esquivar", Agilidad, 25 + (nivel * 5), false));
  personaje.setHabilidad(new HabilidadMarcial("Puñetazo D", Manipulación, 25 + (nivel * 5), true, "Brazo D"));

  personaje.setHabilidad(new Arte(new Habilidad('Intensidad', 'Magia', 25 + (nivel * 5))))
  personaje.setHabilidad(new Arte(new Habilidad('Duración', 'Magia', 25 + (nivel * 5))))
  personaje.setHabilidad(new Arte(new Habilidad('Alcance', 'Magia', 25 + (nivel * 5))))
  personaje.setHabilidad(new Hechizo('Bola de fuego', 5, 25 + (nivel * 5)));
  personaje.setHabilidad(new Hechizo('Curación', 1, Math.round(Math.random() * 100) + (nivel * 5)));
  personaje.setHabilidad(new Hechizo('Escudo', 1, Math.round(Math.random() * 100) + (nivel * 5)));

  personaje.inventario.add(new Gema('Gema 1', 0.001, 10000, 10, 10));
  personaje.inventario.add(new Gema('Gema 2', 0.001, 10000, 10, 5));
  personaje.inventario.add(new Gema('Gema 3', 0.001, 10000, 10, 1));

}


// guerrero(pj, 10, 'espada', 'arco', 'daga');
// mago(pj);


// let armanat = new ArmaNatural("puño", "1d3C", "Brazo D");
// console.log(armanat);
