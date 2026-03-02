

//se busca si se pasa algún personaje como parámetro url
// console.log("secreto->"+${{ secrets.NOMBRE_SECRETO }});

let s = location.search
const url = new URL(location);
const personaje = url.searchParams.get('pj')
console.log("PERSONAJE:" + personaje);
// si lo hay se carga
if (personaje) {
  $("#nombre").val(personaje);
  //TODO: Añadir a la lista?
  cargarPersonaje(personaje);
}

// el select guay
$('select').selectpicker();
var colAntes, colDespues;


$('select').on('show.bs.select', function (e) {
  // console.log("aparece "+$('select').val());
  colAntes = $('select').val()
});

//para tabla habilidades
$('#columnas').on('hidden.bs.select', function (e) {
  // console.log("se esconde "+$('#columnas').val());
  colDespues = $('#columnas').val()
  // console.log(colAntes+"->"+colDespues);

  if (colAntes.join(',') == colDespues.join(',')) return; //si son iguales no hago nada
  // si no son iguales vuelvo a cargar con las nuevas columnas
  tablaHabilidades();
});

$('#colInventario').on('hidden.bs.select', function (e) {
  // console.log("se esconde "+$('#columnas').val());
  colDespues = $('#colInventario').val()
  // console.log(colAntes+"->"+colDespues);

  if (colAntes.join(',') == colDespues.join(',')) return; //si son iguales no hago nada
  // si no son iguales vuelvo a cargar con las nuevas columnas
  cargarContenedor();
});


//actualizar los puntos al cambiarlos en el editor

// PUNTOS.forEach(pt => {
//   $('#i' + pt).change(function () {
//     pj[pt] = parseInt($(this).val());
//     pj.save();
//   });
// });

PUNTOS.forEach(pt => {
  document.getElementById('i' + pt).addEventListener('change', (event) => {
    pj[pt] = parseInt(event.target.value);
    pj.save();
  });
});

// $('#iPG').change(function () {
//   pj[PG] = parseInt($(this).val());
//   pj.save();
// });

// $('#iPF').change(function () {
//   pj[PF] = parseInt($(this).val());
//   pj.save();
// });

// $('#iPM').change(function () {
//   pj[PM] = parseInt($(this).val());
//   pj.save();
// });

var copiado = [];
var selected = [];
var nav = [];



// $('#columnas').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
//   // do something...
//   // console.log($('#columnas').val());
// });

//buscar en habilidades
//Buscar en la tabla
$("#buscar").on("keyup", function () {

  var value = $(this).val().toLowerCase();
  //si empieza con > o <
  if (value.startsWith(">") || value.startsWith("<")) {
    var limit = parseFloat(value.substring(1));
    var signo = value[0];
    console.log("SIGNO;" + signo);

    $("#tbHab tr").filter(function () {
      var bool = false
      console.log($(this).html());
      var regex = /([0-9]+.)*[0-9]+/g; //la expresion regular para encontrar números en el html de la fila
      var found = $(this).html().match(regex);
      for (let i of found) { //por cada numero encontrado si cumple bool = true
        // console.log(parseInt(i)+":" +value.substring(1)); 
        // if(parseInt(i)>limit){

        if (eval('parseInt(i)' + signo + 'limit')) {
          bool = true;
          break;
        }
      }
      $(this).toggle(bool)
      // else
      // $(this).toggle(false);

    });
  }
  else //si no empieza con comparacion
    $("#tbHab tr").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
    });
});

//buscar en el inventario
$("#buscarObjeto").on("keyup", function () {

  var value = $(this).val().toLowerCase();
  //si empieza con > o <
  if (value.startsWith(">") || value.startsWith("<")) {
    var limit = parseFloat(value.substring(1));
    var signo = value[0];
    console.log("SIGNO;" + signo);

    $("#tbInv tr").filter(function () {
      var bool = false
      // console.log($(this).html());
      var regex = />([0-9]+.)*[0-9]+</g; //la expresion regular para encontrar números en el html de la fila
      var found = $(this).html().match(regex);
      console.log(found);
      for (let i of found) { //por cada numero encontrado si cumple la condición, bool = true
        i = i.replace("<", "").replace(">", "");
        console.log("i:" + i);
        if (eval('parseFloat(i)' + signo + 'limit')) {
          bool = true;
          break;
        }
      }
      $(this).toggle(bool)
    });
  }
  else //si no empieza con comparacion
    $("#tbInv tr").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)//que contenga la cadena
    });
});


//TODO: MIRAR POR QUÉ NO FUNCIONA LO DE ABAJO

// $("#buscar").on("keyup", buscar("#buscar", "tbHab"));
// $("#buscarObjeto").on("keyup", buscar("#buscarObjeto", "tbInv"));

// function buscar(busqueda,tabla) {
//   var value = $(busqueda).val().toLowerCase();
//   //si empieza con > o <
//   if (value.startsWith(">") || value.startsWith("<")) {
//     var limit = parseFloat(value.substring(1));
//     var signo = value[0];
//     console.log("SIGNO;" + signo);

//     $(`#${tabla} tr`).filter(function () {
//       var bool = false
//       // console.log($(this).html());
//       var regex = />([0-9]+.)*[0-9]+</g; //la expresion regular para encontrar números en el html de la fila
//       var found = $(this).html().match(regex);
//       console.log(found);
//       for (let i of found) { //por cada numero encontrado si cumple la condición, bool = true
//       i=i.replace("<","").replace(">","");
//       console.log("i:"+i);
//         if (eval('parseFloat(i)' + signo + 'limit')) {
//           bool = true;
//           break;
//         }
//       }
//       $(this).toggle(bool)
//     });
//   }
//   else //si no empieza con comparacion
//     $(`#${tabla} tr`).filter(function () {
//       $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)//que contenga la cadena
//     });
// }


// if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
//   $('.selectpicker').selectpicker('mobile');
// }


//cargar las habilidades
//TODO: quitar esto??
// for (habilidad in pj.habilidades) {
//   console.log("Cargando las habilidades");

//   var hh = new Habilidad();
//   hh.setAll(habilidad);
//   var row = $('#columnas');
//   let habilidad = pj.getHabilidad(habilidad);

//   for (key of habilidad) {//Esto serían todas
//     row.append($("<option/>").text(habilidad[key]));
//     console.log(habilidad[key]);
//   }
//   row.append($("<td/>").text(habilidad.v));
//   console.log((row));
// }

// BOTONES DE PUNTOS

function actPuntos() {
  $("#btPG").text("/  " + pj.getMaxPuntos(PG));
  $("#btPF").text("/  " + pj.getMaxPuntos(PF));
  $("#btPM").text("/  " + pj.getMaxPuntos(PM));

  $("#iPG").val(pj.getCar(PG));
  $("#iPF").val(pj.getCar(PF));
  $("#iPM").val(pj.getCar(PM));

}


function pMax(puntos) {
  valor = pj.getMaxPuntos(puntos);
  $("#i" + puntos).val(valor);
}


//Poblar con datos
function tablaStats(idTabla = "statsTable") {
  var table = document.getElementById(idTabla);
  clear();

  for (let i in CP) {
    var row = table.insertRow();
    var tipo = row.insertCell(0);
    var cell = row.insertCell(1);
    let hTipo = row.insertCell(2);
    let hValor = row.insertCell(3);

    tipo.innerHTML = '<i data-toggle="tooltip"  id="lb' + CP[i] + '" title=' + CP[i] + '>' + CP[i] + '</i>';
    cell.innerHTML = '<i data-toggle="tooltip" contenteditable="true"  id="' + CP[i] + '" title=' + pj[CP[i]] + '>' + pj.getCar(CP[i]) + '</i>';
    hTipo.innerHTML = '<i data-toggle="tooltip"  id="' + TipoHabilidades[i] + '" title=' + TipoHabilidades[i] + '>' + TipoHabilidades[i] + '</i>';
    hValor.innerHTML = '<i data-toggle="tooltip"  id="' + pj.getCar(TipoHabilidades[i]) + '" title=' + pj[TipoHabilidades[i]] + '>' + pj.getCar(TipoHabilidades[i]) + '</i>';

  }
}


function tablaHabilidades() {
  var visibles = $("#columnas").val();
  // visibles.push(v);
  clear("tbHab");
  for (habilidad in pj.habilidades) {
    let hab = pj.getHabilidad(habilidad);
    objetoTabla(hab, "tbHab", visibles)
  };
}
//haccerlo de otra forma
// function makeTable(container, pj = pj) {
//   // var visibles = [
//   //   "nombre",
//   //   "tipo",
//   //   "valor"
//   // ]
//   var visibles = $("#columnas").val();
//   //creo que las cabeceras de las columnas
//   createHeader(visibles);
//   var table = $("<table/>").addClass("table table-hover");
//   table = $("#tbHab");
//   clear("tbHab");
//   for (habilidad in pj.habilidades) {
//     var hh = new Habilidad();
//     hh.setAll(habilidad);
//     var row = $("<tr/>");
//     var habilidad = pj.getHabilidad(habilidad);

//     for (key of visibles) {//Esto serían todas
//       row.append($("<td/>").text(habilidad[key]));
//       console.log(habilidad[key]);
//     }
//     row.append($("<td/>").html("<b>" + habilidad.v + "</b>"));
//     table.append(row);
//   }
//   // return container.append(table);
// }

function createHeader(visibles, header = "header") {
  var th = document.getElementById(header);
  th.innerHTML = ""; //clear header
  var row = th.insertRow(0);
  for (var i in visibles) {
    var cell = row.insertCell(i);
    cell.innerHTML = '<b>' + visibles[i] + '</b>';
  }
  if (header === "header") {//si es habilidades
    // El total si sale siempre cambiar cuando se aplique tb a inventario
    // a no ser que ponga el peso total
    cell = row.insertCell();
    cell.innerHTML = '<b>' + "TOTAL" + '</b>';
    th.appendChild(row);
  }

}

function seleccionar(objeto) {
  console.log(selected);
  var pos = selected.indexOf(objeto);
  console.log("pos:" + pos);
  if (pos > -1) return; //ya está seleccionado
  selected.push(objeto);
  console.log(selected);
}

function deseleccionar(objeto) {
  var pos = selected.indexOf(objeto);
  console.log("Encontrado en pos:" + pos);
  if (pos > -1) selected.splice(pos, 1);
  console.log(selected);

}


function crearEventos(object, cell, key) {
  //si e sun contenedor cargo lso elementos que contiene
  if (object instanceof Contenedor) {

    if (key === "nombre") {
      // cell.style.color = "red";
      // cell.innerHTML += `   <button type="button" class="btn btn-secondary btn-sm" onclick="editar();" >Abrir</button>`
      cell.innerHTML += ` <i class="fas fa-box-open"></i> <span class="badge badge-dark">${object.objetos.length}</span>`

      cell.addEventListener("click", function () {
        let nc = object.nombre;
        let index = pj.inventario.navegar(nav).objetos.indexOf(object);
        nav.push(index);
        console.log(nav);
        cargarContenedor(object);
        // editar(object);

      });
    }
  }

  if (object instanceof Gema && key === "nombre") {
    cell.innerHTML = `<i class="fas fa-gem"></i> ` + cell.innerHTML;
    cell.innerHTML += ` <span class="badge " style="color:blue;" >${object.pm}/${object.capacidad}</span>`;
    // cell.innerHTML += ` <span class="badge badge-dark" style="background: linear-gradient(315deg, #b8d0e0 0%, #a6afb9 54%,  #b8d0e0 80% );">${object.ctd}</span>`

  }
  if (object instanceof Pociones && key === "nombre") {

    let index = object.efectos.search(/\(/g);
    let s = object.efectos.substring(index, object.efectos.length)
    cell.innerHTML = `<i class="fas fa-flask" ></i> ` + cell.innerHTML;
    cell.innerHTML += ` <span class="badge " style="color:blue;" >${s}</span>`;
    var ht = new Hammer(cell);
    ht.on("press tap", function (ev) {
      console.log(ev);
      if (ev.type == "tap")
        console.log("TAP");
      else
        object.tomar();
    });
    // cell.innerHTML += ` <span class="badge badge-dark" style="background: linear-gradient(315deg, #b8d0e0 0%, #a6afb9 54%,  #b8d0e0 80% );">${object.ctd}</span>`

  }

  if (object instanceof Objetos && key === "nombre") {
    if (object[key] == "mo") cell.innerHTML += ` <span class="badge badge-dark gold" >${object.ctd}</span>`;
    else
      if (object[key] == "mm") cell.innerHTML += ` <span class="badge metal" >${object.ctd}</span>`;
      else
        cell.innerHTML += ` <span class="badge badge-dark"  >${object.ctd}</span>`;
    // cell.innerHTML += ` <span class="badge badge-dark" style="background: linear-gradient(315deg, #b8d0e0 0%, #a6afb9 54%,  #b8d0e0 80% );">${object.ctd}</span>`

  }


  if (object instanceof Objeto) {
    var hammertime = new Hammer(cell);
    hammertime.on('swipe', function (ev) {
      console.log(ev);
      if (ev.direction == 2) {
        // cell.parentElement.style.background = "white";
        cell.parentElement.classList.remove("selec");
        deseleccionar(object);
      } //a izq
      else {
        // cell.parentElement.style.background = "green";
        cell.parentElement.classList.add("selec");
        seleccionar(object);
      } //a derechas selecciona
    });


    // var mc = new Hammer.Manager(cell);


    // // Tap recognizer with minimal 2 taps
    // mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
    // // Single tap recognizer
    // mc.add(new Hammer.Tap({ event: 'singletap' }));


    // // we want to recognize this simulatenous, so a quadrupletap will be detected even while a tap has been recognized.
    // mc.get('doubletap').recognizeWith('singletap');
    // // we only want to trigger a tap, when we don't have detected a doubletap
    // mc.get('singletap').requireFailure('doubletap');


    // mc.on("singletap doubletap swipe", function (ev) {
    //   console.log( "Toque " +ev.type + " ");
    // });

    cell.addEventListener("dblclick", function () {
      // alert("mover objeto") + object.nombre;
      //modifico el editor modal
      editar(object);
      //y lo muestro
      $("#editModal").modal();
    });

  }

  // if (object instanceof Pociones) {
  //   objetoActual = object;
  //   console.log("me meto en pociones");
  //   cell.addEventListener("dbclick", function () {
  //     console.log("Voy a tomar");
  //     object.tomar();
  //   });
  // }



  if (object instanceof Habilidad) {
    if (key === "xp") { //si doy un click en xp +1
      cell.addEventListener("click", function () {
        //lo incremento y guardo en firebase 
        // object.xp++;
        object.addXP(1);
        object.save();
      });
    }

    if (key === "nombre") {
      cell.addEventListener("click", function () {
        //modifico el editor modal
        editar(object);
        //y lo muestro
        $("#editModal").modal();
      });
    }

    if (key === "valor") {
      cell.addEventListener("click", function () {
        entrenar(object);
        //y lo muestro
      });
    }

  }

  if (object instanceof Hechizo) {
    if (key === "nombre") {
      cell.innerHTML += ` <i class="fas fa-magic"></i><span class="badge " style="color:blue;" >${object.pm}</span>`;

      var ht = new Hammer(cell);
      ht.on("press tap", function (ev) {
        console.log(ev);
        if (ev.type == "tap")
          console.log("TAP");
        else
          hechizos(object); //en toque largo hechizo
      });
    }

  }




  // else
  //   cell.addEventListener("click", function () {
  //     console.log(object);
  //   });

}

//TODO: editar los objetos con el modal

function editar(objeto) {
  // console.log("Editar:"+objeto );
  objetoActual = objeto;
  const keys = Object.keys(objeto);
  const values = Object.values(objeto);

  var editor = document.getElementById("editor");
  editor.innerHTML = ""; //clear editor
  var id = -1;
  var k = -1
  var v = -1;
  for (i = 0; i < keys.length; i++) {
    if (i == 0) id = values[i];
    k = keys[i];
    v = values[i];

    console.log(k + " ->" + v)

    editor.innerHTML = editor.innerHTML + ' <b>' + k.toUpperCase() + ':</b>' +
      `<input data-toggle="tooltip"  id="edit${k}" value='${v}'' title="${k}" ><br>`
    // '<input data-toggle="tooltip"  id="edit' + keys[i] + '" value=' + values[i] + ' title=' + keys[i] + ' ><br>';
    //Probar con forms

  }
  editor.innerHTML = editor.innerHTML + `<button type="button" class="btn btn-success" onclick="guardarObjeto()">Guardar</button>`

}

function nuevoObjeto() {
  const keys = Object.keys(objetoActual);
  var values = Object.values(objetoActual);
  let nuevoObjeto = new objetoActual.constructor();

  console.log("Nuevo objeto:" + nuevoObjeto.constructor.name);
  //guardo los valores editados en el objeto
  for (i = 0; i < keys.length; i++) {
    var valor = $('#edit' + keys[i]).val();
    if (isNumber(valor)) values[i] = +valor;
    else values[i] = valor;
    nuevoObjeto[keys[i]] = values[i];
  }
  pj.inventario.navegar(nav).add(nuevoObjeto);
  console.log(nuevoObjeto);
  console.log("en contenedor");
  console.log(pj.inventario.navegar(nav));
  try {
    nuevoObjeto.save();
  } catch (error) {
    console.log(`El objeto ${nuevoObjeto.nombre} no se puede guardar`);
    console.log(pj);
    console.log(pj.inventario.navegar(nav));
    pj.save();//guardo el personaje entero
    cargarPersonaje();
    // alert();
  }

}

function quitarObjeto() {
  if (objetoActual instanceof Objeto) {
    pj.inventario.navegar(nav).sacar(objetoActual);
    // contenedorActual.sacar(objetoActual);
    // console.log(contenedorActual);
    console.log("Después de quitar:");
    console.log(pj.inventario.navegar(nav));
    try {
      console.log(`Quito ${objetoActual.nombre} de ${pj.inventario.navegar(nav).nombre}`);
      pj.save();//guardo
      // cargarPersonaje();
    } catch (error) {
      console.log(`Error al quitar ${objetoActual.nombre} de ${pj.inventario.navegar(nav).nombre}`);
      // alert();
    }
  }

}

function guardarObjeto() {

  const keys = Object.keys(objetoActual);
  var values = Object.values(objetoActual);

  console.log("Editar objeto:");
  //guardo los valores editados en el objeto
  for (i = 0; i < keys.length; i++) {
    var valor = $('#edit' + keys[i]).val();
    if (isNumber(valor)) values[i] = +valor;
    else values[i] = valor;
    objetoActual[keys[i]] = values[i];
  }
  console.log(objetoActual);
  var id = values[0]; //Imaginamos que el id es el 1er campo
  try {
    objetoActual.save();
  } catch (error) {
    console.log(`El objeto ${objetoActual.nombre} no se puede guardar`);
    console.log(pj);
    pj.save();

    // if (contenedorActual) {
    //   console.log(contenedorActual);
    //   cargarContenedor(contenedorActual);
    // }
    // else
    // cargaInventario(pj);
    cargarPersonaje(pj);


    // alert();
  }

}

function isNumber(value) {
  if (value instanceof Number)
    return true
  else
    return !isNaN(value);
}


function saveStats() {
  for (let i in CP) {
    var x = parseInt(document.getElementById(CP[i]).innerHTML);
    // var x = eval(document.getElementById(CP[i]).innerHTML);
    console.log(x);
    pj[CP[i]] = x;
  }
  pj.nombre = $("#nombre").val();
  pj.act();
  tablaStats();
  pj.backup = null; //para que no se vuelva a cargar con los efectos.

  pj.save();

  // var h1 = new Habilidad("AAAA", "Agilidad", 7);
  // console.log(h1);
  // // h1.save();
  // pj.setHabilidad(h1);

  // var h1 = new Habilidad("Correr", "Agilidad", 100);
  // var b1 = new BonHabilidad("Correr", 0, 10, 10);
  // h1.activarBon(b1);

  // pj.setHabilidad(h1);
  // pj.setHabilidad(new Habilidad("Trepar", "Agilidad", 15));
  // pj.setHabilidad(new Habilidad("Saltar", "Agilidad", 30));
  // pj.setHabilidad(new Habilidad("Esquivar", "Agilidad", 25));

  console.log("PERSONAJE GUARDADO:");
  console.log(pj);

  // makeTable($("#habilidades"), pj);

  // efFuerza = new Efecto("fuerza", `this.sb(FUE,"+5")`, fechaMundo.add("dia", 4));
  // efDes = new Efecto("des", `this.DES+=5`, fechaMundo.add("dia", 4));
  // efTam = new Efecto("tamaño", `this.sb(TAM,5)`, fechaMundo.add("dia", 4));
  // efAsp = new Efecto("aspecto", `this.ASP=18`, fechaMundo.add("dia", 4));
  // efReflex = new Efecto("Reflejos felinos", `this.DES+=5; this.sb(Agilidad,'+5') `, fechaMundo.add("dia", 4));
  // efPermanente = new Efecto("Permanente", `this.ASP+=5; this.sb(Comunicación,'+5') `);


  // pj.addEfecto(efFuerza)
  // pj.addEfecto(efDes)
  // pj.addEfecto(efTam)
  // pj.addEfecto(efAsp)
  // pj.addEfecto(efReflex)
  // pj.addEfecto(efPermanente)

  // pj.aplicarEfectos()
  // pj.nombre = "Copia";
  // pj.save();

}

function clear(id = "statsTable") {
  var tb = document.getElementById(id);
  tb.innerHTML = ""; //clear body
}

function act() {
  var x = document.getElementById("fecha").value;
  document.getElementById("texto").innerHTML = x;
  // console.log("fechaMundo x :"+x);
  fechaMundo = new Date(x + ".000Z");
  // console.log("fechaMundo:"+fechaMundo.toISOString());
  document.getElementById("texto").innerHTML = pj.aplicarEfectos()
  pj.act();
  tablaStats();

}

function dados(nombre) {

  let v = Math.trunc(Math.random() * 100 + 1);
  console.log(v);
  $(nombre).val(v);

}

function entrenar(habilidad) {
  var valor;
  var bon;
  var horas;

  var dado = 3;

  $("#modalEntrenar").modal();
  //inicializa
  if (habilidad instanceof Habilidad) {
    valor = habilidad.valor;
    horas = habilidad.horasEntrenadas;
    bon = habilidad.v - valor;

    console.log(`${valor} ${horas} ${bon}`);

    $("#iHabilidad").val(valor);
    $("#iHoras").val(horas);
    $("#lbEntrenar").text(habilidad.nombre);

  }

  function act() {
    // console.log("ACT");
    valor = parseInt($("#iHabilidad").val())
    horas = parseInt($("#iHoras").val())

    $("#iHabilidad").val(valor);
    $("#iHoras").val(horas);
    // console.log(horas-(valor-bon));

    //tiene que ser un numero igual de horas al %
    if (horas >= valor) {
      // $("#iTiradaSubir").val('+'+(valor-bon))
      $("#iTiradaSubir").prop("disabled", false);
      $("#iTiradaSubir").attr('placeholder', ((valor - bon)))
      // $("#iTiradaSubir").css( "color", "red" );
    }
    else
      $("#iTiradaSubir").prop("disabled", true);
  }

  function subir(x) {
    // if(!x) x=parseInt($("#iTiradaSubir").val())
    $("#iHabilidad").val(valor + x); //sumo lo que se sube
    // resto de las horas
    $("#iHoras").val(horas - valor);
    act();

  }

  $("#bManual").click(function (event) {
    subir(parseInt($("#iTiradaSubir").val()))
  });

  $("#bEntrenar").click(function (event) {
    dado=$("#iDadosEntrenador").val()
    let d100 = new D(1, 100)
    let d = new D(1, dado)
    console.log('DADO:');
    console.log(dado);
    let limite = valor - bon;
    while (horas >= valor) {
      let subida = 0;
      let tirada = d100.norm()
      if (tirada == 7 || tirada == 77)
        subida = d.max() + d.norm();//ó dado*2
      else
        if (tirada == 100)
          subida = d.max()
        else
          if (tirada >= limite)
            subida = d.norm()

      console.log(tirada + "->" + subida);

      subir(subida);

    }
  });
  $("input[type='number']").change(function () {
    act()
  });

}

/**
 * Escala un valor x entre m1 y M1 a otro valor entre m2 y M2
 *  x [m1,M1]->[m2,M2]
 * @param {Number} x 
 * @param {Number} m1 
 * @param {Number} M1 
 * @param {Number} m2 
 * @param {Number} M2 
 */
function escalar(x, m1, M1, m2, M2) {
  let d1 = M1 - m1;
  let d2 = M2 - m2;
  return (x - m1) * (d2 / d1) + m2;
}

function atacarModal(habilidad) {
  console.log("estoy en atacar modal");
  var valor;
  var bon;
  var horas;

  var dado = 3;


  //inicializa
  // atPJ();
  let enemigo = $('#nombreEnemigo').val()
  atP(pj.nombre, "PJ")

  console.log("ENEMIGO es-->" + enemigo);
  cargarPNJ(enemigo, enemigo);
  atP(enemigo, "PNJ")

  $("#modalAtacar").modal();
  // atPNJ(enemigo);

  //   var  datalist="<datalist id='listaLocalizaciones'>"
  //   var listaLoc= [];
  //   pj.cuerpo.todosNombres(listaLoc);

  //   listaLoc.forEach(l => {
  //     datalist+=` <option value="${l}"></option>`
  // });
  // datalist+="</datalist>"

  //   document.getElementById("atPJ").innerHTML=

  //   ` <div>
  //   <input type="radio" id="r-todo" name="lugar" value="todo"
  //          checked>
  //   <label for="huey">Todo</label>

  //   <input type="radio" id="r-arriba" name="lugar" value="arriba">
  //   <label for="dewey">Arriba</label>

  //   <input type="radio" id="r-abajo" name="lugar" value="abajo">
  //   <label for="louie">Abajo</label>
  // </div> 
  //    <input id="iDadosLoc" type="number" class="form-control number-input col-2"><input type="text" list="listaLocalizaciones" class="text-light bg-dark h3 " style="font-family: Old Europe" "
  //   id="localizaciones">` +datalist;

  //   $(`#iDadosLoc`).change(function () {
  //     valor = event.target.value;
  //     let medio=60
  //     if(document.getElementById("r-arriba").checked){
  //       if(valor>medio) valor=Math.trunc(escalar(valor,medio,100,1,medio))
  //     } 
  //     else
  //     if(document.getElementById("r-abajo").checked){
  //       if(valor<medio) valor=Math.trunc(escalar(valor,1,medio,medio,100))
  //     }


  //     $(`#localizaciones`).val(pj.cuerpo.darLocalizacion(valor).nombre)
  //   });



}

var zoomCuerpo = 1;

function atP(personaje = "Enemigo", rol = "PNJ") {
  if (rol === "PNJ") console.log("atP-->PNJ");
  else console.log("atP-->PJ");
  var datalist = `<datalist id='listaLocalizaciones${personaje}'>`
  var listaLoc = [];
  if (rol === "PNJ")
    pnj[personaje].cuerpo.todosNombres(listaLoc);
  else
    pj.cuerpo.todosNombres(listaLoc);

  listaLoc.forEach(l => {
    datalist += ` <option value="${l}"></option>`
  });
  datalist += "</datalist>"

  document.getElementById(`at${rol}`).innerHTML =

    `
     <div>
  Habilidad ofensiva:<br>
  <input-habilidad id="id${personaje}"></input-habilidad>
  <br> <br>
  <form class="form-inline">
  Daño: <input id="iDaño${personaje}" type="number"  class="form-control number-input col-2" ondblclick="this.value=Math.round(Math.random() * 15);">
  <button id="bDañar" type="button" class="btn btn-danger" onclick="
  dañar('${rol}',document.getElementById('iDaño${personaje}').value,document.getElementById('localizaciones${personaje}').value);
  console.log(document.getElementById('localizaciones${personaje}').value );
  atDaños();
  ">Dañar</button>
  <input-daño id="daño${personaje}"></input-daño>
  </form>
  <br>
  <input type="radio" id="r-todo${personaje}" name="lugar" value="todo"
         checked>
  <label for="huey">Todo</label>

  <input type="radio" id="r-arriba${personaje}" name="lugar" value="arriba">
  <label for="dewey">Arriba</label>

  <input type="radio" id="r-abajo${personaje}" name="lugar" value="abajo">
  <label for="louie">Abajo</label>
</div>

<form class="form-inline">
   <input id="iDadosLoc${personaje}" type="number" class="form-control number-input col-2" ondblclick="this.value=Math.round(Math.random() * 100);">
   <input type="text" list="listaLocalizaciones${personaje}" class="text-light bg-dark" 
  id="localizaciones${personaje}"> ${datalist} <div id="daños${(rol === "PNJ") ? 'PNJ' : 'PJ'}"> <br>DAÑOS<br> </form> </div>
  <input  id="zoom" type="range" min="0" max="1" step="any" onchange="zoomCuerpo=this.value;atDaños()" style="width: 100%;" >
  <canvas id="canvas${rol}"  width="500" height="1000" style="background-color: black;border:1px solid #d3d3d3;">
  Your browser does not support the HTML5 canvas tag.</canvas>
  <div style="display:none;"><img id="cuerpo" src="Body.png" alt="Cuerpo"></div>
`;

  /* <button id="+" onclick="zoomCuerpo+=0.1;atDaños()">+</button>
  <button id="-" onclick="zoomCuerpo-=0.1;atDaños()">-</button> */

  // ${(rol === "PJ") ? 'pnj.' + personaje : "pj"}.cuerpo.dañarLocalizacion(this.value,document.getElementById('localizaciones${personaje}').value);

  // console.log(${(rol === "PNJ")?'pnj.'+personaje:"pj"}.cuerpo.darLocalizacion(document.getElementById('localizaciones${personaje}').value).dañar(this.value) );

  $(`#iDadosLoc${personaje}`).change(function () {
    valor = event.target.value;
    let medio = 60
    if (document.getElementById(`r-arriba${personaje}`).checked) {
      if (valor > medio) valor = Math.trunc(escalar(valor, medio, 100, 1, medio))
    }
    else
      if (document.getElementById(`r-abajo${personaje}`).checked) {
        if (valor < medio) valor = Math.trunc(escalar(valor, 1, medio, medio, 100))
      }

    if (rol === "PNJ") { $(`#localizaciones${personaje}`).val(pj.cuerpo.darLocalizacion(valor).nombre) }

    else { $(`#localizaciones${personaje}`).val(pnj[$('#nombreEnemigo').val()].cuerpo.darLocalizacion(valor).nombre) }


  });

  if (rol === "PNJ") { document.getElementById(`id${personaje}`).setPersonaje(pnj[personaje]) }
  else { document.getElementById(`id${personaje}`).setPersonaje(pj); }

}


function dañar(p, daño, loc) {
  console.log("Daño", p, daño);
  if (p === "PJ") {
    pnj[$('#nombreEnemigo').val()].cuerpo.dañarLocalizacion(daño, loc)
  }
  else {
    pj.cuerpo.dañarLocalizacion(daño, loc)
  }


}

function atDaños(params) {
  let todos = [];
  let string = ""
  //dibujar

  console.log("atDaños");

  // var canvas = document.getElementById("myCanvas");
  // var ctx = canvas.getContext("2d");
  // var img = document.getElementById("cuerpo");
  // ctx.drawImage(img, 0, 0);

  let canvas = document.getElementById('canvasPNJ');
  canvas.width = 500 * zoomCuerpo;
  canvas.height = 1000 * zoomCuerpo;
  pnj[$('#nombreEnemigo').val()].cuerpoDaño("canvasPNJ", zoomCuerpo);

  pnj[$('#nombreEnemigo').val()].cuerpo.todosDaños(todos);
  todos.forEach(l => {
    // console.log(l.nombre,l.daño);
    string += `${l.nombre} :<b>${l.daño}</b>/${l.pg}<br>`
    // string+=l.nombre+":"+l.daño+"<br>";
    // if(l.x && l.y){
    //   console.log("dibujo ",l.nombre,l.x, l.y, l.daño*5);
    //   ctx.globalAlpha = 0.5
    //   ctx.beginPath();
    //   ctx.arc(l.x, l.y, l.daño*5, 0, 2 * Math.PI, false);
    //   ctx.fillStyle = 'red';
    //   ctx.fill();
    // }

  });
  // string+=`${pnj[$('#nombreEnemigo').val()].getCar("PG")} / ${pnj[$('#nombreEnemigo').val()].getMaxPuntos(PG)}`
  document.getElementById('dañosPNJ').innerHTML = string;


  todos = [];
  string = ""
  pj.cuerpo.todosDaños(todos);
  canvas = document.getElementById('canvasPJ');
  canvas.width = 500 * zoomCuerpo;
  canvas.height = 1000 * zoomCuerpo;
  pj.cuerpoDaño("canvasPJ", zoomCuerpo);


  todos.forEach(l => {
    // console.log(l.nombre,l.daño);
    string += `${l.nombre} :<b>${l.daño}</b>/${l.pg}<br>`
    // string+=l.nombre+":"+l.daño+"<br>";
  });
  document.getElementById('dañosPJ').innerHTML = string;


  // document.getElementById('dañosPJ').innerHTML= JSON.stringify(todos);
  // document.getElementById('dañosPJ').innerHTML= JSON.stringify(pnj[$('#nombreEnemigo').val()].cuerpo.dañadas())
  // document.getElementById('dañosPNJ').innerHTML= JSON.stringify(pj.cuerpo.dañadas());
}

/**
 * Crea la interfaz para lanzar un hechizo
 * @param hechizo: el hechizo 
 */
function hechizos(hechizo) {
  var _hechizo = new Hechizo("Hechizo", hechizo.pm, hechizo.valor)
  // las habilidades
  var nombres = [
    "Multiconjuro",
    "Sobrepotencia",
    "Refuerzo",
    "Alcance",
    "Duración",
    "Intensidad",
    "Puntería",
    "Velocidad"
  ]

  var iPM = [];

  /**
    *Puntos de intensidad gastados
    */
  var pig = []

  var habilidades = []
  var html = ""
  var h;
  var dados = [];
  var pmGastados = 0;
  var porcentaje = hechizo.v;

  //penalizacion al hechizo por Intensidad
  var penalizacion = 0

  //Se lanza el modal
  $("#modalHechizo").modal();

  document.getElementById("salida").innerHTML = "";
  document.getElementById("hm").innerHTML = "";
  document.getElementById("modalHechizoTitle").innerHTML = hechizo.nombre +
    ` <span class="badge badge-pill badge-dark">${hechizo.pm}</span>`


  document.getElementById("salida").innerHTML += ` <div class="input-group-prepend">
  <span class="input-group-text col-6">PM: ${pj.getCar(PM)}</span>
  <input type="number" value=${pj.getCar(PM)} class="form-control number-input col-2">
  <span class="input-group-text col-6">Gemas: ${pj.pmGemas()}</span>
  <input type="number" value=${pj.pmGemas()} class="form-control number-input col-2">
  </div>`;

  //pongo todas las habilidades mágicas en habilidades
  nombres.forEach(n => {
    h = pj.getHabilidad(n);
    if (h) {
      habilidades.push(h)
      document.getElementById("salida").innerHTML +=
        //         `
        // <div id="grupo${h.nombre}" class="input-group-prepend">
        //   <span id="lb${h.nombre}" class="input-group-text col-4">${h.nombre}: ${h.v}%</span>
        //   <input id="iPM${h.nombre}" type="number" value="0" class="form-control number-input col-2">
        //   <span class="input-group-text col-1"  id="d${h.nombre}"><i class="fas fa-dice-six"></i></span>
        //   <input id="iDados${h.nombre}" type="number" class="form-control number-input col-2">
        //   <button id="bt${h.nombre}OK" class="btn btn-primary col-1" type="button">OK</button>
        // </div>
        //   `
        `
<div id="grupo${h.nombre}" class="input-group-prepend">
  <span id="lb${h.nombre}" class="input-group-text col-6">${h.nombre}: ${h.v}%</span>
  <input id="iPM${h.nombre}" type="number" value=0 class="form-control number-input col-2">
  <span class="input-group-text dado"  id="d${h.nombre}"> <i class="fas fa-dice-six"></i></span>
  <input id="iDados${h.nombre}" type="number" class="form-control number-input col-2">
  <button id="bt${h.nombre}OK" class="btn btn-primary col-1" type="button">OK</button>
</div>
  `
    }
  });

  //TODO: Metemos el hechizo
  _hechizo.nombre = "Hechizo" //para evitar los espacios del nombre
  h = _hechizo;
  habilidades.push(h)
  document.getElementById("salida").innerHTML +=
    `
<div id="grupo${h.nombre}" class="input-group-prepend">
  <span id="lb${h.nombre}" class="input-group-text col-6"><b>${h.nombre}: ${h.v}%</b></span>
  <input id="iPM${h.nombre}" type="number" value="${h.pm}" class="form-control number-input col-2">
  <span class="input-group-text dado"  id="d${h.nombre}"> <center><i class="fas fa-dice-six text-center"></center></i></span>
  <input id="iDados${h.nombre}" type="number" class="form-control number-input col-2">
  <button id="bt${h.nombre}OK" class="btn btn-primary col-1" type="button">OK</button>
</div>
  `
  // document.getElementById("salida").innerHTML +=
  // `
  // <div id="grupo${h.nombre}" class="input-group-prepend w-100">
  //   <div class="w-100 p-3" style="background-color: #eee;">Width 100%</div>
  // </div>
  // `

  $("#bLanzarHechizo").one("click", function () { //one para que no lo lance cada vez que ejecuto lanzar hechizo
    pj.gastarPM(totalGastado(), true);
    console.log(`Se le resta ${totalGastado()} y quedan ${pj.PM} PM`);

    habilidades.forEach(h => {
      //por cada habilidad mágica que mire el resultado
      let v = $(`#iDados${h.nombre}`).val()
      // si hay tirada, que suba en xp
      if (v && v > 0) {
        //TODO, luego hacerlo con el nombre
        //como hechizo no se hace con su nombre
        if (h.nombre == "Hechizo") hechizo.xpTirada(v, pj.suerte);
        else h.xpTirada(v, pj.suerte);
        console.log(h.nombre + " se ha comprobado XP");

      }

    });

    pj.save()
    console.log("***********SE HA PULSADO LANZAR");
  });

  //selectpicker con las habilidades a mostrar  onclick="dados('#iDados${h.nombre}')"
  var hm = document.getElementById("hm");

  //actualizar las habilidades mágicas(habilidad,valor)

  /**
   * actHM
   ** Función que actualiza las habilidades de magia
   * tras un cambio
   *@author Roberto Lozano
  */
  function actHM(h, valor) {
    // console.log();
    let n = h.nombre;
    var v = h.tirada(valor, pj.suerte);
    let pm = parseInt($(`#iPM${n}`).val());
    let i = document.getElementById(`iDados${h.nombre}`);
    if (h.nombre == "Intensidad") {
      penalizacion = 0; //en principio sin penalizacion
      _hechizo.bvalor = -penalizacion;

      // let lb = document.getElementById(`lb${_hechizo.nombre}`);
      // lb.innerHTML=`<b>${hechizo.nombre}: ${_hechizo.v}%</b>`
      $(`#lb${_hechizo.nombre}`).html(`<b>${_hechizo.nombre}: ${_hechizo.v}%</b>`);

    }
    switch (v) {
      case (TipoTirada.SUPERCRITICO):
        // pmHechizo = 1;
        i.style.color = "red";
        iPM[n] = pm + 5
        pig[n] = 1;

        break;
      case (TipoTirada.CRITICO):
        console.log("CRITICO");
        // pmHechizo = 1;
        i.style.color = "red";
        iPM[n] = pm + 3
        pig[n] = 1; //GASTA 1
        break;
      case (TipoTirada.ESPECIAL):
        console.log("ESPECIAL");
        // pmHechizo = h.pm;
        i.style.color = "green";
        iPM[n] = pm;
        pig[n] = pm - 1; //gasta uno menos
        break;
      case (TipoTirada.EXITO):
        console.log("EXITO");
        // pmHechizo = h.pm;
        i.style.color = "black";
        iPM[n] = pig[n] = pm;

        //si es intensidad y éxito normal resta al hechizo
        if (h.nombre == "Intensidad") {
          penalizacion = pm * 5;
          _hechizo.bvalor = -penalizacion;
          console.log(_hechizo.v);
          // console.log(`#lb${_hechizo.nombre}).text(${_hechizo.nombre}: ${hechizo.v}%`);

          $(`#lb${_hechizo.nombre}`).html(`<b>${_hechizo.nombre}: ${_hechizo.v}%</b>`);
          // $("[id='${_hechizo.nombre}']").text(`${_hechizo.nombre}: ${_hechizo.v}%`);

        }
        break;
      case (TipoTirada.FALLO):
        console.log("FALLO");
        // pmHechizo = 1;
        i.style.color = "grey";
        iPM[n] = 0;
        pig[n] = 1
        break;
      default:
        ;
    }

    console.log(n + ":" + iPM[n] + "gastados" + pig[n])
    totalGastado();
  }

  function lanzarDados(nombre, h) {
    let v = Math.trunc(Math.random() * 100 + 1);
    console.log(v);
    $(nombre).val(v);
    actHM(h, v);

  }

  function totalGastado() {
    let suma = 0;
    for (let v in pig)
      suma += pig[v]
    // console.log(suma);
    return suma;
  }


  // console.log("habilidades");
  // console.log(habilidades);
  habilidades.forEach(h => {
    console.log(h);
    //por cada habilidad mágica se añade un option
    hm.add(new Option(h.nombre));
    $("#hm").selectpicker('refresh');
    // $("#hm").add(new Option(h.nombre));

    $(`#d${h.nombre}`).click(function () {
      console.log(`#d${h.nombre} presionado`);
      lanzarDados(`#iDados${h.nombre}`, h);


    });

    $(`#iPM${h.nombre}`).change(function () {
      valor = event.target.value;
      console.log(`#iPM${h.nombre} valor: ${event.target.value}`);
      iPM[h.nombre] = valor;
      //TODO: tal vez actualizar
    });

    $(`#iDados${h.nombre}`).change(function () {
      valor = event.target.value;
      console.log(`#iDados${h.nombre} valor: ${event.target.value}`);
      dados[h.nombre] = valor;
      actHM(h, valor)
    });

    // document.getElementById(`iDados${h.nombre}`).addEventListener('change', (event) => {
    //   console.log(`Se ha cambiado el dado a ${event.target.value}`);
    // });

    // hide(h.nombre);

  });

  $("#hm").on("changed.bs.select",
    function (e, clickedIndex, newValue, oldValue) {
      let t = (hm[clickedIndex].text);
      if (newValue)
        show(t);
      else
        hide(t);

    });
  // document.getElementById("salida").innerHTML=html


}

function hide(habilidad) {
  $("#grupo" + habilidad).hide("slow");
  //opcional dejar los valores en 0
  // iPM[habilidad] = 0
  // pig[habilidad] = 0 
}

function show(habilidad) {
  $("#grupo" + habilidad).show("slow");
}

function atras() {
  nav.pop();
  ir();
}
function ir() {

  console.log("CARGA CONTENEDOR");
  console.log(pj.inventario.navegar(nav).nombre);
  cargarContenedor(pj.inventario.navegar(nav));

}
function copiar() {
  copiado = selected;
  // copiado.push(objetoActual);
  // console.log(copiado);
  // $('.toast-body').text(`Objeto "${objetoActual.nombre}"" copiado`)

  // $('.toast').toast({ delay: 4000 });
  // $('.toast').toast('show');
}

function cortar() {
  // copiado.push(objetoActual);
  copiar();
  eliminar();
  // pj.inventario.navegar(nav).sacar(objetoActual);
  // pj.save();
  // cargarPersonaje(true);
}

function eliminar() {
  selected.forEach(element => {
    pj.inventario.navegar(nav).sacar(element);
  });
  pj.save();

}

function pegar() {
  copiado.forEach(element => {
    if (element instanceof Objeto) {
      pj.inventario.navegar(nav).add(element);
    }
  });
  copiado = [];
  selected = [];
  pj.save()
  // cargarPersonaje(true);

}

/**
 * Inserta en el contenedor actual los objetos del portapapeles
 * escaneando el texto copiado
 */
function portapapeles() {
  navigator.clipboard.readText().then(clipText =>
    pj.inventario.navegar(nav).escanear(clipText));


}


//las funciones de rol.js

function cargar(ruta) {
  console.log("CARGAR RUTA:" + ruta);
  fbActual = database.ref(ruta);
  //si lo hago así es menos eficiente porque siempre que haya un cambio
  //carga todas las habilidades

  //por si quiero ordenar de algún modo: .orderByChild("valor").on(...

  fbActual.on('value', function (item) {
    clear("tbHab");
    //this is saying foreach order do the following function...
    item.forEach(function (firebaseReference) {
      a = firebaseReference.val();
      var nh = new Habilidad();
      nh.setAll(a);
      pj.setHabilidad(nh);
      // console.log(a); //check your console to see it!
      // addObjet2Table(nh,"tbHab");
    });
    //TODO: poner aquí el header??
    // makeTable("", pj);
  });

  // Get the hab that has changed

  // fbActual.on("child_changed", function (snapshot) {
  //   var changedHab = snapshot.val();
  //     var nh = new Habilidad();
  //     nh.setAll(changedHab);
  //     pj.setHabilidad(nh);
  //   console.log("Nodo cambiado");
  //   console.log(changedHab);
  //   makeTable("", pj);
  // });

  //Tal vez debería hacerlo para added y removed

  // $('#myTable').css('textTransform', 'capitalize');
}


// function cargarRuta() {
//   cargar($("#rutas").val());
// }
function cargarHabilidad(personaje = pj) {
  cargar(`personajes/${personaje.nombre}/habilidades/`);
}

function cargaInventario(pj) {
  console.log("Carga Inventario");
  nav = [];
  cargarContenedor(pj.inventario.navegar(nav));
}

function cargarContenedor(object) {
  object = pj.inventario.navegar(nav);
  if (!(object instanceof Contenedor)) return; //si no es contenedor
  //hago éste el contenedor actual
  // contenedorActual = object;
  // console.log("Contenedor Act:");
  console.log("Objeto Act:");
  // console.log(pj.inventario.navegar(nav));
  console.log(object);
  clear("tbInv"); //limpio la tabla
  let visibles = $("#colInventario").val();
  createHeader(visibles, "hdInv");
  object.objetos.forEach(function (element) {
    // addObjet2Table(element, "tbInv")
    objetoTabla(element, "tbInv", visibles);
  });
  addObjet2Table(["peso Total", roundTo(3, object.pesa)], "tbInv")
}

function roundTo(precision, num) {
  //redondeamos a gramos  
  return +(Math.round(num + "e+" + precision) + "e-" + precision);
}

function cargarPersonaje(nombre) {
  if (nombre == true) {
    // contenedorActual = null;
    nav = [] //Llamo desde el boton y voy al inventario general
    document.getElementById("btPersonaje").click();
  }
  else
    if (nombre.length > 0) {
      //Si se carga desde la url
      document.getElementById("btPersonaje").click();

    }

  nombre = $("#nombre").val();
  
  cargarPersonajeOnline(nombre);


  //  podría hacerlo con once y luego responder a cambios en habilidades,
  //  en inventario y en las características

  // fbActual.once("value", function (data) {
  //    pj = new Animal({});
  //    pj.setAll(item.val());
  //    // mostrar las demás: makeTable("", pj), etc
  // });

  // fbActual.on("child_changed", function (snapshot) {
  //   var changedPost = snapshot.val();
  //   console.log("The updated post title is " + changedPost.title);
  // });

  // Mover un objeto
  //  pj.inventario.mover(1, a.inventario);
  //  console.log(pj);
  //  console.log(a);
  //  pj.save();
  //  a.save();

}
function monitorizarCuerpo(nombre) {
  let ruta = `personajes/${nombre}/cuerpo/localizaciones`;
  console.log('MONITORIZADO CUERPO de '+nombre);
  var fbCuerpo=  database.ref(ruta);
  fbCuerpo.on('child_changed', function(data) {
    console.log(data.key);  // <-- Name of the field/node that was modified
    console.log(data.val()); // <-- Value of the field/node that was modified
    console.log("The updated" + data.key + " is " + data.val());
    console.log(pj.cuerpo.localizaciones[data.key]);
  });
  
}




function cargarPersonajeOnline(nombre){
  try {
    let ruta = `personajes/${nombre}/`;
  // console.log("CARGAR RUTA:" + ruta);
 
  fbActual = database.ref(ruta);
  monitorizarCuerpo(nombre);

  // si lo hago así es menos eficiente,
  // porque siempre que haya un cambio
  // donde sea me, va a cargar el personaje entero
  fbActual.on('value', function (item) {
    console.log("onvalue personaje" + item.val().nombre);

    let nuevo=item.val();
    if (nuevo.clase){
      // pj =  new Humanoide({});
      pj= Clase.convertir(item.val())
    }
    else
    pj = new Humanoide({});
    // pj = new Animal({});
    pj.setAll(item.val());

    console.log("CARGA EL PUTO PERSONAJE:" + pj.nombre);
    console.log(nav);
    // console.log(pj);
    document.title = pj.nombre;

    // makeTable("", pj);
    tablaHabilidades();
    tablaStats();
    actPuntos();

    //Inventario nuevo TODO: quitar
    // pj.inventario = creaInventario();
    // console.log(pj.inventario.darContenedores());
    // console.log("ARMAS");
    // console.log(pj.inventario.darClase(Arma));
    // console.log("Objetos");
    // console.log(pj.inventario.darClase(Objetos));


    //TODO: hacer que funcione
    // if (contenedorActual) {
    //   console.log("Contenedor Act:");
    //   console.log(contenedorActual);
    //   cargarContenedor(contenedorActual);
    // }
    // else
    cargarContenedor();
    // console.log("No ContenedorAct: CargaInventario");
  });
  
  } catch (error) {
    console.log("ERROR EN CARGA ONLINE");
    alert("ERROR EN CARGA ONLINE")
    
  }

}

function cargarPersonajeOffline(nombre){

}

var pnj = {}
/**
 * 
 * @param {String} nombre El nombre del PNJ a cargar
 * @param {var} pnj La variable donde se guarda el PNJ
 */
function cargarPNJ(nombre, id = nombre) {
  let ruta = `personajes/${nombre}/`;
  // console.log("CARGAR RUTA:" + ruta);
  fbActual = database.ref(ruta);

  // si lo hago así es menos eficiente,
  // porque siempre que haya un cambio
  // donde sea me, va a cargar el personaje entero

  fbActual.on('value', function (item) {
    console.log("onvalue PNJ" + item.val().nombre);

    pnj[id] = new Humanoide({});
    // pnj = new Animal({});
    pnj[id].setAll(item.val());

    console.log(`CARGA EL PNJ: ${pnj[id].nombre} en pnj["${id}"]`);

  });
}

// var lastObject={};

function addObjet2Table(object, tabla) {

  const keys = Object.keys(object);
  // const lastKeys = Object.keys(lastObject);
  // lastObject= object;

  const values = Object.values(object);

  var table = document.getElementById(tabla);
  var row = table.insertRow();

  // if(JSON.stringify(keys)==JSON.stringify(lastKeys)) console.log("Misma fila");
  // // if(keys.length==lastKeys.length) console.log("Misma fila");
  // else  createHeader(keys, "hdInv") //console.log("Fila distinta:"+ lastKeys +"<->"+ keys);

  var id = -1
  for (i = 0; i < keys.length; i++) {
    if (i == 0) id = values[i];
    // var k = keys[i];
    // var v = values[i];
    var cell = row.insertCell(i);
    crearEventos(object, cell);

    cell.innerHTML = '<i data-toggle="tooltip"  id="' + id + "|" + keys[i] + "|" + values[i] + '" title=' + keys[i] + '>' + values[i] + '</i>';
    // cell.tooltip({title: "<h1><strong>HTML</strong> $keys[i] <code>the</code> <em>tooltip</em></h1>", html: true, placement: "bottom"});
    // console.log(keys[i] + ":" + values[i]); //check your console to see it!
  }

}

function objetoTabla(object, tabla, visibles) {
  var table = document.getElementById(tabla);
  var row = table.insertRow();

  var i = 0
  for (key of visibles) {//Esto serían todas
    var cell = row.insertCell(i);
    let valor;
    //Hacer un get de property en vez de método
    // if (key.includes("()")) {//si es un método
    //   valor = eval("object." + key);
    // }
    // else {
    if (i == 0) id = object[key];
    // crearEventos(object, cell, key);
    // console.log(object[key]);
    valor = object[key];
    // }

    if (valor === undefined) valor = "";

    cell.innerHTML = '<i data-toggle="tooltip"  id="' + id + "|" + key + "|" + valor + '" title=' + key + '>' + valor + '</i>';
    crearEventos(object, cell, key);
    i++;
  }

  if (object instanceof Habilidad) {
    // en habilidad pongo el total (.v) y un tooltip con el E y C
    var cell = row.insertCell(i); cell.innerHTML =
      `<i data-toggle="tooltip" title="E: ${object.e}\nC: ${object.c} "> <b> ${object.v}</b> </i>`
  }

}

//COSILLAS
// var ami = "amigo"
// cargarPNJ("Enemigo", ami);
function dañ(params) {
  pnj.amigo.cuerpo.dañarLocalizacion(4, 100);
  pnj.amigo.cuerpo.dañarLocalizacion(4, 1)
  pnj.amigo.cuerpo.dañarLocalizacion(4, 50)

  pnj.amigo.cuerpo.todosDaños();
}



