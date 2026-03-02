class LocImagen {

}

class Localizaciones {
    /**
     *Creates an instance of Localizaciones.
     * @param {number} pg Los puntos de golpe del personaje
     * @memberof Localizaciones
     */
    constructor(pg = 1,pa=0) {
        this.localizaciones = []
        /** Se utiliza para un daño general como desangramiento o succionar PG */
        this.dañoGeneral = 0;
        this.pg = pg //=1
        this.pa = pa //=1
    }

    /**
     *Añade una localización
     *
     * @param {*} loc la localización a añadir
     * @memberof localizaciones
     */
    add(loc) {
        if (this.pg) loc.setPG(this.pg)
        if(!loc.pa) loc.pa=this.pa;
        this.localizaciones.push(loc)
        // console.log(this.localizaciones);
    }

    /**
     *  Actualiza los PG de la localización
     *
     * @param {number} pg
     * @memberof Localizaciones
     */
    actPG(pg) {
        // console.log("actualizar PG:" +pg );
        this.pg = pg;
        this.localizaciones.forEach(loc => {
            // console.log(loc.nombre+":"+pg);
            loc.setPG(pg);
        });
    }

    /**
     *  Actualiza los PA de la localización
     *
     * @param {number} pa
     * @memberof Localizaciones
     */
        actPA(pa) {
            this.pa = pa;
            this.localizaciones.forEach(loc => {
                if(!loc.pa) loc.pa=pa;
            });
        }


    /**
     *Indica si es una localización final o tiene sublocalizaciones
     *
     * @returns {boolean} si es o no final
     * @memberof Localizaciones
     */
    esFinal() { return this.localizaciones.length == 0 }

    /**
     * Da las localizaciones por tirada
     * TODO: definir si tirada de 1d20 o 1d100
     * @param {number} x la tirada
     * @memberof Localizaciones
     */
    darLocalizacion(x) {
        var l;
        // console.log("Localizaciones en " + x);
        //Si es final y coincide se devuelve pero ya lo hace el padre
        // if (this.esFinal() && this.max >= x && this.min <= x) {
        //     // l=this;
        //     return this;
        // }

        if (isNaN(x)) { //si no es un numero busca por nombre
            // console.log("no numero:" +this.nombre);
            this.localizaciones.forEach(loc => {
                //si miro aqui si es final y la devuelvo me ahorro una llamada a darLocalizacion
                if (loc.esFinal() && loc.nombre == x) {
                    //  console.log("Encontrado:"+x);
                    l = loc; return loc;
                } //da error si no hago l=loc
                else
                    if (!loc.esFinal()) {
                        if(loc.nombre == x) l=loc
                        else{
                            let ok = loc.darLocalizacion(x); //busca recursiva hasta que sea final
                            if (ok) l = ok; //si no es undefined es la que se busca
                        } //hago que dé tambien las no finales!!
                       
                    }

                //    loc.darLocalizacion(x);
                // console.log(`${loc.nombre}, ${loc.min}-${loc.max}`);
            });
            // return l;
        }
        else //si es número
        {
            // console.log("numero");
            this.localizaciones.forEach(loc => {
                //si miro aqui si es final y la devuelvo me ahorro una llamada a darLocalizacion
                if (loc.esFinal() && loc.max >= x && loc.min <= x) { l = loc; return loc; } //da error si no hago l=loc
                else //si no se da la del hijo que cumpla
                    if (loc.max >= x && loc.min <= x)
                        l = loc.darLocalizacion(x); //busca recursiva hasta que sea final
                //    loc.darLocalizacion(x);
                // console.log(`${loc.nombre}, ${loc.min}-${loc.max}`);
            });
        }

        return l;
    }

    setAll(o) {
        for (let key in o) {
            this[key] = o[key];
        }
        if(this.localizaciones.length > 0){
            // console.log("entro en las localizaciones de "+this.nombre);
        let lt=[] //localizaciones temporales
        for (let l of this.localizaciones) {
            //miro los distintos tipos de objetos por una propiedad única
            //TODO: tal vez poner el tipo de clase en una propiedad
            let ol = new Localizacion() //objeto localizaciones
            
            ol.setAll(l);//se rellena con datos, si tiene más localizaciones debe hacerlo recursivo
            ol.setPG(this.pg) //pongo los PG 
            lt.push(ol); //se guarda en el temporal
        }
        this.localizaciones=lt; //se guardan el temporal como objetos localizaciones
    }

    }

    /**
     * Devuelve las localizaciones dañadas a partir de dañoMinimo (=0)
     * @param {Number} dañoMinimo el daño mínimo a partir del cual se darán las localizaciones (0 por defecto)
     * @returns Un array ordenado de las localizaciones ordenadas descendente por daño
     */
    dañadas(dañoMinimo=0){
        let dañadas = this.localizaciones.filter(l => l.darDaño() > dañoMinimo);
        //Las más dañadas primero (con respecto a los pg que tiene)
        console.log(dañadas.sort((a, b) => (b.daño / b.pg) - (a.daño / a.pg)));
        return dañadas;

    }

    sanar(x) {
        if (!this.esFinal()) //si no es final
            x = this.sanarPartes(x);
        if (x > 0) //si queda curación cura los generales
            this.dañoGeneral = (x > this.dañoGeneral) ? 0 : this.dañoGeneral - x;
    }
    /**
     *Sana las sublocalizaciones, ordenandolas por el daño relativo 
     *
     * @param {number} x Los puntos a sanar
     * @returns los puntos que sobran de la curación
     * @memberof Localizaciones
     */
    sanarPartes(x) {
        //se filtran las partes que tengan daño
        console.log("sanar partes:"+x);
        let dañadas = this.localizaciones.filter(l => l.darDaño() > 0);
        //Las más dañadas primero (con respecto a los pg que tiene)
        console.log(dañadas.sort((a, b) => (b.daño / b.pg) - (a.daño / a.pg)));

        var curar = x;
        // for(let i=0; curar>0;i++){
        //     curar=dañadas[i].sanar(curar);
        // }
        dañadas.forEach(d => {
            if (curar > 0)
                //se actualiza con lo que queda tras curar la localización
                curar = d.sanar(curar);
        });

        console.log(this.localizaciones);
        return curar;

    }

    /**
    * Daña una localizacion
    *
    * @param {number} pg PG de daño
    * @param {number|string} localizacion el numero de tirada o el nombre de una localización
    * @memberof Localizacion
    */
    dañarLocalizacion(pg, localizacion) {
        this.darLocalizacion(localizacion).dañar(pg);
    }

    /**
     *Devuelve el daño de las sublocalizaciones
     * 
     * @returns el daño local si esFinal() o el
     *          total de las sublocalizaciones
     * @link esFinal()
     * @see {@link esFinal()}
     * @memberof Localizaciones
     */
    darDaño() {
        if (this.esFinal()) return this.daño;
        let total = 0;
        this.localizaciones.forEach(l => {
            total += l.darDaño()
        });
        return total;
    }

    //TESTEO
    todasLocalizacionesTest() {
        //se busca el más bajo y más alto
        let min = Math.min(...this.localizaciones.map(f => f.min))
        let max = Math.max(...this.localizaciones.map(f => f.max))
        console.log(`Probando ${min}-${max}`);

        //Probar que hay una localización para cada posible tirada
        for (var index = min; index <= max; index++) {
            if (!this.darLocalizacion(index)) return false;
            console.log(index + " true");
        }
        return true;
        // Math.min(...data.map(f=>f.rest) )
    }

/**
 * Devuelve un array con todas las localizaciones finales
 */
    todas(lista){
        if(!lista) lista =[]
        if (this.esFinal()) lista.push( this)
        else this.localizaciones.forEach(l => {
            l.todas(lista);
        });

        return lista;
    }


    todosNombres(lista,finales=true){
        if(!lista) lista =[]
        if (this.esFinal()) lista.push( this.nombre)
        else this.localizaciones.forEach(l => {
            l.todosNombres(lista);
        });

        return lista;
    }

    todosDaños(lista,finales=true){
        if(!lista) lista =[]
        if (this.esFinal()&& this.darDaño() > 0) lista.push( this)
        else this.localizaciones.forEach(l => {
            l.todosDaños(lista);
        });

        if (lista.length>0)
        lista.sort((a, b) => (b.daño / b.pg) - (a.daño / a.pg))
        // console.log(lista.sort((a, b) => (b.daño / b.pg) - (a.daño / a.pg)))

        return lista;
    }


}



/**
 * La clase de cada localización concreta
 *
 * @class Localizacion
 */
class Localizacion extends Localizaciones {
    /**
     *Creates an instance of localizacion.
     * @param {string} nombre el nombre de la localización
     * @param {number} mpg el multiplicador de PG de la localización Ej: 0.25, 3.33, 0.4
     * @param {number} min el valor minimo de tirada para esa localización
     * @param {number} max el valor máximo de tirada para esa localización
     * @param {number} [pa=0] los puntos de armadura naturales
     * @param {number} [x=null] coordenada x de la imagen Body
     * @param {number} [y=null] coordenada y de la imagen Body
     * @memberof Localizacion
     */
    constructor(nombre, mpg, min, max, pa = 0,x=null,y=null) {
        super();
        this.nombre = nombre;
        this.mpg = mpg;
        this.pa = pa;
        this.min = min;
        this.max = max;
        this.daño = 0;
        this.pg;//??
        this.x=x;
        this.y=y;
    }

    /**
     * Devuelve el nombre completo
     * @returns {String} El nombre sin abreviaturas
     */
    nombreLargo(){
        var largo=
        this.nombre.replace(' Inf ', ' Inferior' ).replace(' Sup ', ' Superior ') //.replace('Sup ', 'Superior ')
        if (largo.endsWith('D')) {
            largo+='erecha'
            
        } else {
            if (largo.endsWith('I')) {
                largo+='zquierda'
            }
            
        }

    //Reemplazo las abreviaturas
    // var e = / Inf /;
    // l = l.replace(e, " Inferior ");

    // e = / Sup /;
    // l = l.replace(e, " Superior ");

    // e = /I$/;
    // l = l.replace(e, "Izquierda");

    // e = /D$/;
    // l = l.replace(e, "Derecha");

        return largo;
    }


    /**
     * Da coordenadas para la localizacion
     * en estilo area de HTML
     * @param {*} coords coordenadas
     * @param {*} shape forma (rect, circle, poly)
     * @memberof Localizacion
     */
    setCoordenadas(coords, shape) {
        this.coords = coords;
        this.shape = shape;
    }
    /**
     *Si hay coordenadas para la localizacion
     *
     * @returns Boolean si hay coordenadas
     * @memberof Localizacion
     */
    isCoordenadas() {
        return (this.coords && this.shape)
    }

    getCoords() {
        return this.coords;
    }
    getShape() {
        return this.shape;
    }

    /**
     * Pone los PG dependiendo de los de la localizacion padre
     * o el animal
     *
     * @param {number} x
     * @memberof Localizacion
     */
    setPG(x) {
        //TODO: dejar en int?
        this.pg = Math.round(x * this.mpg);
        // this.pg = (x * this.mpg);
        if(!this.esFinal())
        this.localizaciones.forEach(loc => {
            // console.log(loc.nombre+":"+this.pg);
            loc.setPG(this.pg);
        });
    }

    /**
     *Daña la localización
     *
     * @param {number} daño PG de daño
     * @param {Boolean} armadura si se cuenta la armadura natural, por defecto true
     * @memberof Localizacion
     */
    dañar(daño,armadura=true) {
        //se le resta la armadura natural al daño
        var d = daño;
        if(armadura) d = daño - this.pa;
        if (d <= 0) return; //Si 0 o negativa sale
        this.daño += d; //si no se suma al daño
    }

    /**
 *Es distinto al sanar de Localizaciones porque no cura generales
 *
 * @param {number} x Los puntos que cura
 * @returns {number} los puntos de curación que sobran tras curar la localización
 * @memberof Localizacion
 */
    sanar(x) {
        console.log("Cura con" + x + "el " + this.nombre);

        if (this.esFinal()) {
            let curacion = this.daño - x
            this.daño = (curacion < 0) ? 0 : curacion;
            console.log("Quedan de curacion:" + (-curacion));

            return -curacion; //para que lo que sobra sea positivo
        }
        else
            return this.sanarPartes(x);

    }

}




// var humanoide = new Localizaciones();

//Localizaciones de RQ normales

// humanoide.add(new Localizacion("Right Arm", 0.33, 01, 04, 0))
// humanoide.add(new Localizacion("Left Arm", 0.33, 05, 08, 0))
// humanoide.add(new Localizacion("Abdomen", 0.33, 09, 11, 0))
// humanoide.add(new Localizacion("Chest", 0.33, 12, 12, 0))
// humanoide.add(new Localizacion("Right Leg", 0.33, 13, 15, 0))
// humanoide.add(new Localizacion("Left Leg", 0.33, 16, 18, 0))
// humanoide.add(new Localizacion("Head", 0.1, 19, 20, 0))


//Manteniendo junta toda la localización
// var cabeza=  new Localizacion("Cabeza"	        ,1, 1,  9, 0)
// var brazoD= new Localizacion("Brazo D"	        ,1, 10,	26,0)
// var brazoI= (new Localizacion("Brazo I"	        ,1, 27,	43,0))
// //TODO:Habría que hacer subLocalización
// var pecho=  (new Localizacion("Pecho"	        ,1, 44,	58,0))

// var abdomen=(new Localizacion("Abdomen"	        ,1, 59,	72,0))
// var piernaD=(new Localizacion("Pierna D"	    ,1, 73,	86,0))
// var piernaI=(new Localizacion("Pierna I"	    ,1, 87,	100,0))

// cabeza.add(new Localizacion("Craneo"	        ,1, 1	,4, 0))
// cabeza.add(new Localizacion("Cara"	            ,1, 5	,7, 0))
// cabeza.add(new Localizacion("Cuello"	        ,1, 8	,9, 0))

// brazoD.add(new Localizacion("Hombro D"	        ,1, 10	,13,0))
// brazoD.add(new Localizacion("Biceps D"	        ,1, 14	,18,0))
// brazoD.add(new Localizacion("Antebrazo D"	    ,1, 19	,23,0))
// brazoD.add(new Localizacion("Codo D"	        ,1, 24	,24,0))
// brazoD.add(new Localizacion("Mano D"	        ,1, 25	,26,0))

// brazoI.add(new Localizacion("Hombro I"	        ,1, 27	,30,0))
// brazoI.add(new Localizacion("Biceps I"	        ,1, 31	,35,0))
// brazoI.add(new Localizacion("Antebrazo I"	    ,1, 36	,40,0))
// brazoI.add(new Localizacion("Codo I"	        ,1, 41	,41,0))
// brazoI.add(new Localizacion("Mano I"	        ,1, 42	,43,0))

// abdomen.add(new Localizacion("Vientre"	        ,1, 59	,65,0))
// abdomen.add(new Localizacion("Cadera D"	        ,1, 66	,68,0))
// abdomen.add(new Localizacion("Ingle"	        ,1, 69	,69,0))
// abdomen.add(new Localizacion("Cadera I"	        ,1, 70	,72,0))

// piernaD.add(new Localizacion("Muslo Superior D"	,1, 73	,77,0))
// piernaD.add(new Localizacion("Muslo Inferior D"	,1, 78	,80,0))
// piernaD.add(new Localizacion("Rodilla D"	    ,1, 81	,81,0))
// piernaD.add(new Localizacion("Pierna Inf D"	    ,1, 82	,85,0))
// piernaD.add(new Localizacion("Pie D"	        ,1, 86	,86,0))

// piernaI.add(new Localizacion("Muslo Superior I"	,1, 87	,91,0))
// piernaI.add(new Localizacion("Muslo Inferior I"	,1, 92	,94,0))
// piernaI.add(new Localizacion("Rodilla I"	    ,1, 95	,95,0))
// piernaI.add(new Localizacion("Pierna Inf I"	    ,1, 96	,99,0))
// piernaI.add(new Localizacion("Pie I"	        ,1, 100	,100,0))

// humanoide.add(cabeza);
// humanoide.add(brazoD);
// humanoide.add(brazoI);
// humanoide.add(pecho);
// humanoide.add(abdomen);
// humanoide.add(piernaD);
// humanoide.add(piernaI);


// humanoide.add(new Localizacion("Cabeza"	        ,1, 1,  9, 0))
// humanoide.add(new Localizacion("Brazo D"	        ,1, 10,	26,0))
// humanoide.add(new Localizacion("Brazo I"	        ,1, 27,	43,0))
// humanoide.add(new Localizacion("Pecho"	        ,1, 44,	58,0))
// humanoide.add(new Localizacion("Abdomen"	        ,1, 59,	72,0))
// humanoide.add(new Localizacion("Pierna D"	        ,1, 73,	86,0))
// humanoide.add(new Localizacion("Pierna I"	        ,1, 87,	100,0))


// humanoide.add(new Localizacion("Craneo"	            ,1, 1	,4, 0))
// humanoide.add(new Localizacion("Cara"	            ,1, 5	,7, 0))
// humanoide.add(new Localizacion("Cuello"	            ,1, 8	,9, 0))

// humanoide.add(new Localizacion("Hombro D"	        ,1, 10	,13,0))
// humanoide.add(new Localizacion("Biceps D"	        ,1, 14	,18,0))
// humanoide.add(new Localizacion("Antebrazo D"	    ,1, 19	,23,0))
// humanoide.add(new Localizacion("Codo D"	            ,1, 24	,24,0))
// humanoide.add(new Localizacion("Mano D"	            ,1, 25	,26,0))
//TODO:Habría que hacer subLocalización
// humanoide.add(new Localizacion("Pectoral"	        ,1, 44	,58,0))

// humanoide.add(new Localizacion("Vientre"	        ,1, 59	,65,0))
// humanoide.add(new Localizacion("Cadera D"	        ,1, 66	,68,0))
// humanoide.add(new Localizacion("Ingle"	            ,1, 69	,69,0))
// humanoide.add(new Localizacion("Cadera I"	        ,1, 70	,72,0))

// humanoide.add(new Localizacion("Muslo Superior D"	,1, 73	,77,0))
// humanoide.add(new Localizacion("Muslo Inferior D"	,1, 78	,80,0))
// humanoide.add(new Localizacion("Rodilla D"	        ,1, 81	,81,0))
// humanoide.add(new Localizacion("Pierna Inf D"	    ,1, 82	,85,0))
// humanoide.add(new Localizacion("Pie D"	            ,1, 86	,86,0))


// humanoide.add(new Localizacion("Hombro I"	        ,1, 27	,30,0))
// humanoide.add(new Localizacion("Biceps I"	        ,1, 31	,35,0))
// humanoide.add(new Localizacion("Antebrazo I"	    ,1, 36	,40,0))
// humanoide.add(new Localizacion("Codo I"	            ,1, 41	,41,0))
// humanoide.add(new Localizacion("Mano I"	            ,1, 42	,43,0))

// humanoide.add(new Localizacion("Muslo Superior I"	,1, 87	,91,0))
// humanoide.add(new Localizacion("Muslo Inferior I"	,1, 92	,94,0))
// humanoide.add(new Localizacion("Rodilla I"	        ,1, 95	,95,0))
// humanoide.add(new Localizacion("Pierna Inf I"	    ,1, 96	,99,0))
// humanoide.add(new Localizacion("Pie I"	            ,1, 100	,100,0))


// humanoide.add(new Localizacion("Cara"	            ,1, 5,  7, 0))
// humanoide.add(new Localizacion("Craneo"	            ,1, 1,  4, 0))
// humanoide.add(new Localizacion("Cuello"	            ,1, 8,  9, 0))
// humanoide.add(new Localizacion("Hombro D"	        ,1, 10,	13,0))
// humanoide.add(new Localizacion("Biceps D"	        ,1, 18,	22,0))
// humanoide.add(new Localizacion("Antebrazo D"	    ,1, 30,	34,0))
// humanoide.add(new Localizacion("Codo D"	            ,1, 28,	28,0))
// humanoide.add(new Localizacion("Mano D"	            ,1, 40,	41,0))
// humanoide.add(new Localizacion("Pectoral"	        ,1, 44,	58,0))
// humanoide.add(new Localizacion("Vientre"	        ,1, 59,	65,0))
// humanoide.add(new Localizacion("Cadera D"	        ,1, 66,	68,0))
// humanoide.add(new Localizacion("Ingle"	            ,1, 69,	69,0))
// humanoide.add(new Localizacion("Muslo Superior D"	,1, 73,	77,0))
// humanoide.add(new Localizacion("Muslo Inferior D"	,1, 83,	85,0))
// humanoide.add(new Localizacion("Rodilla D"	        ,1, 89,	89,0))
// humanoide.add(new Localizacion("Pierna Inf D"	    ,1, 91,	94,0))
// humanoide.add(new Localizacion("Pie D"	            ,1, 99,	99,0))

// //Izquierda
// humanoide.add(new Localizacion("Hombro I"	        ,1, 14	,17,0))
// humanoide.add(new Localizacion("Biceps I"	        ,1, 23	,27,0))
// humanoide.add(new Localizacion("Antebrazo I"	    ,1, 35	,39,0))
// humanoide.add(new Localizacion("Codo I"	            ,1, 29	,29,0))
// humanoide.add(new Localizacion("Mano I"	            ,1, 42	,43,0))
// humanoide.add(new Localizacion("Cadera I"	        ,1, 70	,72,0))
// humanoide.add(new Localizacion("Muslo Superior I"	,1, 78	,82,0))
// humanoide.add(new Localizacion("Muslo Inferior I"	,1, 86	,88,0))
// humanoide.add(new Localizacion("Rodilla I"	        ,1, 90	,90,0))
// humanoide.add(new Localizacion("Pierna Inf I"	    ,1, 95	,98,0))
// humanoide.add(new Localizacion("Pie I"	            ,1, 100	,100,0))






// console.log(humanoide.darLocalizacion(1))
// var l16 = humanoide.darLocalizacion(16);
// humanoide.dañarLocalizacion(5, 20);
// humanoide.dañarLocalizacion(2, 12);
// humanoide.dañarLocalizacion(14, 15);
// humanoide.dañarLocalizacion(1, 11);
// humanoide.dañarLocalizacion(6, 1);

// console.log(humanoide.darLocalizacion("Rodilla I"));




// console.log(humanoide.darLocalizacion(7))
// console.log(humanoide.darLocalizacion(16))
// console.log(humanoide.darLocalizacion(20))

// console.log(humanoide.esFinal());

var removeItemFromArr = ( arr, item ) => {
    var i = arr.indexOf( item );
    i !== -1 && arr.splice( i, 1 );
};

function dartodasLocalizaciones(personaje,...excepciones) {
    let todas = 
    personaje.cuerpo.todosNombres();
    excepciones.forEach(e => {
        removeItemFromArr(todas,e)
    });
    return todas;
    
}

