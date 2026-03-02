import DiceBox from 'https://cdn.jsdelivr.net/npm/@3d-dice/dice-box-threejs@0.0.12/dist/dice-box-threejs.es.min.js';

const diceContainer = document.getElementById('dice-container');
const rollDiceButton = document.getElementById('rollDice');

let DiceBoxInstance;
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
    DiceBoxInstance = new DiceBox( '#dice-container', {
        assetPath: '/m/img/', // Assuming dice assets are in /m/img/
        gravity: 1,
        mass: 1,
        friction: 0.8,
        restitution: 0.8,
        linearDamping: 0.9,
        angularDamping: 0.9,
        spinForce: 0.05,
        throwForce: 5,
        lightIntensity: 1.3,
        enableShadows: false,
        shadowTransparency: 0.8,
    theme_customColorset: {
      background: "#ff0000",
      foreground: "#ffffff",
      texture: "marble", // marble | ice
      material: "glass" // metal | glass | plastic | wood
    },
        offscreen: false,
        scale: 4, // Adjust scale as needed
        suspendSimulation: false,
        delay: 100,
        onReroll: (results) => {
            console.log('Reroll results:', results);
        },
        onRollComplete: (results) => {
            console.log('Roll complete results:', results);
        }
    });
    DiceBoxInstance.initialize()
        .then(() => {
            console.log('DiceBox initialized');
        })
        .catch((e) => console.error('Error initializing DiceBox:', e));
}

async function roll1d100() {
    if (!DiceBoxInstance) {
        console.error('DiceBox not initialized.');
        return;
    }
    diceContainer.style.display = 'block';
    DiceBoxInstance.updateConfig({
    theme_customColorset: {
      background: "#000000",
      foreground: "#ffffff",
      texture: "marble", // marble | ice
      material: "glass" // metal | glass | plastic | wood
    }
  });
    const resultsTens = await DiceBoxInstance.roll('1d10');


    // Roll for units (black die)

DiceBoxInstance.updateConfig({
    theme_customColorset: {
      background: "#ff0000",
      foreground: "#ffffff",
      texture: "marble", // marble | ice
      material: "glass" // metal | glass | plastic | wood
    }
  });

    const resultsUnits = await DiceBoxInstance.roll('1d10');

    const d10_1 = resultsTens.sets[0].rolls[0].value; // Primer d10 (decenas)
    const d10_2 = resultsUnits.sets[0].rolls[0].value; // Segundo d10 (unidades)

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
async function roll(dados) {
    if (!DiceBoxInstance) {
        console.error('DiceBox not initialized.');
        return;
    }
    diceContainer.style.display = 'block';
    if (dados === 'h') {
        DiceBoxInstance.updateConfig({
            theme_customColorset: {
                background: "#222222",
                foreground: "#ffffff",
                texture: "marble",
                material: "glass"
            }
        });
        const res = await DiceBoxInstance.roll('1d100+1d10');
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
        DiceBoxInstance.updateConfig({
            theme_customColorset: {
                background: "gold",
                foreground: "white",
                texture: "leopard",
                material: "plastic"
            }
        });
        const resultsUnits = await DiceBoxInstance.roll(dados);
        try {
            const total = (resultsUnits.sets || []).reduce((acc, set) => acc + (set.rolls || []).reduce((s, r) => s + (r.value || 0), 0), 0);
            if (!isNaN(total)) {
                showResultOverlay(total);
                hideDiceAndResultAfterDelay(2000);
            }
        } catch (e) {}
    }


}

async function main() {
    await initializeDiceBox();
    rollDiceButton.addEventListener('click', roll1d100);
    //add event listener keyboard 'd'
    document.addEventListener('keydown', (event) => {
        if (event.key === 'd') {
            roll('1d100+1d10@70,7');
        }
    });

}

main();
