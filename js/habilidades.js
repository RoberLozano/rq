/* Roberto Lozano Sáez 2019 */
// class XP {
//     constructor(
//          xp               =0
//         ,fecha            =0
//         ,probabilidad     =0
//         ,fechaXp          =0
//         ,horasEntrenadas  =0
//         ,desentrenado     =0
//         ,supercriticos    =0
//         ,criticos         =0
//         ,especiales       =0
//         ,exitos           =0
//         ,fallos           =0
//         ,pifias           =0
//         )
//     {
//         this.xp                = xp               
//         this.fecha             = fecha 
//         this.probabilidad      = probabilidad 
//         this.fechaXp           = fechaXp 
//         this.horasEntrenadas   = horasEntrenadas 
//         this.desentrenado      = desentrenado 
//         this.supercriticos     = supercriticos 
//         this.criticos          = criticos 
//         this.especiales        = especiales 
//         this.exitos            = exitos 
//         this.fallos            = fallos 
//         this.pifias            = pifias 
//     } 
// }


class Clase {
  constructor() {
    this.clase = this.constructor.name;
  }

  setAll(o) {

    // if (typeof o === 'string') return o;
    for (let key in o) {
      if (key === 'mods') {
        // console.log('SetAll');
        //console.log(o[key]);
      }
      //genérico para sustituir todos los setAll
      // if (o[key] instanceof Object){
      if (typeof o[key] === 'object' && o[key] !== null) {

       if(Array.isArray(o[key])) this[key] = o[key];
        if (o[key].clase)
          this[key] = Clase.convertir(o[key])
        else
          for (let k in o[key]) {
            // console.log('setAll de '+k+'->'+ o[key][k] +' es '+ typeof o[key][k]);
            // console.log( o[key][k]);
            if (o[key][k].clase)
              this[key][k] = Clase.convertir(o[key][k])
            // probar
            // console.log('estoy en el set inner de '+k+'->'+ o[key][k]);
            //  this.setAll( o[key][k]) //??
          }
      }
      else {
        // console.log('NO es objeto');
        // console.log(this[key]);
        this[key] = o[key];
      }

    }
  }
  // get clase() {
  //   return this.constructor.name;
  // }

  /**Devuelve una copia del objeto de su misma clase
 * 
 * @param {Object} o El objeto a copiar
 * @returns la copia del objeto de la clase this.clase
 */
  static convertir(o) {
    if (!(o?.clase)) return o;
    // console.log('Convierto un '+o.clase);
    let copia;
    // eval(`copia = new ${o.constructor.name}()`); //elegir uno

    eval(`copia = new ${o.clase}()`); //elegir uno
    // copia = (Function('return new ' + o.clase))()
    // for (let key in o)
    //   copia[key] = o[key];
    copia.setAll(o);
    return copia;
  }
}




/**
 * @typedef Modificable
 * @type {object}
 * @property {Mod} mods - Los mods
 * @property {Modificaciones} listaMods -La lista de Modificaciones por id.
 */
class Modificable extends Clase {
  constructor() {
    super();
    //Mods sobre cada atributo de la clase
    /**
     * @property {Mod} mods - Mods sobre cada atributo de la clase
     */
    this.mods = {}
    //Lista de Modificaciones
    
    /**
     * @property {Modificaciones} listaMods -La lista de Modificaciones por id.
     */
    this.listaMods = {}
  }

  /**
 * 
 * @param {Modificaciones|String} m El modificador o el nombre (id)
 */
  delModificadores(m) {

    if(typeof m=='string'){
      m= this.listaMods[m];
    }
    let id;
    if (m instanceof Modificaciones)
      id = m.id
    else
      id = m;

    if (!(this.listaMods[id])) {
      console.log("no hay efecto con esa id");
      return;
    }

    let efectos = this.listaMods[id].efectos;
    var ae = efectos.split(',')
    ae.forEach(e => {
      var mod = m.buscarMod(e, id);
      console.log(mod);
      delete (this.mods[mod.magnitud][id])

      // this.getModTotal(mod.magnitud);

    });

    delete (this.listaMods[id]);


  }
  /**
   * 
   * @param {Modificaciones} m La modificaciones a añadir
   */
  addModificadores(m) {
    //sobreescribe el mismo id
    // console.log(m);
    this.listaMods[m.id] = m;
    let efectos = m.efectos;
    var ae = efectos.split(',')
    ae.forEach(e => {
      if(!m.buscarMod) return;
      var mod = m.buscarMod(e, m.id);
      // console.log(mod);
      if (!this.mods[mod.magnitud])
        this.mods[mod.magnitud] = {}

      this.mods[mod.magnitud][m.id] = mod;

    });

  }

  numero(index){
    let n=0;
    for(let m in this.listaMods){
      if(index==n) return this.listaMods[m].efectos; n++
    }
    return n;
  }

  setAll(o) {
    super.setAll(o);
    // this.mods = ;
    //console.log(o.mods);
    //ÑAPA, Como son objetos anidados no hace bien el SetAll (imagino)
    //Sobreescribo, pero como va con id da igual
    for (let key in o.listaMods) {
      this.addModificadores(o.listaMods[key]);
    }
  }

  /**
   * @param {String} magnitud La magnitud o campo del que obtener el valor
   * @param {Boolean} redondear si redondea a entero o no
   * @returns 
   */
  total(magnitud = 'v', redondear = false) {
    let total = this[magnitud];
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
    // console.log(total);

    if (multis) {
      // console.log("multis");
      // console.log(multis);
      for (let s of multis) {
        total = s.valor(total);
      }
    }

    // console.log(magnitud, total);
    // Redondear??
    if (redondear) return Math.round(total);
    return total;

  }

}

//debe haber una variable global pj con el personaje
/**
 * 
 */


var constante = {}

//Variables globales
const PIFIA = -1;
const FALLO = 0;
const EXITO = 1;
const ESPECIAL = 2;
const CRITICO = 3;
const SUPERCRITICO = 4;


//VARIABLE GLOBAL DONDE METER TODO
constante.nombreArtes = [
  "Intensidad",
  "Multiconjuro",
  "Sobrepotencia",
  "Refuerzo",
  "Alcance",
  "Duración",
  "Puntería",
  "Velocidad"
]


class XP extends Clase {
  /**
   * 
   * @param {int} xp 
   * @param {Date} fecha fecha de última subida
   * @param {Date} fechaXp fecha de última subida de experiencia
   * @param {int} horasEntrenadas 
   * @param {*} desentrenado 
   */
  constructor(
    xp = 0
    , fecha = 0
    , fechaXp = 0
    , horasEntrenadas = 0
    , desentrenado = 0
  ) {
    super()
    this.xp = xp
    this.fecha = fecha
    this.fechaXp = fechaXp
    this.horasEntrenadas = horasEntrenadas
    this.desentrenado = desentrenado
  }

  /**
* <!-- begin-user-doc -->
* hacer que calcule la probabilidad correcta de subir de nivel
* <!-- end-user-doc -->
*/
  getProbabilidad(valor, fechaAct, bonus = 0, xpNec = 4) {
    //TODO: hacer que calcule la probabilidad correcta; tal vez pasar a habilidad
    // var bonus=this.tipoBonus;
    //TODO: por si pongo XP distinta para cada raza
    //		int xpNec= this.getPertenece().getAnimal().getXPNecesaria();

    // % extra de subida por cada punto de XP mayor del necesario
    var pExtra = 2.5;
    // const xpNec = 4;
    if (this.xp < xpNec) return 100;

    // if (this.fecha == 0) return valor - (this.xp - xpNec) * 5 - bonus;

    if (this.fecha == 0)
      return Math.round(Math.min(100, valor) - (this.xp - xpNec) * pExtra - bonus);
    else {
      var fechaSub
      fechaSub = new Date(this.fecha)
      // fechaSub =  (this.fecha instanceof Date)? this.fecha : new Date(this.fecha)

      //los minisegundos son negativos pq es anterior a 1970
      //diferencia en dias
      let diferencia = (-fechaSub.getTime() + fechaAct.getTime()) / 86400000;

      if (diferencia >= 7) {
        // console.log('días',diferencia);
        // console.log(("Se subio hace más de una semana"));
        return Math.round(Math.min(100, valor) - (this.xp - xpNec) * pExtra - bonus);
      }
      else return 100;
    }
  }

  addXP(xp) {
    this.xp += xp;
    // console.log("fechaMundo:"+fechaMundo.toISOString());
    //por si no estuviera definida la variabel global
    if (fechaMundo) this.fechaXp = fechaMundo.toISOString();
    this.historial();

  }

  clearXP() { this.xp = 0 }

  historial() {
    database.ref("historial").child(this.clase).child(pj.nombre).child(fechaMundo.fecha()).child(this.nombre).set(this);
    console.log("guardando en historial/XP/" + pj.nombre + "/"+fechaMundo.fecha() );
  
  }

}


// var TIRADA = {
//   PIFIA: {name: "PIFIA", value: -1, code: "P"},
//   FALLO: {name: "FALLO", value: 1, code: "F"},
//   EXITO: {name: "EXITO", value: 2, code: "N"},
//   ESPECIAL: {name: "ESPECIAL", value: 3, code: "E"},
//   CRITICO: {name: "CRITICO", value: 4, code: "C"},
//   SUPERCRITICO: {name: "SUPERCRITICO", value: 5, code: "SC"},

// };


class TipoTirada {
  //TODO: quitar static para que vaya en firefox
  static tirada = ["PIFIA", "FALLO", "EXITO", "ESPECIAL", "CRITICO", "SUPERCRITICO"];
  static get PIFIA() {
    return 0;
  }
  static get FALLO() {
    return 1;
  }
  static get EXITO() {
    return 2;
  }
  static get ESPECIAL() {
    return 3;
  }
  static get CRITICO() {
    return 4;
  }
  static get SUPERCRITICO() {
    return 5;
  }

  static color(tp) {
    switch (tp) {
      case (TipoTirada.SUPERCRITICO):
        return "orange";
        break;
      case (TipoTirada.CRITICO):
        return "red";
        break;
      case (TipoTirada.ESPECIAL):
        return "blue";
        return "green";
        break;
      case (TipoTirada.EXITO):
        return "green";
        return "inherit";
        break;
      case (TipoTirada.FALLO):
        return "grey";
        break;
      default:
        ;
    }
  }


}


class Habilidad extends XP {
  /**
   * 
   * @param {string} nombre 
   * @param {string} tipo 
   * @param {number} valor 
   */
  constructor(nombre, tipo, valor) {
    super();
    this.nombre = nombre;
    this.tipo = tipo;
    if (isNaN(valor)) valor = 0;
    this.valor = valor;
    /** Bonificación por tipo de habilidad*/
    this.bh = 0;
    //bonificaciones
    this.bvalor = 0;
    this.bcritico = 0;
    this.bespecial = 0;
    this.mods = {}
    // this.t=this.total();
  }

  //te copia todas las propiedades de un objeto o
  setAll(o) {
    for (let key in o) {
      this[key] = o[key];
      // console.log( this[key] + o[key]);
    }
  }

  // activo una bonificación
  activarBon(b) {
    if (b.activado) return;
    // for (let key in b) {
    //     if(key!="activado)")
    //     this["b"+key] += b[key];
    //   }  
    this.bvalor += b.valor;
    this.bespecial += b.especial;
    this.bcritico += b.critico;

    b.activado = !b.activado;
  }

  // desactivo la bonificación
  desactivarBon(b) {
    if (!b.activado) return;
    this.bvalor -= b.valor;
    this.bespecial -= b.especial;
    this.bcritico -= b.critico;
    b.activado = !b.activado;
  }

  /**
   * 
   * @param {ModHab} mod El modificador de habilidad
   */
  addMod(mod) {
    console.log(mod);
    if (!this.mods[mod.atributo])
      this.mods[mod.atributo] = {}

    this.mods[mod.atributo][mod.id] = mod;
    //ÑAPA para que actualize el valot total
    this.valor++; this.valor--;
  }

  /**
 * 
 * @param {ModHab} mod El modificador de habilidad a eliminar
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
   * Da el tooltip de las modificaciones de la caracteristica c, o sin c, todas als modificaciones
   * @param {string} ah El atributo para Tooltip de Mods (e,c, g) o nada para dar el general (v)
   * @returns El texto en html del Tooltip
   */
  darTooltipMods(ah = 'v') {
    let html = "";
    for (const key in this.mods[ah]) {
      let valor = this.mods[ah][key];
      // let color=valor>0?'green':'red';
      let color = this[ah] < this.total(ah) ? 'green' : 'red';
      html += `${key}: <b style="color: ${color}"> ${valor.op} ${valor.ctd} </b><br>`
    }
    return html;
  }


  // save() {
  //     //TODO: utiliza la variable global pj, tal vez deberia hacerlo desde Animal
  //     console.log("personajes" + pj.nombre + ("habilidades") + (this.nombre));
  //     database.ref("personajes").child(pj.nombre).child("habilidades").child(this.nombre).set(this);

  // }

  subir(subida) {
    subida = parseInt(subida);
    if (isNumber(subida)) {
      this.valor += subida;
      this.clearXP();
      if (fechaMundo && subida > 0) this.fecha = fechaMundo;
      this.historial();
    }
  }

  historial() {
    database.ref("historial").child("habilidades").child(pj.nombre).child(fechaMundo.fecha()).child(this.nombre).set(this);
    console.log("guardando en historial/habilidades/" + pj.nombre + "/"+fechaMundo.fecha() );
  
  }

  subible() {
    return this.getProbabilidad(this.valor, fechaMundo, this.bh);

  }

  //TODO: Modificar para que no requiera de pj

  /**
   * da el bonificador por tipo de habilidad
   */
  // tipoBonus() {
  //     pj.getCar(this.tipo);
  // }

  /**
   * da el valor con las bonificaciones sumada
   * TODO: utiliza la variable global pj, tal vez deberia hacerlo desde Animal
   * o incluso un map golbal de Animales que se acceda por nombre
   */
  get v() { return (+this.valor) + (+this.bvalor) + (+this.bh) }


  //poner posibles bonificaciones en especialñ y crítico
  get e() { return Math.round(this.v * 0.2) + this.bespecial }
  get c() { return Math.max(Math.round(this.v * 0.05), 1) + this.bcritico }
  get p() { return Math.min(100, 101 - Math.round((100 - this.v) * 0.05)) }

  //propiedad de total
  get t() { return this.total() };

  //propiedad de subible
  get sub() { return this.subible() };


  //HACER COMO PROPIEDAD PARA VUETIFY del valor total con modificaciones
  get porcentaje() { return this.total('v') }
  get especial() { return this.total('e') }
  get critico() { return this.total('c') }
  get pifia() { return this.total('p') }



  /**
   * 
   * @param {String} magnitud La magnitud (v,e,c) de la que obtener el valor
   * @returns El valor total, aplicando mods, de la magnitud (v,e,c)
   */
  total(magnitud = 'v') {
    let total = this[magnitud];
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
    // console.log(total);

    if (multis) {
      // console.log("multis");
      // console.log(multis);
      for (let s of multis) {
        total = s.valor(total);
      }
    }

    // console.log(magnitud, total);
    return total;

  }



  /**
   * Te devuelve que tipo de tirada se obtiene con t
   * @param {number} t la tirada del dado
   */
  tirada(t, suerte = []) {

    if (t == 100)
      return TipoTirada.PIFIA; //la pifia siempre es pifia

    if (suerte.length > 0) {
      // console.log("SUERTE"+suerte);
      let mejor = this.tirada(t);
      suerte.forEach(valor => {
        // let v= parseInt(valor)+parseInt(t);//si no concatena el hdp
        let v = +valor + (+t) //así parece q suma
        let x = this.tirada(v);
        // console.log(` mejor=${mejor}, tirada(${v})=${x}`);
        if (x > mejor) mejor = x;
      });
      return mejor;
    }
    //TODO: soporte para -1,etc en tiradas? y hacer con total(x)
    switch (true) {
      case (t == 7 || t == 77):
        return TipoTirada.SUPERCRITICO;
      case (t >= this.p):
        return TipoTirada.PIFIA; //calcular otras pifias
      case (t <= this.c):
        return TipoTirada.CRITICO;
      case (t <= this.e):
        return TipoTirada.ESPECIAL;
      case (t <= this.v):
        return TipoTirada.EXITO;
      case (t > this.v):
        return TipoTirada.FALLO;
      default:
        ;
    }
  }

  xpTirada(t, suerte = []) {
    // console.log(t);
    let tir = this.tirada(t, suerte);
    // console.log(tir);
    return this.xpTipoTirada(tir, +t);
  }

  /**Añade la XP (solo hasta los porcentajes) de la tirada
   * 
   * @param {TipoTirada} tir el grado de éxito
   * @param {Number} dado el numero en 1d100
   */
  xpTipoTirada(tir, dado) {
    console.log(tir, dado);
    switch (tir) {
      case TipoTirada.SUPERCRITICO:
        this.xp += 4;
        console.log("Sube SUPERCRITICO:" + dado);
        return 4;
        break;
      case TipoTirada.CRITICO:
        if (dado && dado < 11) {
          this.xp += 3;
          console.log("Sube CRITICO:" + dado);
          return 3;
        }
        else if (dado && dado < 21) {
          this.xp += 1;
          console.log("Sube como ESPECIAL:" + dado);
        }
        break;
      case TipoTirada.ESPECIAL:
        if (dado && dado < 21) {
          this.xp += 1;
          console.log("Sube ESPECIAL:" + dado);
          return 1;
        }
        break;
      default: { console.log("NO SUBE NADA"); return 0 }
        break;
    }

  }


  /**
   * Devuelve la habilidad editable
   * @returns Un objeto HabilidadEditable copia de éste
   */
  editable() {
    let he = new HabilidadEditable();
    he.setAll(this);
    return he;
  }

}
/**
 * Permite que se puedan sumar restar o multiplicar el valor total de la habilidad
 */
class HabilidadEditable extends Habilidad {
  get v() {
    // if (this._total)
    //   return this._total
    // else return super.v;
    return this._total || super.v;
  }
  set total(valor) {
    this._total = Math.round(+valor)
    // console.log( this._total);
  }
  get total() {
    return this._total || this.v;
  }
  reset() {
    delete this._total;
  }

  sumar(s) { this.total += s }
  multiplicar(m) { this.total *= m }

  // xpTipoTirada(tir, dado) {
  //   console.log("SUbida delegada");
  //   //TirAMOS DE PJ
  //   pj.habilidades[this.nombre].xpTipoTirada(tir, dado);

  // }

}

class Hechizo extends Habilidad {
  /**
   * 
   * @param {string} nombre   Nombre del hechizo
   * @param {number} pm       Los puntos de magia que gasta el hechizo
   * @param {number} valor    El %
   * @typedef Efecto          
   * @param {Efecto} efecto   El efecto
   */
  constructor(nombre, pm = 1, valor, efecto = null) {
    super(nombre, "Magia", valor)
    this.pm = pm;
    this.efecto = efecto;
  }


  /**
   * 
   * @param {number} intensidad   los puntos de intensidad
   * @param {number} duracion     el nº de minutos de duración, 0 si es instantáneo
   * @param {Animal} objetivo     el objetivo del hechizo -en caso de encantar pordría ser objeto
   */
  hacerHechizo(intensidad, duracion, objetivo) {
    this.efecto.fecha = fechaMundo.add("minuto", duracion);
    this.efecto.obj = objetivo;
    objetivo.addEfecto(this.efecto);

  }

  iu() {
    return new iuHechizo(this);
  }

}

class HechizoReal extends Hechizo {
  constructor(hechizo) {
    super(hechizo.nombre, hechizo.pm, hechizo.valor, hechizo.efecto);
    this.setAll(hechizo);

    this.arte = {}
    this.modificadores = {}
  }

  get total() {
    if (this._total)
      return this._total
    else return this.v;
  }
  set total(valor) {
    this._total = Math.round(+valor)
  }
  sumar(s) { this._total += s; }
  multiplicar(m) { this.total *= m; }

  //OVERRIDES

  get e() { return Math.round(this.total * 0.2) + this.bespecial }
  get c() { return Math.round(this.total * 0.05) + this.bcritico }
  get p() { return Math.min(100, 101 - Math.round((100 - this.total) * 0.05)) }

  //te copia todas las propiedades de un objeto o
  setAll(o) {
    for (let key in o)
      this[key] = o[key];
  }

  setArte(arte) {
    this.artes[arte.nombre] = arte;
    arte.hechizo = this;
  }

  /**
  * 
  * @param {TipoTirada} tipoTirada el grado de éxito de la tirada
  * @returns 0 si no se modifica el hechizo, objeto con intensidad, gastados, penalizacion
  */
  act(tipoTirada) {

    var pm = this.pm;
    let gastados = 0
    let intensidad = 0


    switch (tipoTirada) {
      case (TipoTirada.SUPERCRITICO):
        intensidad = 5;
        break;
      case (TipoTirada.CRITICO):
        intensidad = 3;
        break;
      case (TipoTirada.ESPECIAL):
        intensidad = 1;
        break;
      case (TipoTirada.EXITO):
        break;
      case (TipoTirada.FALLO):
        intensidad = 0
        break;
      default:
        ;
    }

    // if (intensidad < pm) {
    //   gastados = (pm - intensidad)
    //   intensidad = pm;
    // }
    // else if (intensidad >= pm) {
    //   gastados = 0 //o 1?
    //   intensidad = pm + (intensidad - pm);
    // }

    this.intensidad = intensidad;
    this.gastados = gastados;

    // if(this.hechizo){
    //   this.hechizo[this.nombre].intensidad=intensidad;
    //   this.hechizo[this.nombre].gastados=gastados;
    //   this.hechizo[this.nombre].penalizacion= penalizacion;
    // }
  }

  artes() {
    this.gastados = 0;
    this.intensidad = 0;
    this.penalizacion = 0;
    for (let a in this.artes) {
      console.log(this.artes[a].nombre, this.artes[a].gastados, this.artes[a].intensidad, this.artes[a].penalizacion);
      this.gastados += this.artes[a].gastados
      this.intensidad += this.artes[a].intensidad
      this.penalizacion += this.artes[a].penalizacion
    }

    console.log(
      this.nombre,
      this.gastados,
      this.intensidad,
      this.penalizacion,
    );

  }

}

class Arte extends Habilidad {

  constructor(arte) {
    super(arte?.nombre, "Magia", arte?.valor)
    this.setAll(arte);
    //sobreescribe clase
    this.clase = this.constructor.name;

    this.pm = 0;
    // this.intensidad = intensidad;
    // this.gastados = gastados;
    // this.penalizacion= penalizacion;
  }

  //te copia todas las propiedades de un objeto o
  setAll(o) {
    for (let key in o) {
      this[key] = o[key];
    }
  }

  set pm(value) {
    if (value instanceof Number)
      this._pm = value
    else
      this._pm = parseInt(value);

  }

  get pm() {
    return this._pm;
  }

  /**
   * @returns {Hechizo} devuelve el hechizo asociado al arte
   */
  get hechizo() {
    return this.h;
  }

  /**
   * @param {HechizoReal} hechizo adjunta un hechizo al arte
   */
  set hechizo(hechizo) {
    if (hechizo instanceof HechizoReal)
      this.h = hechizo;
  }

  // /**
  //  * @returns la penalización al hechizo
  //  */
  //    penalizacion() {
  //     // var pm = +this.pm.value
  //     var pm = this.pm;
  //     if (pm == 0) return 0;
  //     let v = this.habilidad.tirada(this.input.value);

  //     if (v == TipoTirada.EXITO)
  //       return pm * 5;
  //     else return 0;

  //   }

  /**
   * 
   * @param {TipoTirada} tipoTirada el drado de éxito de la tirada
   * @returns 0 si no se modifica el hechizo, objeto con intensidad, gastados, penalizacion
   */
  act(tipoTirada) {

    if (this.pm == 0) return 0;
    var pm = this.pm;
    let gastados = 0
    let intensidad = 0
    let penalizacion = 0

    switch (tipoTirada) {
      case (TipoTirada.SUPERCRITICO):
        intensidad = 5;
        break;
      case (TipoTirada.CRITICO):
        intensidad = 3;
        break;
      case (TipoTirada.ESPECIAL):
        intensidad = 1;
        break;
      case (TipoTirada.EXITO):
        penalizacion = this.pm * 5
        break;
      case (TipoTirada.FALLO):
        intensidad = 0
        break;
      default:
        ;
    }

    if (intensidad < pm) {
      gastados = (pm - intensidad)
      intensidad = pm;
    }
    else if (intensidad >= pm) {
      gastados = 0 //o 1?
      intensidad = pm + (intensidad - pm);
    }

    var result = { intensidad: intensidad, gastados: gastados, penalizacion: penalizacion };
    this.intensidad = intensidad;
    this.gastados = gastados;
    this.penalizacion = penalizacion;

    // if(this.hechizo){
    //   this.hechizo[this.nombre].intensidad=intensidad;
    //   this.hechizo[this.nombre].gastados=gastados;
    //   this.hechizo[this.nombre].penalizacion= penalizacion;
    // }
    return result;
  }


}

class HabilidadMarcial extends Habilidad {
  constructor(nombre, tipo, valor, ataque = true, localizacion = null, arma = null) {
    super(nombre, tipo, valor);
    // this.nombre = nombre
    // this.tipo = tipo
    // this.valor = valor

    this.ataque = ataque
    this.localizacion = localizacion
    this.arma = arma
  }

  //Overrides

  /**
* da el valor con las bonificaciones sumada
* TODO: utiliza la variable global pj, tal vez deberia hacerlo desde Animal
* o incluso un map golbal de Animales que se acceda por nombre
*/
  get v() { return (this.arma?.bonificador) ? this.valor + this.bvalor + this.bh + this.arma.bonificador.valor : this.valor + this.bvalor + this.bh }

  // get v(){ return (this.arma?.bonificador)?this.valor + this.bvalor + this.bh +this.arma.bonificador.valor: super.v}

  // //poner posibles bonificaciones en especialñ y crítico
  get e() { return (this.arma?.bonificador) ? Math.round(this.v * 0.2) + this.bespecial + this.arma.bonificador.especial : Math.round(this.v * 0.2) + this.bespecial }
  get c() { return (this.arma?.bonificador) ? Math.round(this.v * 0.05) + this.bcritico + this.arma.bonificador.critico : Math.round(this.v * 0.05) + this.bcritico }
  //  get p() { return 100 } //TODO: hacer la formula de pifia

  // get v(){
  //     if(!this.arma || this.arma.bonificador) return super.v
  // }


}

class HabilidadDistancia extends HabilidadMarcial {

  constructor(nombre, tipo, valor, ataque = true, localizacion = null, arma = null, distancia = 0) {
    super(nombre, tipo, valor, ataque = true, localizacion = null, arma = null)
    // this.nombre = nombre
    // this.tipo = tipo
    // this.valor = valor
    this.distancia = distancia
  }

  disparo(distancia, viento, objetivo) {
    this.distancia = distancia
    this.viento = viento
    this.objetivo = objetivo
  }
  //Overrides
  //TODO: si es ballesta cambiar
  get v() {
    var pen = 0;
    //TODO mirar las fórmulas
    if (this.distancia) {
      if (this.distancia <= this.arma.total('alcanceRecto')) {
        pen = Math.round(this.distancia / 2);
      }
      else
        if (this.distancia <= this.arma.total('alcance')) {
          pen = this.distancia
        }
        else
          if (this.distancia > this.arma.total('alcance')) {
            return 0;
          }

    }
    //si está en alcance al menos 1
    return Math.max(1, super.v - pen);
  }

}

class Tecnica extends HabilidadMarcial {
  constructor(nombre, tipo, valor, pf = 1, ataque = true, localizacion = null, arma = null) {
    super(nombre, tipo, valor, ataque, localizacion, arma);
    this.pf = pf
  }


}


class BonHabilidad {
  constructor(nombre, valor, especial = 0, critico = 0) {
    this.nombre = nombre;
    this.valor = valor;
    this.especial = especial;
    this.critico = critico;
    this.activado = false;
  }

}

function habilidadesBasicas() {
  // let h={}
  // var h1 = new Habilidad("Correr", "Agilidad", 100);
  // var b1 = new BonHabilidad("Correr",0,10,10);
  // // h1.activarBon(b1);
  // h[h1.nombre]=h1;
  // h["Trepar"]=( new Habilidad("Trepar", "Agilidad", 15));
  // h["Saltar"]=( new Habilidad("Saltar", "Agilidad", 30));
  // h["Esquivar"]=( new Habilidad("Esquivar", "Agilidad", 25));
  // return h;

}

class MyCounter extends HTMLElement {
  constructor() {
    super();
    this.habilidad = new Habilidad("Correr", "Agilidad", 100);

    const style = `
        * {
          font-size: 100%;
        }
  
        span {
          width: 3rem;
          display: inline-block;
          text-align: center;
        }
       
        button {
          width: 64px;
          height: 64px;
          border: none;
          border-radius: 10px;
          background-color: seagreen;
          color: white;
        }
      `;

    //   const html = `
    //   <span id="habilidad">${this.count}%</span>
    //     <button id="dec">-</button>
    //     <span id="dado">${this.count}</span>
    //     <button id="inc">+</button>
    //   `;

    const html = `
      <div id="grupo${this.habilidad.nombre}" class="input-group-prepend">
        <span id="lb${this.habilidad.nombre}" class="input-group-text col-6">${this.habilidad.nombre}: ${this.habilidad.v}%</span>
        <span class="input-group-text dado"  id="dado"> <img src="img/10_sided_die.svg"></img></span>
        <input id="iDados" type="number" style="width: 2.3em;">
        <button id="btOK">OK</button>
      </div>
        `

    this.attachShadow({ mode: 'open' });
    // this.shadowRoot.innerHTML = `
    // ${html}
    // `;
    this.shadowRoot.innerHTML = `
        <style>
          ${style}
        </style>
        ${html}
        `;

    this.dado = this.shadowRoot.getElementById('dado');

    this.InputHabilidads = this.shadowRoot.getElementById('iDados');
    //   this.buttonDec = this.shadowRoot.getElementById('dec');
    //   this.spanValue = this.shadowRoot.getElementById('dado');

    //  console.log(this.getAttribute("valor"));

    this.rd = this.rd.bind(this);
  }

  set(habilidad) {
    this.habilidad = habilidad;
    this.shadowRoot.innerHTML = `<div id="grupo${this.habilidad.nombre}" class="input-group-prepend">
    <span id="lb${this.habilidad.nombre}" class="input-group-text col-6">${this.habilidad.nombre}: ${this.habilidad.v}%</span>
    <span class="input-group-text dado"  id="dado"> <img src="img/10_sided_die.svg"></img></span>
    <input id="iDados" type="number" style="width: 2.3em;">
    <button id="btOK">OK</button>
  </div>
    `
    this.dado = this.shadowRoot.getElementById('dado');
    this.connectedCallback();

  }

  rd() {
    this.InputHabilidads.value = Math.round(Math.random() * 100);
  }

  connectedCallback() {
    this.dado.addEventListener('click', this.rd);
  }

  disconnectedCallback() {
    this.dado.removeEventListener('click', this.rd);
  }
}


class InputHabilidad extends HTMLElement {
  constructor(hab = new HabilidadEditable("Habilidad", "Agilidad", 77), black = true) {
    // Always call super first in constructor
    super();
    //Habilidad editable
    this.habilidad = hab.editable();
    this.shadow = this.attachShadow({ mode: 'open' });

    this.wrapper = document.createElement('span');
    this.wrapper.setAttribute('class', 'wrapper');

    this.label = document.createElement('input');
    this.label.setAttribute("type", "text");

    this.label.classList.add("hab");
    this.label.setAttribute("value", this.habilidad.nombre);
    // this.label.readOnly = true;
    this.label.addEventListener('change', (event) => {

      console.log(this.personaje.habilidades[event.target.value]);
      // console.log(pj.habilidades[event.target.value]);
      this.setHabilidad(this.personaje.habilidades[event.target.value])
      // console.log(this.getAttribute('habilidad'));
      // if(input.value>this.getAttribute('habilidad')) input.style.color="red"
      // else input.style.color="black"
    });


    // input.setAttribute('max', '100');
    this.label.style.width = "7em";

    this.porcentaje = document.createElement('input');
    this.porcentaje.setAttribute("id", "porcentaje");
    this.porcentaje.setAttribute("type", "number");
    this.porcentaje.value = this.habilidad.v;
    // this.porcentaje.setAttribute("value", this.habilidad.v);
    this.porcentaje.setAttribute('min', '0');
    this.porcentaje.setAttribute('max', '9999');
    this.porcentaje.style.width = "3em";
    this.porcentaje.style.textAlign = "right";
    this.porcentaje.style.borderStyle = "none";

    //Porcentaje editable
    this.porcentaje.addEventListener('change', (event) => {
      console.log('cambiado a' + this.porcentaje.value);
      this.habilidad.total = this.porcentaje.value;
      // if(input.value>this.getAttribute('habilidad')) input.style.color="red"
      // else input.style.color="black"
    });

    this.percent = document.createElement('span');
    this.percent.innerHTML = "<b>% </b>"

    this.icon = document.createElement('span');
    this.icon.setAttribute('class', 'icon');
    this.icon.addEventListener('click', (event) => {

      this.input.value = Math.floor(Math.random() * 100 + 1); //mal
      // this.input.value = Math.round(Math.random() * 100); //mal
      this.act(this.input);
      // console.log(this.getAttribute('habilidad'));
      // if(input.value>this.getAttribute('habilidad')) input.style.color="red"
      // else input.style.color="black"
    });

    // const label = document.createElement('label');
    // ;
    // label.setAttribute("for", "porcentaje");
    // label.appendChild(document.createTextNode(this.habilidad.nombre));
    // label.style.width = "700px";


    //el input del dado de tirada
    this.input = document.createElement('input');
    this.input.setAttribute("type", "number");
    // this.input.setAttribute("value", "100");
    this.input.setAttribute("placeholder", "100");
    this.input.setAttribute('min', '1');
    this.input.setAttribute('max', '100');
    this.input.style.width = "2.3em";


    this.input.addEventListener('change', (event) => {
      this.act(this.input);
      // console.log(this.getAttribute('habilidad'));
      // if(input.value>this.getAttribute('habilidad')) input.style.color="red"
      // else input.style.color="black"
    });

    // Take attribute content and put it inside the info span
    // Insert icon
    let imgUrl;
    if (this.hasAttribute('img')) {
      imgUrl = this.getAttribute('img');
    } else {
      imgUrl = 'img/10_sided_die.svg';
    }

    const img = document.createElement('img');
    img.src = imgUrl;
    this.icon.appendChild(img);

    // Create some CSS to apply to the shadow dom
    const style = document.createElement('style');
    console.log(this.style.isConnected);

    // this.ok= document.createElement('button');
    // this.ok.classList.add("okay");
    this.ok = document.createElement('img');

    this.ok.src = this.habilidad.ataque ? 'img/sword.svg' : 'img/shield.svg';
    //  this.ok.src = 'img/check.svg';
    // if (this.habilidad instanceof HabilidadMarcial) this.ok.src = this.habilidad.ataque?'img/sword.svg':'img/shield.svg';
    this.ok.addEventListener('click', (event) => {
      console.log('Evento de xpTirada');
      let subida = this.habilidad.xpTirada(this.input.value, this.personaje?.suerte);
      this.personaje.habilidades[this.habilidad.nombre].xp += subida
      console.log(subida);

    });

    var styleblack = ''
    if (black)
      styleblack = `input,
    textarea,
    body{
        background-color: black;
        color: aliceblue;
    }`;
    style.textContent = `
          .wrapper {
            position: relative;
          }
          *{
            font-size: 100%;
            border-style: none;
          }
          img {
            width: 1.7rem;
            vertical-align: text-top; 
            transition: .5s ease;
          }
          img:hover{
            opacity: 0.9;
            filter: none;
          }
          img:active {
            -webkit-transform: rotate(360deg);
                    transform: rotate(360deg);
          }
          img:active {
            //width: 2rem;
            transition: .1s ease;
          }
          .button{
            display:inline-block;
            width: 30px;
            height: 30px;
            }
          .button.okay{
            background:url('img/check.svg');
             
            }
          .icon {
            position: relative;
            /* Adjust these values accordingly */
            vertical-align: top;  
          }
          ${styleblack}

        `;

    // Attach the created elements to the shadow dom

    // this.shadow.innerHTML=""
    this.shadow.appendChild(style);
    // console.log(style.isConnected);
    this.shadow.appendChild(this.wrapper);
    this.wrapper.appendChild(this.label);
    this.wrapper.appendChild(this.porcentaje);
    this.wrapper.appendChild(this.percent);
    this.wrapper.appendChild(this.icon);
    this.wrapper.appendChild(this.input);
    this.wrapper.appendChild(this.ok);


    //SI no hay personaje pj

    try {
      this.setPersonaje(pj);

    } catch (e) {

    }


    // Create a shadow root
  }

  lista(id, habilidades) {
    let ah = habilidades;
    // this.label.setAttribute("type", "search");
    let options = "";
    habilidades.forEach(h => {
      options += `<option value="${h.nombre}"></option>`;
    });
    this.label.innerHTML = `  <datalist id=${id}>
    ${options}
  </datalist>`
    this.label.setAttribute("list", id);
  }

  setPersonaje(personaje) {
    this.personaje = personaje;

    // let array = this.personaje.getHabilidades(h => (h instanceof HabilidadMarcial));
    let array = this.personaje.getHabilidades();

    // array.sort(function (a, b) {
    //   return a.v - b.v;
    // });
    // console.log(array.reverse());
    this.lista("listaHab" + personaje.nombre, array);
    // this.lista("listaHab" + personaje.nombre, array);
    this.h = array[0];


  }

  set h(habilidad) {
    this.setHabilidad(habilidad);
    // this.habilidad = habilidad;
    // this.label.setAttribute("value", this.habilidad.nombre);
    // this.porcentaje.setAttribute("value", this.habilidad.v);
  }
  get h() {
    return this.habilidad;
  }

  setHabilidad(habilidad) {
    if (habilidad) //this.habilidad = habilidad;
      this.habilidad = new HabilidadEditable(habilidad.nombre, habilidad.tipo, habilidad.valor)
    //pongo todo lo de habilidad en editable
    this.habilidad.setAll(habilidad);
    this.label.setAttribute("value", this.habilidad.nombre);
    this.porcentaje.setAttribute("value", this.habilidad.v);
    this.porcentaje.value = this.habilidad.v;
    this.ok.src = this.habilidad.ataque ? 'img/sword.svg' : 'img/check.svg';
  }

  /**
   * 
   * @param {} input El input con el valor de los dados
   * @returns {TipoTirada} el grado de éxito de la tirada;
   */
  act(input) {

    let v;
    if (this.personaje?.suerte?.length > 0)
      v = this.habilidad.tirada(input.value, this.personaje.suerte);
    else
      v = this.habilidad.tirada(input.value);

    switch (v) {
      case (TipoTirada.SUPERCRITICO):
        input.style.color = "red";
        break;
      case (TipoTirada.CRITICO):
        console.log("CRITICO");
        input.style.color = "red";
        break;
      case (TipoTirada.ESPECIAL):
        console.log("ESPECIAL");
        input.style.color = "green";
        break;
      case (TipoTirada.EXITO):
        console.log("EXITO");
        input.style.color = "inherit";
        break;
      case (TipoTirada.FALLO):
        console.log("FALLO");
        input.style.color = "grey";
        break;
      default:
        ;
    }

    return v;
  }

}

class InputSubirHabilidad extends InputHabilidad {

  constructor(hab = new Habilidad("Habilidad", "Agilidad", 77)) {
    super(hab);
    this.porcentaje.value = hab.subible()
    if (this.hasAttribute('dado')) {
      let dd = this.getAttribute('dado');
      this.DADO = new Dado(dd);
    } else
      this.DADO = new Dado('1d6');

    this.dado = document.createElement('span');
    this.dado.setAttribute('class', 'icon');
    this.dado.addEventListener('click', (event) => {
      let c = [1, 13]
      if (c.includes(parseInt(this.input.value))) {
        this.input.style.color = "blue";
        this.inputdado.value = this.DADO.dadoMax() + this.DADO.tirar()
      }
      else
        this.inputdado.value = this.DADO.tirar();

      // probarRnd((new Dado('1d6')).tirar,6,1000);
      // this.act(this.inputdado);
      // console.log(this.getAttribute('habilidad'));
      // if(input.value>this.getAttribute('habilidad')) input.style.color="red"
      // else input.style.color="black"
    });

    this.inputdado = document.createElement('input');
    this.inputdado.setAttribute("type", "number");
    // this.input.setAttribute("value", "100");
    this.inputdado.setAttribute("placeholder", "6");
    this.inputdado.setAttribute('min', '0');
    this.inputdado.setAttribute('max', this.MAX_DADO * 2);
    this.inputdado.style.width = "1.8em";

    //Imagen del dado de 6
    const img = document.createElement('img');
    img.src = 'img/6_sided_die.svg';
    this.dado.appendChild(img);

    //SOBREESCRIBIR OK para que haga otra cosa el click
    var new_element = this.ok.cloneNode(true);
    this.ok.parentNode.replaceChild(new_element, this.ok);
    this.ok = new_element;

    this.ok.addEventListener('click', (event) => {
      console.log("SUBIR");

      this.habilidad.subir(this.inputdado.value);
      // tablaHabilidades();
      let id;
      //si se ha definido como modal al darle a ok se cierra
      if (this.hasAttribute('modal')) {
        id = this.getAttribute('modal');
        console.log('MODAL ');
        $('#' + id).modal('close');
      }
      //solo para modal$('#modal').modal('close');

    });
    this.wrapper.insertBefore(this.dado, this.ok);
    this.wrapper.insertBefore(this.inputdado, this.ok);

  }
  //sobrescribir act()
  act(input) {
    // let v = this.habilidad.tirada(input.value);
    let iv = parseInt(input.value)
    let v = this.habilidad.subible();
    let sc = [7, 77];

    if (sc.includes(iv)) {
      // console.log('sube x2');
      input.style.color = "red";
      this.inputdado.value = this.DADO.dadoMax() * 2
    }
    else
      if (iv > v) { input.style.color = "green"; this.ok.hidden = false }
      else {
        input.style.color = "grey";
        this.ok.hidden = true;
      }


  }
  // override
  setHabilidad(habilidad) {
    if (habilidad) this.habilidad = habilidad;
    this.label.setAttribute("value", this.habilidad.nombre);
    this.porcentaje.setAttribute("value", this.habilidad.subible());
    this.porcentaje.value = this.habilidad.subible();
    this.percent.innerHTML = '⇈⇧⇑'//"<span style='font-size: 20px;'>⇈⇧</span>"
    this.ok.src = 'img/check.svg';
  }

  /**Cambia el dado con el que se sube
   * @param {Strinf} dd el dado como string
   */
  setDado(dd) {
    this.DADO = new Dado(dd);
  }

}

class InputArte extends InputHabilidad {
  constructor(habilidad, black = false) {
    super(habilidad, black);
    this.setAttribute("id", "ia-" + habilidad.nombre);
    this.pm = document.createElement('input');
    this.pm.setAttribute("id", "pm");
    this.pm.setAttribute("type", "number");
    this.pm.value = 0;
    this.pm.setAttribute('min', '0');
    this.pm.setAttribute('max', '99');
    this.pm.style.width = "2em";
    this.pm.style.textAlign = "right";
    this.pm.style.color = "blue";
    this.pm.style.fontWeight = "700";

    this.pm.style.borderStyle = "none";

    // this.wrapper.appendChild();
    this.wrapper.insertBefore(this.pm, this.icon);

    this.intensidad = 0
    this.gastados = 0
    this.penalizacion = 0

  }

  setPersonaje(personaje) {
    this.personaje = personaje;
    var nombres = constante.nombreArtes;
    let array = this.personaje.getHabilidades(h => nombres.includes(h.nombre));

    array.sort(function (a, b) {
      return a.v - b.v;
    });
    console.log(array.reverse());
    // this.lista("listaHab"+personaje.nombre,this.personaje.getHabilidades());
    this.lista("listaHab" + personaje.nombre, array);
    // this.h = array[0];


  }

  act(input) {
    super.act(input)
    // console.log(this.pmGastados());
    this.calcularIntensidad(input)
  }

  /**
   * @returns los PM que se gasta con el tipo de tirada
   */
  // pmGastados() {
  //   let v = this.habilidad.tirada(this.input.value);
  //   if (+this.pm.value == 0) return 0;
  //   switch (v) {
  //     case (TipoTirada.SUPERCRITICO):
  //       this.pm.color = "red";
  //       return +this.pm.value + 5;
  //       break;
  //     case (TipoTirada.CRITICO):
  //       console.log("CRITICO");
  //       this.pm.color = "red";
  //       return +this.pm.value + 3;
  //       break;
  //     case (TipoTirada.ESPECIAL):
  //       console.log("ESPECIAL");
  //       this.pm.color = "green";
  //       return +this.pm.value + 1;
  //       break;
  //     case (TipoTirada.EXITO):
  //       return +this.pm.value
  //       break;
  //     case (TipoTirada.FALLO):
  //       console.log("FALLO");
  //       this.pm.color = "grey";
  //       return 1;
  //       break;
  //     default:
  //       ;
  //   }
  // }

  /**
   * @returns los PM de intensidad del Arte
   */
  calcularIntensidad(input) {
    let v;
    if (this.personaje?.suerte?.length > 0)
      v = this.habilidad.tirada(input.value, this.personaje.suerte);
    else
      v = this.habilidad.tirada(input.value);
    var pm = +this.pm.value
    if (pm == 0) return 0;
    let gastados = 0
    let intensidad = 0
    switch (v) {
      case (TipoTirada.SUPERCRITICO):
        this.pm.color = "red";
        intensidad = 5;
        break;
      case (TipoTirada.CRITICO):
        console.log("CRITICO");
        this.pm.color = "red";
        intensidad = 3;
        break;
      case (TipoTirada.ESPECIAL):
        console.log("ESPECIAL");
        this.pm.color = "green";
        intensidad = 1;
        break;
      case (TipoTirada.EXITO):
        break;
      case (TipoTirada.FALLO):
        intensidad = 0
        return 0;
        break;
      default:
        ;
    }

    if (intensidad < pm) {
      gastados = (pm - intensidad)
      intensidad = pm;
      this.pm.style.color = 'blue';
    }
    else if (intensidad >= pm) {
      gastados = 0 //o 1?
      intensidad = pm + (intensidad - pm);
      this.pm.style.color = 'red'; //pq puedes subir puntos si te interesa no gastas

    }

    this.intensidad = intensidad;
    this.gastados = gastados;
    this.penalizacion = this.calcularPenalizacion()
    console.log(
      'intensidad', this.intensidad,
      'gastados', this.gastados,
      'penalizacion', this.penalizacion);

    console.log(this);

    return intensidad;
  }

  /**
   * @returns la penalización al hechizo
   */
  calcularPenalizacion() {
    var pm = +this.pm.value
    if (pm == 0) return 0;
    let v = this.habilidad.tirada(this.input.value);

    if (v == TipoTirada.EXITO)
      return pm * 5;
    else return 0;

  }

}

class InputHechizo extends InputHabilidad {
  constructor(habilidad = new HechizoReal(Hechizo, 7, 77), black) {
    super(habilidad, black);
    this.pm = document.createElement('input');
    this.pm.setAttribute("id", "pm");
    this.pm.setAttribute("type", "number");
    this.pm.value = 0;
    this.pm.setAttribute('min', '0');
    this.pm.setAttribute('max', '99');
    this.pm.style.width = "2em";
    this.pm.style.textAlign = "right";
    this.pm.style.color = "blue";
    this.pm.style.fontWeight = "700";

    this.pm.style.borderStyle = "none";

    // this.wrapper.appendChild();
    this.wrapper.insertBefore(this.pm, this.icon);

    this.label.style.width = "13em"; //los hechizos son más largos

    this.artes = {}

    this.ok.addEventListener('click', (event) => {
      console.log(`Hechizo ${this.h.nombre} realizado`);
      this.lanzarHechizo();
      this.habilidad.xpTirada(this.input.value, this.personaje?.suerte)
      // actPuntos();
    });

  }

  // set hechizo(h) {
  //   if (typeof h === 'string') {
  //     if (this.personaje) {
  //       console.log(`${this.personaje.nombre} con el Hechizo ${h.nombre}`);
  //       console.log(this.personaje.getHabilidad(h.nombre));
  //     } else console.log(`Personaje no especificado`);
  //   }
  //   if (h instanceof Hechizo) {
  //     this._hechizo = new HechizoReal(h);
  //   }

  // }
  // get hechizo() {
  //   return this._hechizo;
  // }

  //override
  setPersonaje(personaje) {
    this.personaje = personaje;

    // let array = this.personaje.getHabilidades(h => (h instanceof Hechizo));
    let array = this.personaje.getHabilidades(h => (h instanceof Hechizo));

    array.sort(function (a, b) {
      return a.v - b.v;
    });
    console.log(array.reverse());
    // this.lista("listaHab"+personaje.nombre,this.personaje.getHabilidades());
    // this.lista("listaHab" + personaje.nombre, this.personaje.getHabilidades(h => (h instanceof Hechizo)));
    this.lista("listaHab" + personaje.nombre, array);

    this.h = array[0];

  }

  //override
  setHabilidad(habilidad) {
    super.setHabilidad(habilidad);
    // if (habilidad) this.habilidad = habilidad;
    // this.label.setAttribute("value", this.habilidad.nombre);
    // this.porcentaje.setAttribute("value", this.habilidad.v);
    // this.porcentaje.value = this.habilidad.v;
    // this.ok.src = this.habilidad.ataque ? 'img/sword.svg' : 'img/check.svg';
    this.pm.value = habilidad?.pm ? habilidad.pm : 0;
  }

  setArte(arte) {
    if (!arte) return;
    console.log(arte);
    this.artes[arte.h.nombre] = arte;
    console.log(this.artes);
    // arte.hechizo = this;
  }

  delArte(arte) {
    if (!arte) return;
    console.log('Borra ' + arte.h.nombre);
    // this.artes[arte.h.nombre] = null;
    delete this.artes[arte.h.nombre];
    console.log(this.artes);

  }

  /**
  * 
  * @param {TipoTirada} tipoTirada el grado de éxito de la tirada
  * @returns 0 si no se modifica el hechizo, objeto con intensidad, gastados, penalizacion
  */
  act(tipoTirada) {
    tipoTirada = super.act(this.input);

    var pm = +this.pm.value;
    let gastados = 0
    let intensidad = 0

    switch (tipoTirada) {
      case (TipoTirada.SUPERCRITICO):
        intensidad = 5;
        gastados = 1;
        console.log('hechizo SP, gasta 1');
        break;
      case (TipoTirada.CRITICO):
        intensidad = 3;
        gastados = Math.max(pm - 1, 1);
        break;
      case (TipoTirada.ESPECIAL):
        intensidad = 1;
        break;
      case (TipoTirada.EXITO):
        gastados = pm;
        break;
      case (TipoTirada.FALLO):
        intensidad = 0
        gastados = 1;
        console.log('hechizo fallido, gasta 1');
        return;
        break;
      default:
        ;
    }

    // if (intensidad < pm) {
    //   gastados = (pm - intensidad)
    //   intensidad = pm;
    // }
    // else if (intensidad >= pm) {
    //   gastados = 0 //o 1?
    //   intensidad = pm + (intensidad - pm);
    // }
    this.gastados = gastados;
    this.actArtes()
    // this.intensidad += intensidad;
    // this.gastados = gastados;


  }

  actArtes() {
    // console.log(this.artes);
    // this.gastados = 0;
    this.intensidad = 0;
    this.penalizacion = 0;
    let info = '';
    for (let a in this.artes) {
      console.log(this.artes[a].h.nombre, this.artes[a].gastados, this.artes[a].intensidad, this.artes[a].penalizacion);
      if (this.artes[a].intensidad > 0)
        info += `<br>${this.artes[a].h.nombre} de ${this.artes[a].intensidad} gasta ${this.artes[a].gastados}PM y penaliza ${this.artes[a].penalizacion}`
      // console.log(this.artes[a].h.nombre)
      this.gastados += +this.artes[a].gastados
      // this.intensidad += this.artes[a].intensidad
      this.penalizacion += this.artes[a].penalizacion
    }

    // console.log(
    //   this.h.nombre,
    //   this.gastados,
    //   this.intensidad,
    //   this.penalizacion,
    // );
    this.h.reset();
    this.h.sumar(-this.penalizacion);
    this.porcentaje.value = this.h.total;

    console.log(
      this.h.nombre, 'gasta',
      this.gastados,
      'penaliza',
      this.penalizacion,
    );

    // toast(`${this.h.nombre} gasta ${this.gastados}PM y penaliza ${this.penalizacion}`+info);
    alert(`${this.h.nombre} gasta ${this.gastados}PM y penaliza ${this.penalizacion}` + info);

  }

  lanzarHechizo() {
    //actualizar??
    this.act();
    // toast(`${this.h.nombre} realizado, gasta ${this.gastados}PM ` + info);
    if (this.personaje) {
      this.personaje.PM -= this.gastados;
      this.personaje.save();
    }
  }


}

//Input de clase
// class InputCustom extends HTMLElement {
//   constructor(clase, lista) {
//     super();
//     let i = 'input';

//     var html = '';

//     var tabla = document.createElement('table');
//     this.reset = {}
//     this.appendChild(this.tablear('root', clase, lista));
//   }

//   /**
//    * 
//    * @param {Object} o el objeto del cual obtener la tabla
//    * @returns La tabla 
//    */
//   tablear(id, clase, lista) {
//     var tabla = document.createElement('table');
//     // var c;
//     for (let key in clase) {
//       if (lista?.includes(key) || !lista && clase[key]) {
//         var fila = document.createElement('tr');
//         // if(clase[key] instanceof Object)

//         console.log(typeof clase[key], key, clase[key]);
//         // console.log(clase[key].constructor.name);
//         var tipo = clase[key].constructor.name
//         //component
//         var c;
//         var ta; //tabla anidada
//         var isObject = false;

//         switch (tipo) {
//           case 'Number':
//             c = document.createElement('input');
//             c.setAttribute("type", "number");
//             c.setAttribute("value", clase[key]);
//             c.addEventListener('change', (event) => {
//               clase[key] = +event.target.value; //para que sea número
//               console.log(clase[key]);
//             });
//             break;
//           case 'String':
//             c = document.createElement('input');
//             c.setAttribute("type", "text");
//             c.setAttribute("value", clase[key]);
//             c.addEventListener('change', (event) => {
//               clase[key] = event.target.value;
//               console.log(clase[key]);
//             });
//             break;
//           case 'Date':
//             c = document.createElement('input');
//             c.setAttribute("type", "datetime-local");
//             try {
//               c.setAttribute("value", clase[key].fechahoraLocal());
//             } catch (error) {
//               console.error('FAllo con fechas');
//             }

//             c.addEventListener('change', (event) => {
//               clase[key] = new Date(event.target.value);
//               console.log(clase[key]);
//             });
//             break;
//           // case 'Object':
//           //   c=this.tablear( clase[key])
//           //   break;

//           default:
//             // html += `${key}<${i}  value='${clase[key]}'><br>`
//             if (typeof clase[key] === 'object') {
//               console.log('Tableo ' + id + key);

//               ta = this.tablear(id + key, clase[key])
//               ta.id = id + key;
//               // c = ta;
//               isObject = true;
//               ta.style.border = "thin solid"
//             }
//             else {
//               c = document.createElement('input');
//               c.setAttribute("value", clase[key]);
//             }

//         }
//         this.reset[id + key] = clase[key]
//         tabla.appendChild(fila)
//         // this.appendChild(c);

//         let label = document.createElement('td');
//         if (isObject) { //si es objeto que colapse la tabla
//           let b = document.createElement('span');
//           // let b= document.createElement('button');
//           b.innerHTML = "&#9650";
//           label.innerText = key;
//           label.id = ta.id;
//           label.appendChild(b)
//           b.addEventListener('click', (event) => {
//             let next = document.getElementById(label.id).nextSibling;
//             // console.log(ta);
//             // next=ta.nextSibling;
//             console.log(next);

//             next.hidden = !next.hidden
//             next.hidden ? b.innerHTML = "&#9660;" : b.innerHTML = "&#9650"; // ▼ ▲

//             // ta.hidden = !ta.hidden
//             //  c.hidden?b.innerHTML =" +  &#9650;":b.innerHTML =" -  &#9660" ;
//             // ta.hidden ? b.innerHTML = "&#9660;" : b.innerHTML = "&#9650"; // ▼ ▲
//             //  c.hidden?b.innerHTML ="&#9662;":b.innerHTML ="&#9652" ; //▾ ▴
//           });
//           fila.appendChild(label)
//           fila.appendChild(document.createElement('td').appendChild(ta));
//         }
//         else {
//           label.innerText = key;
//           let b = document.createElement('span');
//           // let b= document.createElement('button');
//           b.innerHTML = "&#11176";
//           // b.innerHTML = "&#8630";
//           label.appendChild(b)
//           b.addEventListener('click', (event) => {
//             console.log(event.target);
//             console.log(event.target.parentNode.nextSibling);
//             // c.setAttribute("value", this.reset[key]);
//             event.target.parentNode.nextSibling.setAttribute("value", this.reset[id + key]);
//             event.target.parentNode.nextSibling.value = this.reset[id + key];
//             event.target.parentNode.nextSibling.dispatchEvent(new Event("change"));;

//             console.log(this.reset[id + key]);
//           });

//           fila.appendChild(label)
//           fila.appendChild(document.createElement('td').appendChild(c));

//         }

//         tabla.appendChild(fila);
//       }

//     }
//     return (tabla);

//   }

// }
/**
 *  Clase para crear un input de tipo personalizado
 *  @param {Object} clase Objeto del cual se quiere crear el input
 *  @param {Array} lista Array con los nombres de los atributos que se quieren mostrar vacio o null, para que muestre todos
 *  @param {boolean} colapse Si se quiere que la tabla colapse o no, por defecto true
 */
class InputCustom extends HTMLElement {
  constructor(clase, lista, colapse = true) {
    super();
    let i = 'input';

    var html = '';

    var tabla = document.createElement('table');
    this.reset = {}
    this.colapse = colapse; // Store the collapse preference
    this.appendChild(this.tablear('root', clase, lista, colapse));
  }

  /**
   * 
   * @param {Object} o el objeto del cual obtener la tabla
   * @returns La tabla 
   */
  tablear(id, clase, lista, colapse = true) {
    var tabla = document.createElement('table');
    // var c;
    for (let key in clase) {
      if (lista?.includes(key) || !lista && clase[key]) {
        var fila = document.createElement('tr');
        // if(clase[key] instanceof Object)

        //console.log(typeof clase[key], key, clase[key]);
        // console.log(clase[key].constructor.name);
        var tipo = clase[key].constructor.name
        //component
        var c;
        var ta; //tabla anidada
        var isObject = false;

        switch (tipo) {
          case 'Number':
            c = document.createElement('input');
            c.setAttribute("type", "number");
            c.setAttribute("value", clase[key]);
            c.addEventListener('change', (event) => {
              clase[key] = +event.target.value; //para que sea número
              //console.log(clase[key]);
            });
            break;
          case 'String':
            c = document.createElement('input');
            c.setAttribute("type", "text");
            c.setAttribute("value", clase[key]);
            c.addEventListener('change', (event) => {
              clase[key] = event.target.value;
              //console.log(clase[key]);
            });
            break;
          case 'Date':
            c = document.createElement('input');
            c.setAttribute("type", "datetime-local");
            try {
              c.setAttribute("value", clase[key].fechahoraLocal());
            } catch (error) {
              console.error('FAllo con fechas');
            }

            c.addEventListener('change', (event) => {
              clase[key] = new Date(event.target.value);
              //console.log(clase[key]);
            });
            break;
          // case 'Object':
          //   c=this.tablear( clase[key])
          //   break;

          default:
            // html += `${key}<${i}  value='${clase[key]}'><br>`
            if (typeof clase[key] === 'object') {
              //console.log('Tableo ' + id + key);

              ta = this.tablear(id + key, clase[key], null, colapse)
              ta.id = id + key;
              // c = ta;
              isObject = true;
              ta.style.border = "thin solid"
            }
            else {
              c = document.createElement('input');
              c.setAttribute("value", clase[key]);
            }
        }
        this.reset[id + key] = clase[key]
        tabla.appendChild(fila)
        // this.appendChild(c);

        let label = document.createElement('td');
        if (isObject) { //si es objeto que colapse la tabla
          let b = document.createElement('span');
          // let b= document.createElement('button');
          let collapsed = colapse; // Estado inicial basado en el parámetro
          b.innerHTML = collapsed ? "&#9660;" : "&#9650;"; // Icono según el estado
          b.style.cursor = "pointer"; // Añadido cursor pointer para mejor UX
          label.innerText = key;
          label.id = ta.id;
          label.appendChild(b);
          
          // Crear celda para la tabla anidada
          let tdContent = document.createElement('td');
          tdContent.appendChild(ta);
          tdContent.hidden = collapsed; // Ocultar según la preferencia
          
          b.addEventListener('click', (event) => {
            // Usar la celda directamente en lugar de buscarla
            let contentCell = event.target.parentNode.nextSibling;
            console.log(contentCell);

            contentCell.hidden = !contentCell.hidden;
            contentCell.hidden ? b.innerHTML = "&#9660;" : b.innerHTML = "&#9650;"; // ▼ ▲
          });
          
          fila.appendChild(label);
          fila.appendChild(tdContent); // Añadir la celda directamente
        }
        else {
          label.innerText = key;
          let b = document.createElement('span');
          // let b= document.createElement('button');
          b.innerHTML = "&#11176";
          b.style.cursor = "pointer"; // Añadido cursor pointer
          // b.innerHTML = "&#8630";
          label.appendChild(b)
          b.addEventListener('click', (event) => {
            console.log(event.target);
            console.log(event.target.parentNode.nextSibling);
            // c.setAttribute("value", this.reset[key]);
            event.target.parentNode.nextSibling.setAttribute("value", this.reset[id + key]);
            event.target.parentNode.nextSibling.value = this.reset[id + key];
            event.target.parentNode.nextSibling.dispatchEvent(new Event("change"));;

            console.log(this.reset[id + key]);
          });

          // Crear celda para el input
          let tdContent = document.createElement('td');
          tdContent.appendChild(c);
          
          fila.appendChild(label);
          fila.appendChild(tdContent);
        }

        tabla.appendChild(fila);
      }
    }
    return (tabla);
  }
}

// Registrar el elemento personalizado
customElements.define('input-custom', InputCustom);

// Define the new element

customElements.define('input-habilidad', InputHabilidad);
customElements.define('input-hechizo', InputHechizo);

customElements.define('input-arte', InputArte);
customElements.define('input-subir', InputSubirHabilidad);

// customElements.define('my-counter', MyCounter);

var hechizo;

function IUHechizos(p, div = "salida", black = false) {
  var salida = document.getElementById(div);
  var options = ''
  // salida.appendChild(selector);
  var div = document.createElement("div");

  var nombres = constante.nombreArtes;
  var habilidades = []

  p.actTodosBonHab();

  nombres.forEach(n => {
    h = p.getHabilidad(n);
    if (h && h.valor > 0) {
      habilidades.push(h)
      options += `<option>${n}</option>`
    }
  });

  console.log(nombres);


  //MATERIAL CSS
  // let html = `<select class="selectpicker col s6" id="selArtes" multiple data-live-search="true" data-width="fit"
  // multiple title="Seleccione artes a mostrar">
  //   ${options}
  // </select>`;

  //ANGULAR MATERIAL
  let html = `<select id="selArtes" multiple>
    ${options}
  </select>`;




  salida.innerHTML = html;

  var ih = new InputHechizo(p.getHabilidad('Volar'), black);
  var div = document.createElement("div");
  ih.setPersonaje(p);
  hechizo = ih;
  div.appendChild(ih)
  salida.appendChild(div);

  var objArtes = {}
  // $('#selArtes').change(function (e) {
  //   var op = document.getElementById('selArtes').options;
  //   for (let index = 0; index < op.length; index++) {
  //     visibilidad("ia-" + op[index].value, op[index].selected);
  //     if(op[index].selected){
  //       hechizo.setArte(objArtes[op[index].value])
  //     }
  //     else
  //     hechizo.delArte(objArtes[op[index].value])
  //   }
  // });

  document.getElementById('selArtes').addEventListener('change', cambios)

  //inicializa artes
  habilidades.forEach(h => {
    if (h && h.valor > 0) {
      var div = document.createElement("div");
      // div.style.display="inline-block" //en linea si cabe entero
      var ia = new InputArte(h, black);
      ia.hidden = true;
      ia.ok.addEventListener('click', (event) => {
        console.log(`Aplicar desde ${ia.h.nombre} a Hechizo ${hechizo.h.nombre}`);
        hechizo.actArtes();
      });
      objArtes[h.nombre] = ia;
      div.appendChild(ia)
      salida.appendChild(div);

    }
  });

  function cambios() {
    console.log('Cambios');
    var op = document.getElementById('selArtes').options;
    for (let index = 0; index < op.length; index++) {
      visibilidad("ia-" + op[index].value, op[index].selected);
      if (op[index].selected) {
        hechizo.setArte(objArtes[op[index].value])
      }
      else
        hechizo.delArte(objArtes[op[index].value])
    }

  }
  function visibilidad(id, visible) {
    document.getElementById(id).hidden = !visible;
  }


  // habilidades.forEach(n => {
  //   h = p.getHabilidad(n);
  //   console.log(h);
  //   document.getElementById(`ia-${h.nombre}`).setPersonaje(p);
  //   // document.getElementById(`ia-${h.nombre}`).setHabilidad(h);
  // });

}

// export {Habilidad, BonHabilidad};

// var h1 = new Habilidad("Correr", "Agilidad", 100);

// var b1 = new BonHabilidad("Correr",0,10,10);
// h1.activarBon(b1);
// h1.desactivarBon(b1);

// h1.tirada(100);
// for (let index = 1; index <= 100; index++) {
//     console.log(index + ":" + TipoTirada.tirada[h1.tirada(index) + 1]);
// }
// console.log(TipoTirada.tirada[h1.tirada(77)-h1.tirada(1)+1]);


//#region IU
// Creo clases para la IU, especialmente para Vue, Angular, etc

function numero(x) {
  if (isNaN(x)) x = parseInt(x) || 0;
  return x;
}


class iuHabilidad {
  constructor(habilidad, dados, grado, modificadores) {
    this._habilidad = habilidad
    this.nombre = habilidad?.nombre || "iuHabilidad"
    this._dados = numero(dados)
    this._grado = numero(grado)
    this._modificadores = modificadores
  }

  get total() {
    return this.habilidad?.total() || 0
  }

  get habilidad() { return this._habilidad }
  set habilidad(habilidad) { this._habilidad = habilidad }

  get dados() { return this._dados }
  set dados(dados) {
    this._dados = numero(dados);
    this.grado = this.habilidad.tirada(dados);
    console.log(this.grado);
  }

  get grado() { return this._grado }
  set grado(grado) { this._grado = numero(grado) }

  get modificadores() { return this._modificadores }
  set modificadores(modificadores) { this._modificadores = modificadores }


}

class iuHechizo extends iuHabilidad {
  constructor(habilidad, dados, grado, modificadores, pm, intensidad, gastado) {
    super(habilidad, dados, grado, modificadores)
    this._pm = habilidad?.pm
    this._intensidad = intensidad
    this._gastado = gastado
  }


  get pm() { return this._pm }
  set pm(pm) {
    this._pm = numero(pm);
    this._pm = pm
    this.gastado = pm
  }

  get intensidad() { return this._intensidad }
  set intensidad(intensidad) {
    this._intensidad = numero(intensidad);
  }

  get gastado() { return this._gastado }
  set gastado(gastado) {
    console.log("gastado " + gastado);
    this._gastado = numero(gastado);
  }

}

//#endregion


