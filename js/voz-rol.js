//#region Reconocimiento de voz

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

// var colors = [ 'aqua' , 'azure' , 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate', 'coral', 'crimson', 'cyan', 'fuchsia', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'indigo', 'ivory', 'khaki', 'lavender', 'lime', 'linen', 'magenta', 'maroon', 'moccasin', 'navy', 'olive', 'orange', 'orchid', 'peru', 'pink', 'plum', 'purple', 'red', 'salmon', 'sienna', 'silver', 'snow', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'white', 'yellow'];


var regSTOP = /parar|detener|acabar|terminar|stop|finalizar|fin dictado/gi

// var colors = ['Skasendor', 'Rosssel', 'esca', 'sendor', 'agua', 'azul', 'beis', 'negro', 'blanco', 'blue', 'marron', 'chocolate', 'coral', 'escarlata', 'rojo', 'verde']
// var grammar = '#JSGF V1.0; grammar colors; public <color> = ' + colors.join(' | ') + ' ;'

// var resultado = "";
var recognition = new SpeechRecognition();
// var speechRecognitionList = new SpeechGrammarList();
// speechRecognitionList.addFromString(grammar, 1);
// recognition.grammars = speechRecognitionList;


//true para que escuche todo el tiempo
recognition.continuous = true;
recognition.lang = 'es-ES';
// recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 3;

/**separar los articulos por y
 */
var y = false;
var boton;
var hablado;

// si está hablando para que no procese lo escuchado
var hablando = false;
// document.body.onclick = function() {
//   recognition.start();
//   console.log('Ready to receive a color command.');
// }

var escuchando = false;
function escuchar() {
    boton = document.getElementById("dictar");
    mic = document.getElementById("mic");
    boton.style.color = "green";

    try {
        mic.classList.remove("red");
        mic.classList.add("green");
    } catch (error) {
        mic.color = "green";

    }

    console.log('Preparado para escuchar');
    console.log(`Diga '${regSTOP}' para detener la escucha`);
    escuchando = true;
    recognition.start();

}


/**Funcion que inicializa el dictado
 * 
 */
function hablar() {

    //   hablado = document.getElementById("hablado");
    if (escuchando) //ya esta escuchando y se para
    {
        recognition.stop();
        console.log('Dictado parado');
        return;
    }
    console.log('Botón de hablar pulsado');
    escuchar();






}


// Controlo cuando genera los resultados para evitar el eco en Android https://issuetracker.google.com/issues/152628934
// eliminarlo cuando el bug sea resuelto
var lastTime = 0;


recognition.onresult = function (event) {
    // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
    // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
    // It has a getter so it can be accessed like an array
    // The first [0] returns the SpeechRecognitionResult at the last position.
    // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
    // These also have getters so they can be accessed like arrays.
    // The second [0] returns the SpeechRecognitionAlternative at position 0.
    // We then return the transcript property of the SpeechRecognitionAlternative object
    let last = event.results[event.results.length - 1][0];
    let lastArray = event.results[event.results.length - 1];


    if (event.results.length > 0) {
        var result = event.results[0];
        for (var i = 0; i < result.length; ++i) {
            var text = result[i].transcript;
            console.log(text);
        }
    }

    // console.log(`Tamaño: ${size}`);

    // console.log('Confidence: ' + last.confidence);
    var time = Date.now();
    boton.style.color = "green";
    console.log(mic);
    mic.classList.remove("red");
    mic.classList.add("green");


    // if((time-lastTime)<713){//si es el eco del anterior salimos (vamos con 300 ms)
    //     console.log("repetido");
    //      return;
    //     } 
    console.log(`${last.transcript}  (${last.confidence}) [${time}]`);

    if (!hablando) voz(last.transcript);
    //   console.log(time);

    if (last.confidence < 0.5) console.log(event.results[event.results.length - 1]);
    lastTime = time;

    var td = regSTOP.test(last.transcript);
    // if (last.transcript.includes(STOP)) {
    if (td) {
        console.log('DETENER');
        recognition.stop();
    }

}

recognition.onspeechend = function () {
    // recognition.stop();
    console.log('recognition.onspeechend');
    boton.style.color = "";
    mic.classList.remove("green");
    mic.classList.add("red");
    escuchando = false;
}

recognition.onnomatch = function (event) {
    console.log("No reconoce lo dicho");
    boton.style.color = "red";
    mic.classList.remove("green");
    mic.classList.add("red");
}

recognition.onerror = function (event) {
    console.log('Error occurred in recognition: ' + event.error);
    boton.style.color = "red";
    mic.classList.remove("green");
    mic.classList.add("red");
    escuchando = false;

}

//#endregion 


//#region Speech

var synth = window.speechSynthesis;

function speak(texto) {
    // console.log(synth.getVoices());
    recognition.stop()
    hablando = true;
    console.log('EMPIEZA A HABLAR');
    if (synth.speaking) {
        console.error('speechSynthesis.speaking');
        return;
    }

    var utterThis = new SpeechSynthesisUtterance(texto);
    utterThis.onend = function (event) {
        console.log('SpeechSynthesisUtterance.onend');
        // recognition.start()
        escuchar()
        hablando = false;
        console.log('TERMINA DE HABLAR');
    }

    utterThis.onerror = function (event) {
        console.error('SpeechSynthesisUtterance.onerror');
    }

    // utterThis.voice = synth.getVoices()[7];
    // utterThis.pitch = 1.3
    // utterThis.rate = 1.3
    synth.speak(utterThis);

}
//#endregion

//#region Comandos de voz de rol

function voz(dictado) {
    // if(dictado.)

    // dictado = conNumeros(dictado)

    //Como el puto reconoce los numeros como texto tentgo que cambiar todo
    // var expresion = /localización (\d*)/i;

    var expresion = /localización (.*)/i;

    var hallado = dictado.match(expresion);

    // console.log(hallado);
    if (hallado)
        localizacion(textoaNumero(hallado[1]))
    // if (dictado.includes('localización')){
    //     dictado.
    // }

    // var erPuntos = /puntos de (golpe|vida|magia|fatiga|resistencia)/i;
    var erPuntos = /[p|j]untos de (.*)/i;
    var p = dictado.match(erPuntos);
    if (p) {
        console.log(p);
        puntos(p[1])
    }

    // var h=dictado.match(/habilidad (w+)/i);
    var h = dictado.match(/habilidad (.*)/i);
    if (h) {
        console.log(h);
        // console.log(h[1]);
        habilidad(h[1]);
    }

    var b = dictado.match(/buscar (.*)/i);
    if (b) {
        console.log(b);
        buscar(b[1])
    }

    var cf = dictado.match(/cambiar fecha a (.*)/i);
    if (cf) {
        console.log("CAMBIAR FECHA");
        console.log(cf);
        function cambiarFechaTexto(fechaTexto) {
            fechaTexto = fechaTexto.replace(/\bde \b/g, '');
            console.log(`Fecha texto después del cambio: ${fechaTexto}`);
            const meses = {
                'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
                'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
            };

            let partes = fechaTexto.toLowerCase().split(' ');
            if (partes.length === 3 || partes.length === 2) {
                let dia = parseInt(textoaNumero(partes[0]));
                let mes = meses[partes[1]];
                let año;
                if (partes.length === 2) año = fechaMundo.getFullYear();
                else
                    año = parseInt(partes[2], 10);
                console.log(`Día: ${dia}, Mes: ${mes + 1}, Año: ${año}`);
                if (!isNaN(dia) && mes !== undefined && !isNaN(año)) {
                    fechaMundo = new Date(año, mes, dia);
                    console.log(`Fecha cambiada a: ${fechaMundo}`);
                } else {
                    console.error('Formato de fecha incorrecto. Use "día mes año".');
                }
            } else {
                console.error('Formato de fecha incorrecto. Use "día mes año".');
            }

        }


        cambiarFechaTexto(cf[1]);

    }


    var av = dictado.match(/avanzar (.*) (segundo|minuto|hora|día|semana|mes|año)e*s*/i);
    if (av) {
        console.log("AVANZAR")
        console.log(av);
        //Hago el texto a numero porque ya no da en castellano las cifras
        avanzar(av[2], textoaNumero(av[1]))
    }


    var d = dictado.match(/dañar (.*) en (.*)/i);
    if (d) {
        console.log(d);
        daño(textoaNumero(d[1]), d[2]);
    }

    if (dictado.includes('inventario')) {
        cambiarTab('Inventario');
    } else if (dictado.includes('habilidades')) {
        cambiarTab('Habilidades');
    } else if (dictado.includes('combate')) {
        cambiarTab('Combate');
    } else if (dictado.includes('magia')) {
        cambiarTab('Magia');
    } else if (dictado.includes('personaje')) {
        cambiarTab('Personaje');
    }

    var cargarOnline = dictado.match(/cargar online (.*)/i);
    if (cargarOnline) {
        console.log("CARGAR ONLINE");
        cargarPersonajeOnlineParecido(cargarOnline[1]);
    }

    var cargarLocal = dictado.match(/cargar local (.*)/i);
    if (cargarLocal) {
        console.log("CARGAR LOCAL");
        cargarPersonajeLocalParecido(cargarLocal[1]);
    }

}

function buscar(busqueda) {
    const app = document.getElementById('app').__vue__;
    if (app) {
        app.iuBuscar();
        app.iniciarBusqueda(busqueda);
    }
}

function localizacion(valor) {
    console.log('LOCALIZACION:' + valor);
    let l = pj.cuerpo.darLocalizacion(valor).nombreLargo();

    //Reemplazo las abreviaciones
    // var e = / Inf /;
    // l = l.replace(e, " Inferior ");

    // e = / Sup /;
    // l = l.replace(e, " Superior ");

    // e = /I$/;
    // l = l.replace(e, "Izquierda");

    // e = /D$/;
    // l = l.replace(e, "Derecha");

    speak(l)
}

function puntos(tipo) {
    var p;
    switch (tipo) {
        case 'golpe':
        case 'vida':
        case 'salud':
            p = 'PG'
            break;
        case 'magia':
            p = 'PM'
            break;
        case 'fatiga':
            p = 'PF'
            break;

        default:
            p = tipo.substring(0, 3).toUpperCase()
            break;
    }
    console.log(p, pj.getCar(p));
    speak(pj.getCar(p) + ' puntos de' + tipo)

}

function habilidad(nombre) {
    try {
        var h = pj.getHabilidad(mayuscula(nombre));
        speak(`${h.nombre} ${h.v}%`)
    } catch (error) {
        habilidadParecida(nombre);
    }
}

function habilidadParecida(nombre) {
    var maxPeak;
    maxPeak = pj.getHabilidades().reduce((p, c) => jaroWrinker(nombre, p.nombre) > jaroWrinker(nombre, c.nombre) ? p : c);
    pj.getHabilidades().forEach(h => {

        console.log(h.nombre, jaroWrinker(nombre, h.nombre));



        //   console.log([...m.entries()].reduce((a, e ) => e[1] > a[1] ? e : a))
    });

    console.log(maxPeak.nombre);

    try {
        var h = pj.getHabilidad(mayuscula(maxPeak.nombre));
        speak(`${h.nombre} ${h.v}%`)
    } catch (error) {

    }
}

function daño(pd, loc) {
    if (isNumber(loc))
        pj.cuerpo.dañarLocalizacion(pd, loc)
    else {

        var maxSimil = pj.cuerpo.todas().reduce((p, c) => jaroWrinker(loc, p.nombreLargo()) > jaroWrinker(loc, c.nombreLargo()) ? p : c);
        maxSimil.dañar(pd);
    }

}

function avanzar(periodo, n) {
    // fechaMundo.mod(periodo,+n)
    periodo = periodo.replace('día', 'dia') //tal vez problema con í, ñapa
    console.log(fechaMundo.mod(periodo, +n));
}
//#endregion

function textoaNumero(s) {
    if (parseInt(s)) return parseInt(s);
    s = s.toLowerCase();
    s = s.replace('y', '');
    s = s.replace('veinti', 'veinte ')
    var Small = {
        'cero': 0,
        'uno': 1,
        'un': 1,
        'una': 1,
        'dos': 2,
        'tres': 3,
        'trés': 3,
        'cuatro': 4,
        'cinco': 5,
        'seis': 6,
        'séis': 6,
        'siete': 7,
        'ocho': 8,
        'nueve': 9,
        'diez': 10,
        'once': 11,
        'doce': 12,
        'trece': 13,
        'catorce': 14,
        'quince': 15,
        'dieciséis': 16,
        'diecisiete': 17,
        'dieciocho': 18,
        'diecinueve': 19,
        'veinte': 20,
        'treinta': 30,
        'cuarenta': 40,
        'cincuenta': 50,
        'sesenta': 60,
        'setenta': 70,
        'ochenta': 80,
        'noventa': 90,
        'cien': 100,
        'ciento': 100,
    };

    var Magnitud = {
        'mil': 1000,
        'millones': 1000000,
        'mil millones': 1000000000,
        'trillón': 1000000000000,
        'cuatrillones': 1000000000000000,
        'quintillón': 1000000000000000000,
        'sextillón': 1000000000000000000000,
        'septillones': 10000000000000000000000000,
        'octillón': 10000000000000000000000000000,
        'nonillion': 10000000000000000000000000000000,
        'decillón': 10000000000000000000000000000000000,
    };

    var a, n, g;

    console.log("S es :" + s);
    return text2num(s);

    function text2num(s) {
        a = s.toString().split(/[\s-]+/);
        n = 0;
        g = 0;
        a.forEach(feach);
        return n + g;
    }

    function feach(w) {
        var x = Small[w];
        if (x != null) {
            g = g + x;
        }

        else {
            x = Magnitud[w];
            if (x != null) {
                n = n + g * x
                g = 0;
            }
            else {
                alert("Unknown number: " + w);
            }
        }
    }

}

function cambiarTab(tabName) {
    const app = document.getElementById('app').__vue__;
    if (app && app.tab !== undefined) {
        app.tab = tabName;
        console.log(`Cambiando a la pestaña: ${tabName}`);
    } else {
        console.error('No se pudo cambiar la pestaña. La instancia de Vue no se encontró o la propiedad "tab" no está definida.');
    }
}