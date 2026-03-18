import DiceBox from 'https://cdn.jsdelivr.net/npm/@3d-dice/dice-box-threejs@0.0.12/dist/dice-box-threejs.es.min.js';

const diceContainer = document.getElementById('dice-container');
const rollDiceButton = document.getElementById('rollDice');
let unitsColor = colorPickerUnits.value;
let tensColor = colorPickerTens.value;

// Crear contenedores separados para cada dado
const tensContainer = document.createElement('div');
tensContainer.id = 'tens-container';
Object.assign(tensContainer.style, { position: 'absolute', left: '0', width: '50%', height: '100%' });
diceContainer.appendChild(tensContainer);

const unitsContainer = document.createElement('div');
unitsContainer.id = 'units-container';
Object.assign(unitsContainer.style, { position: 'absolute', right: '0', width: '50%', height: '100%' });
diceContainer.appendChild(unitsContainer);

let DiceBoxTens, DiceBoxUnits;
let diceResultOverlay;
const diceAssetPath = new URL('../img/', import.meta.url).href;

function showResultOverlay(text) {
    if (!diceResultOverlay) {
        diceResultOverlay = document.createElement('div');
        Object.assign(diceResultOverlay.style, {
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'min(30vw, 30vh)',
            color: '#ffffff',
            textShadow: '0 0 8px #000, 0 0 20px #000',
            zIndex: '10000',
            pointerEvents: 'none',
            opacity: '0',
            transition: 'opacity 200ms ease'
        });
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
                diceResultOverlay?.remove();
                diceResultOverlay = null;
                diceContainer.style.display = 'none';
            }, 250);
        } else {
            diceContainer.style.display = 'none';
        }
    }, ms);
}

// Configuración base compartida por ambas instancias de DiceBox
function baseDiceConfig(color, delay) {
    return {
        assetPath: diceAssetPath,
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
            background: color,
            foreground: '#ffffff',
            texture: 'marble',
            material: 'glass'
        },
        offscreen: false,
        scale: 4,
        suspendSimulation: false,
        delay,
        onReroll: (results) => console.log('Reroll results:', results),
        onRollComplete: (results) => console.log('Roll complete results:', results)
    };
}

async function initializeDiceBox() {
    DiceBoxTens = new DiceBox('#tens-container', baseDiceConfig(tensColor, 100));
    DiceBoxUnits = new DiceBox('#units-container', baseDiceConfig(unitsColor, 500));

    try {
        await Promise.all([DiceBoxTens.initialize(), DiceBoxUnits.initialize()]);
        console.log('DiceBoxes initialized');
    } catch (e) {
        console.error('Error initializing DiceBoxes:', e);
    }
}

async function roll1d100(resultadoEspecifico = null) {
    if (!DiceBoxTens || !DiceBoxUnits) {
        console.error('DiceBoxes not initialized.');
        return;
    }
    diceContainer.style.display = 'block';

    let d10_1, d10_2, total;

    if (resultadoEspecifico !== null && resultadoEspecifico >= 1 && resultadoEspecifico <= 100) {
        // Calcular decenas/unidades para resultado forzado
        if (resultadoEspecifico === 100) {
            d10_1 = d10_2 = 0;
        } else {
            d10_1 = Math.floor(resultadoEspecifico / 10);
            d10_2 = resultadoEspecifico % 10;
        }
        total = resultadoEspecifico;
        await Promise.all([
            DiceBoxTens.roll(`1d10@${d10_1}`),
            DiceBoxUnits.roll(`1d10@${d10_2}`)
        ]);
        console.log(`Roll 1d100 forzado: ${d10_1}${d10_2} -> ${total}`);
    } else {
        const [resultsTens, resultsUnits] = await Promise.all([
            DiceBoxTens.roll('1d10'),
            DiceBoxUnits.roll('1d10')
        ]);

        d10_1 = resultsTens.sets[0].rolls[0].value;
        d10_2 = resultsUnits.sets[0].rolls[0].value;

        if (d10_1 === 0 && d10_2 === 0) {
            total = 100;
        } else {
            const tens = (d10_1 === 10 ? 0 : d10_1) * 10;
            const units = d10_2 === 10 ? 0 : d10_2;
            total = tens + units;
        }
        console.log(`Roll 1d100: ${d10_1}${d10_2} -> ${total}`);
    }

    showResultOverlay(total);
    hideDiceAndResultAfterDelay(2000);
    return total;
}

function setDiceColor(type, color, texture = 'marble.webp', material = 'glass', numeros = '#ffffff') {
    const textureName = texture.replace('.webp', '');
    const config = {
        theme_customColorset: {
            background: color,
            foreground: numeros,
            texture: textureName,
            material
        }
    };

    if (type === 'tens' && DiceBoxTens) {
        DiceBoxTens.updateConfig(config);
        console.log(`Color de decenas cambiado a: ${color}, textura: ${textureName}, material: ${material}`);
    } else if (type === 'units' && DiceBoxUnits) {
        DiceBoxUnits.updateConfig(config);
        console.log(`Color de unidades cambiado a: ${color}, textura: ${textureName}, material: ${material}`);
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
            theme_customColorset: { background: '#222222', foreground: '#ffffff', texture: 'marble', material: 'glass' }
        });
        const res = await DiceBoxTens.roll('1d100+1d10');
        const values = (res.sets || []).flatMap(s => (s.rolls || []).map(r => r.value || 0));
        const tensVal = Math.max(...values);
        const unitsVal = Math.min(...values);
        const tens = tensVal === 100 ? 0 : tensVal;
        const units = unitsVal === 10 ? 0 : unitsVal;
        const total = Math.min(100, Math.max(1, tens === 0 && units === 0 ? 100 : tens + units));
        showResultOverlay(total);
        hideDiceAndResultAfterDelay(2000);
        return total;
    } else {
        const resultsUnits = await DiceBoxTens.roll(dados);
        try {
            const total = (resultsUnits.sets || [])
                .reduce((acc, set) => acc + (set.rolls || []).reduce((s, r) => s + (r.value || 0), 0), 0);
            if (!isNaN(total)) {
                showResultOverlay(total);
                hideDiceAndResultAfterDelay(2000);
            }
        } catch (e) { /* resultado no interpretable */ }
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
    return textureTranslations[filename] ?? filename.replace('.webp', '').replace(/-/g, ' ');
}

function populateTextureSelector() {
    const selector = document.getElementById('textureSelector');
    if (!selector) return;

    selector.innerHTML = '';
    for (const texture of getTextureList()) {
        const option = document.createElement('option');
        option.value = texture;
        option.textContent = getTextureDisplayName(texture);
        selector.appendChild(option);
    }
}

// Helpers para leer los selectores de estilo
function getSelectedTexture() { return document.getElementById('textureSelector').value; }
function getSelectedMaterial() { return document.getElementById('materialSelector').value; }

function applyStyleToBoth() {
    const texture = getSelectedTexture();
    const material = getSelectedMaterial();
    setDiceColor('tens', tensColor, texture, material);
    setDiceColor('units', unitsColor, texture, material);
}

async function main() {
    await initializeDiceBox();
    populateTextureSelector();
    rollDiceButton.addEventListener('click', roll1d100);

    document.getElementById('colorPickerUnits').addEventListener('change', () => {
        unitsColor = document.getElementById('colorPickerUnits').value;
        setDiceColor('units', unitsColor, getSelectedTexture(), getSelectedMaterial());
    });

    document.getElementById('colorPickerTens').addEventListener('change', () => {
        tensColor = document.getElementById('colorPickerTens').value;
        setDiceColor('tens', tensColor, getSelectedTexture(), getSelectedMaterial());
    });

    document.getElementById('textureSelector').addEventListener('change', applyStyleToBoth);
    document.getElementById('materialSelector').addEventListener('change', applyStyleToBoth);

    tirarDado.addEventListener('click', () => roll(dadoTxt.value));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'd') roll(dadoTxt.value);
    });
}

main();

export { roll1d100, roll };
