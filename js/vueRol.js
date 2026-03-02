// var chaleco = new Pieza(["Pecho", "Abdomen"], 3);
    // var vestidoDragon = new Armadura(
    //   [new Pieza(dartodasLocalizaciones(pj, 'Craneo', 'Cara', 'Pie I', 'Pie D', 'Mano I', 'Mano D'), 7),
    //     chaleco]
    // );



    var fh=null;

    // Agregar función para obtener parámetros de la URL
    function getUrlParameter(name) {
      const params = new URLSearchParams(window.location.search);
      return params.get(name);
  }

    function cuerpoModal(rol) {
        let p = null;
        if (rol === "PNJ")
          p = pnj[$('#nombreEnemigo').val()]
        else
          p = pj;
  
        console.log('rol:' + rol);
        let canvas = document.getElementById('canvas');
        let h = alto();
        let zoomCuerpo = h / 1000 * 0.95;
        canvas.width = 500 * zoomCuerpo;
        canvas.height = 1000 * zoomCuerpo;
        p.cuerpoDaño("canvas", zoomCuerpo);
  
      }
  
      cuerpoModal();
      // cuerpoDaño('canvas');
  
  
      new Vue({
        el: '#app',
        vuetify: new Vuetify({
          theme: {
            dark: true,
          },
        }),
  
        // computed: {
        //   pm: {
        //     get: function () {
        //       //round or truncate
        //       // return Math.round(pj.PM)
        //       return Math.trunc(pj.PM)
        //     },
        //     set: function (newValue) {
        //       pj.PM = newValue
        //     }
        //   }
        // },
        methods: {
  
          act(fecha = true) {
            if (fecha) this.date = fechaMundo.fechahora()
            if (pj.fecha) {
              console.log("actualizao fecha");
              fechaMundo = new Date(pj.fecha);
              this.date = fechaMundo.fechahora()
            }
  
            pj.act();
            this.p = pj;
  
            let lastContenedor = this.contenedor;
            console.log(lastContenedor);
            let contenedores = pj.inventario.darClaseRecursiva(Contenedor)
            let encontrado = false;
            console.log(lastContenedor.nombre, this.contenedor.nombre);
            if (contenedores.length > 0) {
              contenedores.forEach(c => {
                if (c.nombre == lastContenedor.nombre) {
                  this.contenedor = c;
                  encontrado = true;
                  console.log("mismo contenedor encontrado");
                }
  
              });
              console.log(pj.inventario.darClaseRecursiva(Contenedor));
  
            }
            if (!encontrado)
              this.contenedor = pj.inventario;
            console.log('ACT');
  
          },
          //METODOS DE GUARDAR
          save() {
            console.log('Data saved')
  
          },
          cancel() {
            console.log('Dialog closed')
          },
          cargarOnline(nombre) {
            try {
              let ruta = `personajes/${nombre}/`;
              // console.log("CARGAR RUTA:" + ruta);
  
              fbActual = database.ref(ruta);
  
              // si lo hago así es menos eficiente,
              // porque siempre que haya un cambio
              // donde sea me, va a cargar el personaje entero
              fbActual.on('value', function (item) {
                console.log("onvalue personaje VUE" + item.val().nombre);
  
                let nuevo = item.val();
                if (nuevo.clase) {
                  // pj =  new Humanoide({});
                  pj = Clase.convertir(item.val())
                }
                else
                  pj = new Humanoide({});
                // pj = new Animal({});
                pj.setAll(item.val());
  
                pj.act();
                this.p = pj;
  
                document.title = pj.nombre;
                this.nombrePersonaje = pj.nombre;
                console.log("CARGADO:" + this.nombrePersonaje);
                
                //TODO: ver si es necesario, act() no funciona desde aquí
                document.getElementById('loadOnline').click()
  
  
              });
  
            } catch (error) {
              console.log("ERROR EN CARGA ONLINE");
              alert("ERROR EN CARGA ONLINE")
  
            }
  
          },
          close() {
            console.log('Dialog closed')
          },
  
          clickHabilidad(item, row) {
  
            if (document.getElementById('iH')) {
              document.getElementById('iH').h = item;
              this.dialogoHabilidad = true;
            }
            else {
              this.dialogoHabilidad = true;
              //espero que se cargue
              setTimeout(function () {
                this.dialogoHabilidad = false;
                document.getElementById('iH').h = item;
                this.dialogoHabilidad = true;
              }, 1);
            }
            // this.dialogoHabilidad=true;
  
          },
  
          clickSubir(item, row) {
            // console.log('row clicked', item);
            if (document.getElementById('iS')) {
              document.getElementById('iS').h = item;
              this.dialogoSubir = true;
            }
            else {
              this.dialogoSubir = true;
              //espero que se cargue
              setTimeout(function () {
                this.dialogoSubir = false;
                document.getElementById('iS').h = item;
                this.dialogoSubir = true;
              }, 1);
            }
          },
  
  
          cambiarTiro() {
            document.getElementById('sliderMetros').setAttribute('max', '9999');
          },
  
          // Inventario
          unir(array) {
            var o = array[0];
            if (o instanceof Objetos && o.ctd) {
              return o.unir(array.slice(1));
            } else return false;
          },
  
          // direccion subir -1 , bajar +1
          moverItems(array, obj, dir = -1) {
            array.splice(array.indexOf(obj) + dir, 0,
              array.splice(array.indexOf(obj), 1)[0])
  
          },
  
          arribaItems() {
  
            this.selected.sort((a, b) => this.contenedor.objetos.indexOf(a) - this.contenedor.objetos.indexOf(b)).reverse()
              .forEach(element => { this.contenedor.sacar(element); this.contenedor.add(element, 0) });
  
          },
  
          abajoItems() {
  
            this.selected.sort((a, b) => this.contenedor.objetos.indexOf(a) - this.contenedor.objetos.indexOf(b))
              .forEach(element => { this.contenedor.sacar(element); this.contenedor.add(element) });
  
          },
  
          // moverItem(array, dir=-1 ) {
          //   array.splice(array.indexOf(this.selected[0]) +dir, 0,
          //                             array.splice(array.indexOf(this.selected[0]), 1)[0])
  
          // },
  
          parseStringToFunction(func) {
  
            // console.log(func);
            if (!func || func.length < 1) return undefined;
            if ((func.includes("=>")))
              return (new Function('return ' + func)());
            else
              return (new Function('return ' + 'obj=>obj.' + func)());
          },
  
          tirada() {
            return this.habilidadFiltro.tirada(this.dado);
          },
  
          copiarHechizo(obj) {
            console.log("COPIA HECHIZO");
  
            // this.copiaHechizo = new Hechizo();
            // this.copiaHechizo.setAll(obj);
            // this.copiaHechizo.valor += 10;
            // console.log(this.copiaHechizo);
  
            this.iHechizo = this.hechizo.iu();
            console.log(this.iHechizo);
          },
  
          // IU
  
          //TODO:
          darTooltip(c, habilidad = false, ah = 'v') {
  
            let html = "";
            if (c) {
  
              if (habilidad) {
                for (const key in pj.habilidades[c].mods[ah]) {
                  let valor = pj.habilidades[c].mods[ah][key];
                  // let color=valor>0?'green':'red';
                  let color = pj.habilidades[c][ah] < pj.habilidades[c].total(ah) ? 'green' : 'red';
                  html += `${key}: <b style="color: ${color}"> ${valor.op} ${valor.ctd} </b><br>`
                }
  
              }
              else
                for (const key in pj.getMod(c)) {
                  let valor = pj.getMod(c)[key];
                  // let color=valor>0?'green':'red';
                  let color = pj.getCar(c) > pj[c] ? 'green' : 'red';
                  html += `${key}: <b style="color: ${color}">${c} ${valor.op} ${valor.ctd} </b><br>`
                }
  
            }
            else {
              for (const key in pj.listaMods) {
                let mod = pj.listaMods[key];
                // let color=valor>0?'green':'red';
                let color = pj.getCar(c) > pj[c] ? 'green' : 'red';
                html += `${key}: <b style="color: ${color}">${pj.listaMods[key].efectos}  </b><br>`
              }
  
            }
  
            return html;
  
            // return pj.getModTotal(c);
  
          },
  
          iuHechizo() {
            //  let dv= document.getElementById('divHechizo');
            //  let ih = new InputHechizo(this.copiaHechizo,true);
  
  
            //  let ia = new InputArte(this.copiaHechizo,true);
            //  ia.setPersonaje(pj);
            //  ia.setHabilidad(pj.getHabilidad('Intensidad'));
  
            //  ih.setPersonaje(pj);
            //  ih.setHabilidad(this.copiaHechizo);
            //  ih.setArte(ia);
            //  dv.appendChild(ia);
  
            // dv.appendChild(btn);
            //  dv.appendChild(ih);
            IUHechizos(pj, 'divHechizo', true);
  
  
          },
  
          abrir(contenedor, index) {
            if (contenedor instanceof Contenedor) {
              // console.log(contenedor);
  
              if (index || index == 0) {
                this.abiertos.splice(index);
              } else {
                this.abiertos.push(this.contenedor)
              }
  
              this.contenedor = contenedor;
  
            }
          },
  
          anterior(contenedor) {
            if (this.abiertos.length > 0) {
              this.contenedor = this.abiertos.pop()
  
            }
          },
  
          interpolarColor(val, invert = false) {
  
            if (val > 100) {
              val = 100;
            }
            else if (val < 0) {
              val = 0;
            }
  
            if (!invert) val = 100 - val;
  
            var r = Math.floor((255 * val) / 100),
              g = Math.floor((255 * (100 - val)) / 100),
              b = 0;
            return "rgb(" + r + "," + g + "," + b + ")"
          },
  
          redGreenColor(percent, invert = false) {
  
            if (percent > 100) { percent = 100; }
            else if (percent < 0) { percent = 0; }
  
            if (!invert) percent = 100 - percent;
  
            var r, g, b;
  
            if (percent < 50) {
              // green to yellow
              r = Math.floor(255 * (percent / 50));
              g = 255;
  
            } else {
              // yellow to red
              r = 255;
              g = Math.floor(255 * ((50 - percent % 50) / 50));
            }
            b = 0;
  
            return "rgb(" + r + "," + g + "," + b + ")"
          },
  
          shadow(pm, capacidad = 10) {
            return `text-shadow: 0px 0px ${pm}px ${this.redGreenColor(pm / capacidad * 100)};`
          }
  
          ,
          interColor(min, max, inverso = false) {
            let p = min / max;
            if (inverso) p = 1 - p;
            p = p * 100;
  
            if (p > 78) return 'green'
            else if (p < 10) return 'red'
            else if (p < 40) return 'orange'
            else if (p > 50) return 'inherit'
            else return ''
  
          },
  
          getColor(v) {
            if("string"==typeof v){
              if(v.startsWith("+")) return 'green'
               if(v.startsWith("-")) return 'red'
            }
              
            if (v > 100) return 'green'
            else if (v < 10) return 'red'
            else if (v < 40) return 'orange'
            else if (v > 50) return 'inherit'
            else return ''
          },
  
          subirSort(items, index, isDesc) {
            console.log(index, isDesc);
            items.sort((a, b) => {
              // console.log(index[0]);
              if (index[0] === "sub") {
                // return a.subible() - b.subible()
                return a.subible() - b.subible()
              } else
                if (index[0] === "t") {
                  // return a.subible() - b.subible()
                  return a.total() - b.total();
                } else {
                  return a[index[0]] < b[index[0]] ? -1 : 1;
                }
            });
  
            if (isDesc[0]) return items.reverse()
            return items;
          },
  
  
          editar(objeto) {
            // console.log("Editar:"+objeto );
            //   const keys = Object.keys(objeto);
            //   const values = Object.values(objeto);
  
            //   var editor = document.getElementById("editor");
            //   editor.innerHTML = ""; //clear editor
            //   var id = -1;
            //   var k = -1
            //   var v = -1;
            //   for (i = 0; i < keys.length; i++) {
            //     if (i == 0) id = values[i];
            //     k = keys[i];
            //     v = values[i];
  
            //     console.log(k + " ->" + v)
  
            //     editor.innerHTML = editor.innerHTML + ' <b>' + k.toUpperCase() + ':</b>' +
            //       `<input data-toggle="tooltip"  id="edit${k}" value='${v}'' title="${k}" ><br>`
            //     // '<input data-toggle="tooltip"  id="edit' + keys[i] + '" value=' + values[i] + ' title=' + keys[i] + ' ><br>';
            //     //Probar con forms
  
            //   }
            //   editor.innerHTML = editor.innerHTML + `<button type="button" class="btn btn-success" onclick="guardarObjeto()">Guardar</button>`
            var editor = document.getElementById("editor");
            editor.innerHTML = "";
            editor.appendChild(new InputCustom(objeto));
          }
  
  
        },
  
  
        //TODO: editar los objetos con el modal
  
        watch: {
          value(val) {
            this.selectedHeaders = val;
            console.log(val);
          },
  
          date(val) {
            fechaMundo = new Date(val);
            console.log(val);
          },
  
          // valColHab(v) {
          //   this.colHabSel = v;
  
          // },
  
        },
        created() {
          this.selectedHeaders = this.headerInventario;
          // this.colHabSel = this.colHab;
          this.colHabSel = this.headers;
          console.log(this.selectedHeaders);

          // Si en la URL se pasa el parámetro "pj", intenta cargar ese personaje
          const urlCharacter = getUrlParameter('pj');
          if (urlCharacter) {
            if (window.firebase && window.database) {
              // Cargar desde Firebase
              this.cargarOnline(urlCharacter);
              console.log("Cargando personaje de Firebase de inicio:", urlCharacter);
              
            } else {
              // Si Firebase no está disponible o falla, usar función local de utils.js
              cargarPersonajeLocalParecido(urlCharacter)
                .then(character => {
                  pj = character;
                  this.p = pj;
                  document.title = pj.nombre;
                })
                .catch(err => console.error("Error cargando personaje local:", err));
            }
          }
          //parametro buscar inventario
          const bi=getUrlParameter('bi');
          if(bi){
            this.tab='Inventario';
            this.search= bi;
            this.panelInventario=0;
          }
          //parametro buscar habilidad
          const bh=getUrlParameter('bh');
          if(bh){
            this.tab='Habilidades';
            this.search= bh;
            this.panelHabilidades=0;
          }


        },
        data: {
          panelInventario: null, // Agregar esta línea
          panelHabilidades: null, 
          filtroSubir: x=> x.subible()<100,
           filtroTecnica: x=> x instanceof Tecnica,
           filtroHabilidadMarcial: x=> x.clase=="HabilidadMarcial",
           filtroHechizo: x=> x instanceof Hechizo,
           filtroTecnica: x=> x instanceof Tecnica,
           fh:null,
          hora: "07:00",
          date: fechaMundo.fechahora(),
          menu1: false,
          dialogoHabilidad: false,
          dialogoSubir: false,
          //drawer
          drawer: false,
          group: null,
          tab: 'Personaje',
  
          //fab
          fab: false,
  
          expanded: [],
          singleExpand: false,
          verBuscar: false,
          search: '',
          abiertos: [],
          max25chars: v => v.length <= 25 || 'Nombre largo',
          headers: [
            {
              text: 'Nombre ',
              align: 'start',
              groupable: false,
              value: 'nombre',
              width: "auto"
            },
  
            { text: 'XP', value: 'xp', groupable: false, width: "8%" },
            // { text: 'Categoria', value: 'tipo' },
            // { text: 'Clase', value: 'clase' },
            { text: 'Valor', value: 'valor', groupable: false },
            {
              text: 'Total', value: "t", groupable: false,
              // sort: function(a, b) {
              //   console.log('orden'+a.total()- b.total());
              //       return a.total()- b.total();
              //   // implement custom compare function here
              // },sortable: true
            },
            // { text: 'E', value: 'especial', groupable: false },
            // { text: 'C', value: 'critico', groupable: false },

            //PARA poder buscar por nmbre de clase
            { text: 'Clase', value: 'clase', align: ' d-none' }, // ' d-none' hides the column but keeps the search ability
            { text: 'Tipo', value: 'tipo', align: ' d-none' }, // ' d-none' hides the column but keeps the search ability
            { text: 'Subir', value: 'sub', groupable: false },
            { text: '', value: 'data-table-expand', groupable: false, width: "5%" },
          ],
  
          colHab: [
            {
              text: 'Nombre ',
              align: 'start',
              groupable: false,
              value: 'nombre',
              width: "auto"
            },
  
            { text: 'XP', value: 'xp', groupable: false, width: "8%" },
            // { text: 'Categoria', value: 'tipo' },
            // { text: 'Clase', value: 'clase' },
            { text: 'Valor', value: 'valor', groupable: false },
            { text: 'Porcentaje', value: "porcentaje", groupable: false },
            { text: 'E', value: 'especial', groupable: false },
            { text: 'C', value: 'critico', groupable: false },
  
          ],
          headerInventario: [
            {
              text: 'Nombre ',
              align: 'start',
              groupable: false,
              value: 'nombre'
            },
  
            { text: 'Ctd', value: 'ctd', groupable: false },
            // { text: 'Categoria', value: 'tipo' },
            { text: 'Clase', value: 'clase' },
            { text: 'Peso', value: 'peso', groupable: false },
            { text: 'Valor', value: 'valor', groupable: false },
  
          ],
          p: pj,
  
          nombrePersonaje: '',
          nombrePersonajeOnline: '',
          ct: constante,
          contenedor: pj.inventario,
          hechizo: new Hechizo('Hechizo'),
          iHechizo: new iuHechizo(this.hechizo),
          // picker: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10),
          date: fechaMundo.fechahora(),
          dialog: false,
          hidden: false,
          selected: [],//inventario selected
          filtro: "",
          habilidadFiltro: new Habilidad(),
          ifHabilidadFiltro: false,
          arma: new Arma(),
          habilidadDistancia: new HabilidadDistancia(),
          armaDistancia: new ArmaDistancia(),
          municion: new Municion(),
          daño: [],
          dañoDistancia: [],
          distancia: 0,
          dado: 100,
          iuDaño: { dado: 0, daño: [] },
          dadoDaño: 0,
          dadoDañoDistancia: 0,
          d100: new Dado('1d100'),
          copiaHechizo: new Hechizo(),
          artes: [],
          value: [],
          colHabSel: [],
          selectedHeaders: [],
  
          sliderSeparar: 0,
  
          sheet: false, //bottom sheet mover
          contenedorMover: null,
  
          //GENERAL,
          // arrayHeaders:["nombre"],
          // arrayItems:pj.inventario.objetos,
  
        }
      })

