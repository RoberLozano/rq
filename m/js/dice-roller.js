import DiceBox from 'https://cdn.jsdelivr.net/npm/@3d-dice/dice-box-threejs@0.0.12/dist/dice-box-threejs.es.min.js';

const diceContainer = document.getElementById('dice-container');
const rollDiceButton = document.getElementById('rollDice');
let unitsColor = colorPickerUnits.value;
let tensColor = colorPickerTens.value;



// Crear contenedores separados para cada dado
const tensContainer = document.createElement('div');
tensContainer.id = 'tens-container';
tensContainer.style.position = 'absolute';
tensContainer.style.left = '0';
tensContainer.style.width = '50%';
tensContainer.style.height = '100%';
diceContainer.appendChild(tensContainer);

const unitsContainer = document.createElement('div');
unitsContainer.id = 'units-container';
unitsContainer.style.position = 'absolute';
unitsContainer.style.right = '0';
unitsContainer.style.width = '50%';
unitsContainer.style.height = '100%';
diceContainer.appendChild(unitsContainer);

let DiceBoxTens, DiceBoxUnits;
let diceResultOverlay;

function showResultOverlay(text) {
    if (!diceResultOverlay) {
        diceResultOverlay = document.createElement('div');
        diceResultOverlay.style.position = 'absolute';
        diceResultOverlay.style.inset = '0';
        diceResultOverlay.style.display = 'flex';
        diceResultOverlay.style.alignItems = 'center';
        diceResultOverlay.style.justifyContent = 'center';
        diceResultOverlay.style.fontSize = 'min(30vw, 30vh)';
        diceResultOverlay.style.color = '#ffffff';
        diceResultOverlay.style.textShadow = '0 0 8px #000, 0 0 20px #000';
        diceResultOverlay.style.zIndex = '10000';
        diceResultOverlay.style.pointerEvents = 'none';
        diceResultOverlay.style.opacity = '0';
        diceResultOverlay.style.transition = 'opacity 200ms ease';
        diceContainer.appendChild(diceResultOverlay);
    }
    diceResultOverlay.textContent = String(text);
    diceContainer.style.display = 'block';
    requestAnimationFrame(() => {
        diceResultOverlay.style.opacity = '1';
    });
}

function hideDiceAndResultAfterDelay(ms = 2000) {
    setTimeout(() => {
        if (diceResultOverlay) {
            diceResultOverlay.style.opacity = '0';
            setTimeout(() => {
                if (diceResultOverlay && diceResultOverlay.parentNode) {
                    diceResultOverlay.parentNode.removeChild(diceResultOverlay);
                }
                diceResultOverlay = null;
                diceContainer.style.display = 'none';
            }, 250);
        } else {
            diceContainer.style.display = 'none';
        }
    }, ms);
}

async function initializeDiceBox() {
    console.log("initializeDiceBox");
    console.log(tensColor);
    console.log(unitsColor);
 
    // Instancia para decenas (negro)
    DiceBoxTens = new DiceBox('#tens-container', {
        assetPath: '/m/img/',
        gravity: 1,
        mass: 1,
        friction: 0.8,
        restitution: 0.8,
        linearDamping: 0.9,
        angularDamping: 0.9,
        spinForce: 0.05,
        throwForce: 5,
        lightIntensity: 1.3,
        enableShadows: true,
        shadowTransparency: 0.8,
        theme_customColorset: {
            background:tensColor,
            foreground: "#ffffff",
            texture: "marble",
            material: "glass"
        },
        offscreen: false,
        scale: 4,
        suspendSimulation: false,
        delay: 100,
        onReroll: (results) => {
            console.log('Tens Reroll results:', results);
        },
        onRollComplete: (results) => {
            console.log('Tens Roll complete results:', results);
        }
    });

    // Instancia para unidades (rojo)
    DiceBoxUnits = new DiceBox('#units-container', {
        assetPath: '/m/img/',
        gravity: 1,
        mass: 1,
        friction: 0.8,
        restitution: 0.8,
        linearDamping: 0.9,
        angularDamping: 0.9,
        spinForce: 0.05,
        throwForce: 5,
        lightIntensity: 1.3,
        enableShadows: true,
        shadowTransparency: 0.8,
        theme_customColorset: {
            background: unitsColor,
            foreground: "#ffffff",
            texture: "marble",
            material: "glass"
        },
        offscreen: false,
        scale: 4,
        suspendSimulation: false,
        delay: 500,
        onReroll: (results) => {
            console.log('Units Reroll results:', results);
        },
        onRollComplete: (results) => {
            console.log('Units Roll complete results:', results);
        }
    });

    
    await Promise.all([
        DiceBoxTens.initialize(),
        DiceBoxUnits.initialize()
    ]).then(() => {
        console.log('DiceBoxes initialized');
    }).catch((e) => console.error('Error initializing DiceBoxes:', e));
}

async function roll1d100() {
    if (!DiceBoxTens || !DiceBoxUnits) {
        console.error('DiceBoxes not initialized.');
        return;
    }
    diceContainer.style.display = 'block';
    
    // Lanzar ambos dados simultáneamente
    const [resultsTens, resultsUnits] = await Promise.all([
        DiceBoxTens.roll('1d10'),
        DiceBoxUnits.roll('1d10')
    ]);

    const d10_1 = resultsTens.sets[0].rolls[0].value; // Primer d10 (decenas - negro)
    const d10_2 = resultsUnits.sets[0].rolls[0].value; // Segundo d10 (unidades - rojo)

    let total;
    if (d10_1 === 0 && d10_2 === 0) {
        total = 100;
    } else {
        // Asumiendo que el primer dado es para las decenas (0, 10, 20...) y el segundo para las unidades (0-9)
        const tens = d10_1 === 10 ? 0 : d10_1 * 10;
        const units = d10_2 === 10 ? 0 : d10_2;

        total = tens + units;
    }
    console.log(`Roll 1d100: ${d10_1}${d10_2} -> ${total}`);
    showResultOverlay(total);
    hideDiceAndResultAfterDelay(2000);
}

function setDiceColor(type, color, texture = "marble.webp", material = "glass", numeros="#ffffff") {

    console.log("Setdicecolor");
    
    // Normalizar el color: si es un nombre, convertirlo a formato válido
    let normalizedColor = color;
    if (!color.startsWith('#')) {
        // Si no es hex, asumir que es un nombre de color válido para CSS
        normalizedColor = color;
    }
    
    // Usar el nombre de textura sin extensión
    const textureName = texture.replace('.webp', '');
    
    const config = {
        theme_customColorset: {
            background: normalizedColor,
            foreground: numeros,
            texture: textureName,
            material: material
        }
    };
    
    if (type === 'tens' && DiceBoxTens) {
        DiceBoxTens.updateConfig(config);
        console.log(`Color de decenas cambiado a: ${normalizedColor}, textura: ${textureName}, material: ${material}`);
    } else if (type === 'units' && DiceBoxUnits) {
        DiceBoxUnits.updateConfig(config);
        console.log(`Color de unidades cambiado a: ${normalizedColor}, textura: ${textureName}, material: ${material}`);
    } else {
        console.error(`Tipo de dado inválido: ${type}. Use 'tens' o 'units'.`);
    }
}



async function roll(dados) {
    if (!DiceBoxTens) {
        console.error('DiceBox not initialized.');
        return;
    }
    diceContainer.style.display = 'block';
    if (dados === 'h') {
        DiceBoxTens.updateConfig({
            theme_customColorset: {
                background: "#222222",
                foreground: "#ffffff",
                texture: "marble",
                material: "glass"
            }
        });
        const res = await DiceBoxTens.roll('1d100+1d10');
        const values = (res.sets || []).flatMap(s => (s.rolls || []).map(r => r.value || 0));
        const tensVal = Math.max(...values);
        const unitsVal = Math.min(...values);
        let tens = tensVal === 100 ? 0 : tensVal;
        let units = unitsVal === 10 ? 0 : unitsVal;
        let total = (tens === 0 && units === 0) ? 100 : (tens + units);
        if (total < 1) total = 1;
        if (total > 100) total = 100;
        showResultOverlay(total);
        hideDiceAndResultAfterDelay(2000);
    } else {
        DiceBoxTens.updateConfig({
            theme_customColorset: {
                background: "gold",
                foreground: "white",
                texture: "leopard",
                material: "plastic"
            }
        });
        const resultsUnits = await DiceBoxTens.roll(dados);
        try {
            const total = (resultsUnits.sets || []).reduce((acc, set) => acc + (set.rolls || []).reduce((s, r) => s + (r.value || 0), 0), 0);
            if (!isNaN(total)) {
                showResultOverlay(total);
                hideDiceAndResultAfterDelay(2000);
            }
        } catch (e) { }
    }


}

// Lista de texturas disponibles con traducciones al español
const textureTranslations = {
    'marble.webp': 'Mármol',
    'ice.webp': 'Hielo',
    'wood.webp': 'Madera',
    'metal.webp': 'Metal',
    'leopard.webp': 'Leopardo',
    'cheetah.webp': 'Guepardo',
    'tiger.webp': 'Tigre',
    'stone.webp': 'Piedra',
    'paper.webp': 'Papel',
    'dragon.webp': 'Dragón',
    'feather.webp': 'Pluma',
    'fire.webp': 'Fuego',
    'water.webp': 'Agua',
    'stars.webp': 'Estrellas',
    'skulls.webp': 'Calaveras',
    'stainedglass.webp': 'Vitral',
    'glitter.webp': 'Brillo',
    'speckles.webp': 'Manchitas',
    'noise.webp': 'Ruido',
    'cloudy.webp': 'Nublado',
    'bronze01.webp': 'Bronce 1',
    'bronze02.webp': 'Bronce 2',
    'bronze03.webp': 'Bronce 3',
    'bronze04.webp': 'Bronce 4',
    'bronze03a.webp': 'Bronce 3A',
    'bronze03b.webp': 'Bronce 3B',
    'astral.webp': 'Astral',
    'cloudy.alt.webp': 'Nublado Alt',
    'dragon-bump.webp': 'Dragón Relieve',
    'feather-bump.webp': 'Pluma Relieve',
    'glitter-alpha.webp': 'Brillo Alfa',
    'glitter-bump.webp': 'Brillo Relieve',
    'lizard.webp': 'Lagarto',
    'lizard-bump.webp': 'Lagarto Relieve',
    'metal-bump.webp': 'Metal Relieve',
    'noise-thin-film.webp': 'Ruido Fino',
    'paper-bump.webp': 'Papel Relieve',
    'stainedglass-bump.webp': 'Vitral Relieve'
};

function getTextureList() {
    return Object.keys(textureTranslations);
}

function getTextureDisplayName(filename) {
    return textureTranslations[filename] || filename.replace('.webp', '').replace(/-/g, ' ');
}

function populateTextureSelector() {
    const selector = document.getElementById('textureSelector');
    if (!selector) return;

    // Limpiar opciones existentes
    selector.innerHTML = '';

    // Agregar opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = 'marble.webp';
    defaultOption.textContent = 'Mármol';
    selector.appendChild(defaultOption);

    // Agregar todas las texturas disponibles
    getTextureList().forEach(texture => {
        const option = document.createElement('option');
        option.value = texture;
        option.textContent = getTextureDisplayName(texture);
        selector.appendChild(option);
    });
}

async function main() {
    await initializeDiceBox();
    populateTextureSelector(); // Llenar el selector de texturas
    rollDiceButton.addEventListener('click', roll1d100);

            document.getElementById('colorPickerUnits').addEventListener('change', () => {
            unitsColor = document.getElementById('colorPickerUnits').value;
            console.log(unitsColor);
            const texture = document.getElementById('textureSelector').value;
            const material = document.getElementById('materialSelector').value;
            setDiceColor('units', unitsColor, texture, material);
        }); 

        document.getElementById('colorPickerTens').addEventListener('change', () => {
            tensColor = document.getElementById('colorPickerTens').value;
            console.log(tensColor);
            const texture = document.getElementById('textureSelector').value;
            const material = document.getElementById('materialSelector').value;
            setDiceColor('tens', tensColor, texture, material);
        });

        // Event listener para el selector de textura
        document.getElementById('textureSelector').addEventListener('change', () => {
            const texture = document.getElementById('textureSelector').value;
            console.log(`Textura cambiada a: ${texture}`);
            // Aplicar la nueva textura a ambos dados con sus colores actuales
            const material = document.getElementById('materialSelector').value;
            setDiceColor('tens', tensColor, texture, material);
            setDiceColor('units', unitsColor, texture, material);
        });

        // Event listener para el selector de material
        document.getElementById('materialSelector').addEventListener('change', () => {
            const material = document.getElementById('materialSelector').value;
            console.log(`Material cambiado a: ${material}`);
            // Aplicar el nuevo material a ambos dados con sus configuraciones actuales
            const texture = document.getElementById('textureSelector').value;
            setDiceColor('tens', tensColor, texture, material);
            setDiceColor('units', unitsColor, texture, material);
        });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'd') {
            console.log("d PULSADO");

            // roll('1d100+1d10@70,7');
            roll(dadoTxt.value);
            // setDiceColor('units','yellow');
        }
    });

}

main();

export { roll1d100 };

