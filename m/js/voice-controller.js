/**
 * voice-controller.js
 * Controlador de reconocimiento de voz para la aplicación de mapa.
 *
 * ARQUITECTURA ESCALABLE:
 * Para añadir nuevas órdenes, simplemente agrega una entrada al array COMANDOS:
 *
 *   { patron: /regex/i, accion: (m) => tuFuncion(m[1]) }
 *
 * donde `m` es el resultado de transcript.match(patron).
 */

// ─── Compatibilidad de navegadores ───────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    console.warn('[Voz] La API SpeechRecognition no está disponible en este navegador.');
}

// ─── Síntesis de voz ─────────────────────────────────────────────────────────
const synth = window.speechSynthesis;

/**
 * Lee un texto en voz alta en español.
 * Pausa el reconocimiento mientras habla para evitar el eco.
 * @param {string} texto
 */
function hablarTexto(texto) {
    if (!texto) return;
    VoiceController.detener();
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.onend = () => {
        if (VoiceController.activo) VoiceController.iniciar();
    };
    utterance.onerror = (e) => console.error('[Voz] Error en síntesis:', e.error);
    synth.speak(utterance);
}

// ─── Tabla de comandos ────────────────────────────────────────────────────────
/**
 * Cada comando tiene:
 *   - patron   {RegExp}   — expresión que se testea contra el transcript
 *   - accion   {Function} — función que recibe el array de match completo
 *   - ayuda    {string}   — descripción legible (usada en el panel de ayuda)
 *
 * El orden importa: los patrones se evalúan en orden y un transcript puede
 * activar varios comandos si coincide con más de uno.
 */
const COMANDOS = [
    // ── Dados ─────────────────────────────────────────────────────────────────
    {
        patron: /\b(lanzar|tirar|lanza|tira)\b.*?\b(cien|100|1\s*d\s*100|d\s*100)\b/i,
        ayuda: '«Lanzar cien» / «Tirar 1d100» — Lanza un d100',
        accion: () => {
            if (typeof ejecutarTirada === 'function') ejecutarTirada('1d100');
            else console.warn('[Voz] roll1d100 no disponible');
        }
    },
    // {
    //     patron: /\b(lanzar|tirar|lanza|tira)\s+(.+)/i,
    //     ayuda: '«Lanzar 2d6» — Lanza la notación de dados indicada',
    //     accion: (m) => {
    //         const expr = m[2].trim();
    //         if (typeof ejecutarTirada === 'function') ejecutarTirada(expr);
    //         else console.warn('[Voz] roll no disponible');
    //     }
    // },
    {
        patron: /\b(lanzar|tirar|lanza|lanzo|tira)\b(.+)/i,
        ayuda: '«Lanzar 3 dados de 6» / «Lanza un dado de diez más un dado de cuatro» — Lanza dados con texto o números',
        accion: (m) => {
            const texto = m[2].trim();
            console.log(`[Voz] Procesando: "${texto}"`);
            
            // Dividir por conectores 'más', 'y', 'mas'
            const partesTexto = texto.split(/\s+(?:más|y|mas)\s+/i);
            const partes = [];
            
            partesTexto.forEach((parte, index) => {
                // Extraer "X dados de Y" de cada parte
                const regexDados = /([a-zA-Záéíóúñü\s\d]+)\s+dado[s]?\s+de\s+([a-zA-Záéíóúñü\s\d]+)/i;
                const match = regexDados.exec(parte.trim());
                
                if (match) {
                    const textoCantidad = match[1].trim();
                    const textoCaras = match[2].trim();
                    
                    // Convertir texto a números
                    const cantidad = parseInt(textoCantidad) || textoaNumero(textoCantidad);
                    const caras = parseInt(textoCaras) || textoaNumero(textoCaras);
                    
                    if (cantidad && cantidad > 0 && caras && caras > 0) {
                        partes.push(`${cantidad}d${caras}`);
                        console.log(`[Voz] Parte ${index + 1}: "${textoCantidad} dados de ${textoCaras}" -> "${cantidad}d${caras}"`);
                    } else {
                        console.warn('[Voz] No se pudo interpretar la parte:', parte);
                    }
                } else {
                    console.warn('[Voz] No se encontró patrón de dados en:', parte);
                }
            });
            
            if (partes.length > 0) {
                const expr = partes.join('+');
                console.log(`[Voz] Expresión final: "${expr}"`);
                if (typeof ejecutarTirada === 'function') ejecutarTirada(expr);
                else console.warn('[Voz] ejecutarTirada no disponible');
            } else {
                console.warn('[Voz] No se encontraron patrones de dados válidos en:', texto);
            }
        }
    },

    // ── Zoom / Cámara ─────────────────────────────────────────────────────────
    {
        patron: /\b(acercar|zoom\s*in|ampliar)\b/i,
        ayuda: '«Acercar» — Hace zoom in en el mapa',
        accion: () => document.getElementById('zoomIn')?.click()
    },
    {
        patron: /\b(alejar|zoom\s*out|reducir)\b/i,
        ayuda: '«Alejar» — Hace zoom out en el mapa',
        accion: () => document.getElementById('zoomOut')?.click()
    },
    {
        patron: /\b(reset|restablecer|centrar|vista\s*inicial)\b/i,
        ayuda: '«Centrar» / «Restablecer» — Restablece la vista del mapa',
        accion: () => document.getElementById('resetView')?.click()
    },

    // ── Personajes ────────────────────────────────────────────────────────────
    {
        patron: /\bañadir\s+(npc|no\s*jugador)\b/i,
        ayuda: '«Añadir NPC» — Abre el diálogo de selección de NPC',
        accion: () => document.getElementById('addNpcBtn')?.click()
    },
    {
        patron: /\bbuscar\s+(.+)/i,
        ayuda: '«Buscar [nombre]» — Centra el mapa en el personaje indicado',
        accion: (m) => {
            const nombre = m[1].trim();
            const input = document.getElementById('searchInput');
            const btn = document.getElementById('searchButton');
            if (input && btn) {
                input.value = nombre;
                btn.click();
            }
        }
    },
    {
        patron: /\bplanificar\s+ruta\b/i,
        ayuda: '«Planificar ruta» — Activa el modo de planificación de rutas',
        accion: () => {
            if (typeof CharacterController !== 'undefined') CharacterController.toggleRoutePlanning();
        }
    },
    //seleccionar todos los pj
    {
        patron: /\bseleccionar\s+todos\b/i,
        ayuda: '«Seleccionar todos» — Selecciona todos los personajes',
        accion: () => {
            if (typeof CharacterController !== 'undefined') CharacterController.selectAll();
        }
    },
    //deseleccionar todos los pj
    {
        // 'de seleccionar' tambien debe aparecer
        patron: /\bde\s+seleccionar\s+todos\b/i,
        ayuda: '«Deseleccionar todos» — Deselecciona todos los personajes',
        accion: () => {
            if (typeof CharacterController !== 'undefined') CharacterController.deselectAll();
        }
    },

    //invertir selección de los pj
    {
        patron: /\binvertir\s+selección\b/i,
        ayuda: '«Invertir selección» — Invierte la selección de personajes',
        accion: () => {
            if (typeof CharacterController !== 'undefined') {
                CharacterController.characters.forEach((character) => {
                    CharacterController.toggleSelection(character);
                });
            }
        }
    },

    // ── Sincronización ────────────────────────────────────────────────────────
    {
        patron: /\b(sincronizar|sync|conectar|desconectar)\b/i,
        ayuda: '«Sincronizar» — Pulsa el botón de sync',
        accion: () => document.getElementById('syncButton')?.click()
    },

    // ── Panel lateral ─────────────────────────────────────────────────────────
    {
        patron: /\b(abrir|mostrar|cerrar)\s+(panel|menú)\b/i,
        ayuda: '«Abrir panel» / «Cerrar menú» — Alterna el panel lateral',
        accion: () => document.getElementById('togglePanel')?.click()
    },

    // ── Capas del mapa ────────────────────────────────────────────────────────
    {
        patron: /\bbuscar\s+capa\s+(.+)/i,
        ayuda: '«Buscar capa [nombre]» — Filtra la lista de capas',
        accion: (m) => {
            const input = document.getElementById('layerSearch');
            if (input) {
                input.value = m[1].trim();
                input.dispatchEvent(new Event('input'));
            }
        }
    },

    // ── Ocultar / mostrar camino ──────────────────────────────────────────────
    {
        patron: /\b(ocultar|mostrar)\s+camino\b/i,
        ayuda: '«Ocultar camino» / «Mostrar camino» — Alterna la visibilidad del camino',
        accion: () => {
            if (typeof CharacterController !== 'undefined') CharacterController.togglePath();
        }
    },

    // ── Ayuda ─────────────────────────────────────────────────────────────────
    {
        patron: /\b(ayuda|comandos|qué\s+puedo\s+decir)\b/i,
        ayuda: '«Ayuda» — Lee en voz alta la lista de comandos disponibles',
        accion: () => VoiceController.leerAyuda()
    },

    // ── Parar el micrófono ────────────────────────────────────────────────────
    {
        patron: /\b(para|parar|detener|stop|silencio|fin\s+de\s+voz)\b/i,
        ayuda: '«Para» / «Parar» / «Stop» — Detiene el reconocimiento de voz',
        accion: () => VoiceController.desactivar()
    },
];

// ─── Motor de reconocimiento de voz ──────────────────────────────────────────
const VoiceController = (() => {
    let recognition = null;
    let _activo = false;
    let _inicializado = false;

    /** Inicializa el objeto SpeechRecognition (solo una vez) */
    function _crearRecognition() {
        if (!SpeechRecognition) return null;
        const r = new SpeechRecognition();
        r.continuous = true;
        r.lang = 'es-ES';
        r.interimResults = false;
        r.maxAlternatives = 3;

        r.onresult = (event) => {
            const resultado = event.results[event.results.length - 1][0];
            const transcript = resultado.transcript.trim().toLowerCase();
            console.log(`[Voz] Escuchado: "${transcript}" (confianza: ${(resultado.confidence * 100).toFixed(0)}%)`);
            _procesarTranscript(transcript);
            _actualizarUI(true);
        };

        r.onspeechend = () => {
            console.log('[Voz] Silencio detectado');
            _actualizarUI(false);
        };

        r.onerror = (event) => {
            // "no-speech" es normal, no lo mostramos como error
            if (event.error !== 'no-speech') {
                console.error('[Voz] Error:', event.error);
                _actualizarUI(false, true);
            }
        };

        r.onend = () => {
            // Reiniciar automáticamente si sigue activo
            if (_activo) {
                try { r.start(); } catch (_) { /* ya estaba iniciado */ }
            } else {
                _actualizarUI(false);
            }
        };

        return r;
    }

    /** Procesa el texto reconocido contra todos los comandos */
    function _procesarTranscript(transcript) {
        let ejecutados = 0;
        for (const cmd of COMANDOS) {
            const match = transcript.match(cmd.patron);
            if (match) {
                console.log(`[Voz] Comando reconocido: ${cmd.ayuda}`);
                try {
                    cmd.accion(match);
                    ejecutados++;
                } catch (e) {
                    console.error('[Voz] Error ejecutando comando:', e);
                }
            }
        }
        if (ejecutados === 0) {
            console.log('[Voz] Sin comandos reconocidos para:', transcript);
            _mostrarToast(`No reconocido: "${transcript}"`);
        }
    }

    /** Actualiza el botón de micrófono según el estado */
    function _actualizarUI(hablando, error = false) {
        const btn = document.getElementById('voiceBtn');
        const indicator = document.getElementById('voiceIndicator');
        if (!btn) return;

        btn.classList.toggle('voice-active', hablando && !error);
        btn.classList.toggle('voice-error', error);
        if (indicator) {
            indicator.textContent = error ? '❌' : hablando ? '🔴' : (_activo ? '🎙️' : '🎤');
        }
    }

    /** Muestra un toast temporal con el último texto reconocido */
    function _mostrarToast(texto) {
        let toast = document.getElementById('voiceToast');
        if (!toast) return;
        toast.textContent = texto;
        toast.classList.add('voice-toast-visible');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => toast.classList.remove('voice-toast-visible'), 3000);
    }

    // ── API pública ───────────────────────────────────────────────────────────
    return {
        get activo() { return _activo; },

        /** Inicializa el reconocimiento y activa la escucha */
        iniciar() {
            if (!_inicializado) {
                recognition = _crearRecognition();
                _inicializado = true;
            }
            if (!recognition) {
                alert('Tu navegador no soporta reconocimiento de voz.');
                return;
            }
            _activo = true;
            try {
                recognition.start();
                console.log('[Voz] Reconocimiento iniciado');
            } catch (e) {
                // DOMException: ya estaba corriendo
            }
            _actualizarUI(false);
        },

        /** Pausa temporalmente el reconocimiento (sin desactivar el flag activo) */
        detener() {
            try { recognition?.stop(); } catch (_) { }
        },

        /** Desactiva completamente el reconocimiento */
        desactivar() {
            _activo = false;
            try { recognition?.stop(); } catch (_) { }
            _actualizarUI(false);
            console.log('[Voz] Reconocimiento desactivado');
        },

        /** Alterna entre activo y desactivado */
        alternar() {
            if (_activo) this.desactivar();
            else this.iniciar();
        },

        /** Lee en voz alta la lista de comandos disponibles */
        leerAyuda() {
            const lista = COMANDOS
                .filter(c => c.ayuda)
                .map(c => c.ayuda)
                .join('. ');
            hablarTexto('Comandos disponibles: ' + lista);
        },

        /** Devuelve la lista de comandos (para renderizar la ayuda en pantalla) */
        getComandos() {
            return COMANDOS.filter(c => c.ayuda).map(c => c.ayuda);
        },

        /**
         * Añade un nuevo comando en tiempo de ejecución.
         * Permite que otros módulos amplíen el sistema sin tocar este archivo.
         * @param {{ patron: RegExp, accion: Function, ayuda?: string }} comando
         */
        registrarComando(comando) {
            COMANDOS.push(comando);
            console.log('[Voz] Nuevo comando registrado:', comando.ayuda ?? comando.patron);
        }
    };
})();


//función auxiliar para convertir texto a número
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

// ─── Arranque ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('voiceBtn');
    if (btn) {
        btn.addEventListener('click', () => VoiceController.alternar());
    }
    console.log('[Voz] VoiceController listo. Pulsa el botón 🎤 para activar.');
});
