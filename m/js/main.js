/**
 * Main Application Script
 * Initializes and coordinates all application modules
 */

// Global variables
let svgElement = null;
let characters = new Map();
let npcTokens = []; // Array to store available NPC tokens
let fecha = null;
const params = new URLSearchParams(window.location.search);
let pp = params.get('p') || null;
/**
 * mapa por parámetro url
 */
let pmap = params.get('mapa') || params.get('map');
let pzoom = params.get('zoom') || params.get('zum');
let ptime = params.get('time') || params.get('t');

console.info(pmap);

// let unitsColor = colorPickerUnits.value;
// let tensColor = colorPickerTens.value;

// Document ready function
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Agregar función para obtener parámetros de la URL


        // Initialize character controller
        CharacterController.init();

        // Initialize controllers
        MapController.init();
        LayerController.init();
        SyncController.init();

        // Setup side panel toggle
        const togglePanelBtn = document.getElementById('togglePanel');
        const sidePanel = document.getElementById('sidePanel');
        fecha = document.getElementById('fecha');

        fecha.value = fechaMundo.fechahora();
        fecha.addEventListener('change', () => {

            fechaMundo = new Date(fecha.value);
            console.log(fechaMundo);
            SyncController.cambiarFecha(fecha.value);
        });
        togglePanelBtn.addEventListener('click', () => {
            sidePanel.classList.toggle('open');
        });

        // Setup file input for loading SVG maps
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const url = URL.createObjectURL(file);
                await MapController.loadMapFromURL(url);
            }
        });

        // Setup character input for adding characters
        const characterInput = document.getElementById('characterInput');
        characterInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                Array.from(e.target.files).forEach(file => {
                    const url = URL.createObjectURL(file);
                    CharacterController.addCharacterToMap(url);
                });
            }
        });

        // Setup NPC modal
        setupNpcModal();

        // Close context menu on document click
        // document.addEventListener('click', () => {
        //     document.getElementById('characterContextMenu').style.display = 'none';
        // });

        // Prevent context menu on SVG container
        const svgContainer = document.getElementById('svg-container');
        svgContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Setup context menu item handlers
        document.getElementById('mapTogglePath').addEventListener('click', () => {
            CharacterController.togglePath();
        });


        // Escala del mapa
        document.getElementById('mapScaleValue').addEventListener('change', (e) => {
            CharacterController.setDistanceScale(e.target.value);
        });

        document.getElementById('deleteRoute').addEventListener('click', () => {
            CharacterController.deleteRoute();
            document.getElementById('characterContextMenu').style.display = 'none';
        });

        document.getElementById('planRoute').addEventListener('click', () => {
            CharacterController.toggleRoutePlanning();
            document.getElementById('characterContextMenu').style.display = 'none';
        });

        // Setup target mode button
        document.getElementById('bObjetivo').addEventListener('click', () => {
            CharacterController.startTargetMode();
        });

        document.getElementById('deleteCharacter').addEventListener('click', () => {
            CharacterController.deleteCharacter();
            document.getElementById('characterContextMenu').style.display = 'none';
        });

        document.getElementById('showStats').addEventListener('click', () => {
            CharacterController.showStats('modal');
            document.getElementById('characterContextMenu').style.display = 'none';
        });

        document.getElementById('showCharacterCard').addEventListener('click', () => {
            CharacterController.showStats('card');
            document.getElementById('characterContextMenu').style.display = 'none';
        });

        document.getElementById('attackCharacter').addEventListener('click', () => {
            CharacterController.startAttackMode();
            document.getElementById('characterContextMenu').style.display = 'none';
        });

        document.getElementById('togglePortrait').addEventListener('click', () => {

            CharacterController.activeCharacter.classList.toggle("portrait");
            CharacterUtils.portada(CharacterController.activeCharacter);

            document.getElementById('characterContextMenu').style.display = 'none';
        });


        //Menus de contexto opcional
        ctxOpcional.addEventListener('click', () => {
            const all = document.getElementsByClassName('opcional');
            for (const el of all)
                el.hidden = !ctxOpcional.checked;
        });


        //Ctrl+a para seleccionar todo, Ctrl+d para deseleccionar todo, Ctrl+i para invertir selección
        document.addEventListener('keydown', (e) => {
            // Ctrl+a para seleccionar todo
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                CharacterController.selectAll();
            }
            //Ctrl+d para deseleccionar todo
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                CharacterController.deselectAll();
            }
            //Ctrl+i para invertir selección
            if (e.ctrlKey && e.key === 'i') {
                e.preventDefault();
                CharacterController.characters.forEach((character) => {
                    CharacterController.toggleSelection(character);
                });
            }

            // + para hacer zoom
            if (e.key === '+') {
                // e.preventDefault();
                MapController.zoomIn();
            }
            // - para hacer zoom out
            if (e.key === '-') {
                // e.preventDefault();
                MapController.zoomOut();
            }


        });


        // Load default map
        try {
            console.log(pmap);

            if (pmap) {
                await MapController.loadMapFromURL(`../mapas/${pmap}.svg`);
                console.log('Parameter map loaded successfully');
            }
            else
                await MapController.loadMapFromURL(CONFIG.defaultMapUrl);

            console.log('Default map loaded successfully');

            if (pzoom) {
                console.log('Zoom parameter:', pzoom);
                //delay 1.5 seconds
                setTimeout(() => {
                    MapController.zoomToText(pzoom);
                }, 1000);

                //Hacer zoom x 10
                setTimeout(() => {
                    MapController.zoomIn(10);
                }, 1050);
            }
            if (ptime) {
                console.log('Time parameter:', ptime);
                fechaMundo = new Date(ptime);
                console.log(fechaMundo);
                fecha.value = fechaMundo.fechahora();
            }

            // Add default characters
            CONFIG.defaultCharacters.forEach(charUrl => {
                CharacterController.addCharacterToMap(charUrl);
            });
        } catch (error) {
            console.error('Error loading default map:', error);
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
});


/**
 * Setup NPC modal functionality
 */
function setupNpcModal() {
    const modal = document.getElementById('npcModal');
    const closeBtn = modal.querySelector('.close-modal');
    const npcGrid = document.getElementById('npcGrid');
    const npcSearch = document.getElementById('npcSearch');
    const ctd = document.getElementById('ctd');
    const addNpcBtn = document.getElementById('addNpcBtn');

    // Open modal when Add NPC button is clicked
    addNpcBtn.addEventListener('click', () => {
        modal.style.display = 'block';

        // Load NPC tokens if not already loaded
        if (npcTokens.length === 0) {
            loadNpcTokens();
        }
    });

    // Close modal when X is clicked
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside the content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Filter NPCs when searching
    npcSearch.addEventListener('input', filterNpcs);
}

/**
 * Load NPC tokens from img/token directory
 */
async function loadNpcTokens() {
    const npcGrid = document.getElementById('npcGrid');
    npcGrid.innerHTML = '<div class="loading">Loading NPCs...</div>';

    try {
        // Fetch list of token files
        const response = await fetch('../img/tokens/');

        // If direct directory listing is not allowed, use the default characters
        // and some other common tokens that we know are available
        if (!response.ok) {
            console.log('Direct directory listing not allowed');
            loadNpcTokens2();
        } else {
            const html = await response.text();

            // Extract image paths using regex
            const regex = /href="([^"]+\.(png|jpg|gif|jpeg|webp))"/gi;
            const matches = [...html.matchAll(regex)];
            console.log('Matches:', matches);

            // Ensure we don't duplicate the path
            npcTokens = matches.map(match => {
                const path = match[1];

                // Check if the path already includes img/tokens/
                if (path.startsWith('/img/tokens/')) {
                    return `../${path}`;
                }
            });
        }
        // console.log('NPC Tokens:', npcTokens);
        displayNpcTokens();
    } catch (error) {
        console.error('Error loading NPC tokens:', error);
        npcGrid.innerHTML = '<div class="error">Error loading NPCs. Using default list.</div>';

        // Use default list as fallback
        npcTokens = CONFIG.defaultCharacters;
        displayNpcTokens();
    }
}

//EL DE LA IA
/**
 * Load NPC tokens from a predefined list of tokens in CONFIG.tokens
 * NOTA: Actualizar la lista de tokens en la configuración al añadir nuevos tokens
 */
async function loadNpcTokens2() {
    const npcGrid = document.getElementById('npcGrid');
    npcGrid.innerHTML = '<div class="loading">Loading NPCs...</div>';

    try {
        // Usar la lista predefinida de tokens
        // npcTokens = CONFIG.tokens.map(tokenName => `../img/tokens/${tokenName}`);
        console.log(npcTokens);

        displayNpcTokens();

    } catch (error) {
        console.error('Error loading NPC tokens:', error);
        npcGrid.innerHTML = '<div class="error">Error loading NPCs. Using default list.</div>';

        // Use default list as fallback
        npcTokens = CONFIG.defaultCharacters;
        displayNpcTokens();
    }
}

/**
 * Display NPC tokens in the grid
 */
function displayNpcTokens() {
    const npcGrid = document.getElementById('npcGrid');
    npcGrid.innerHTML = '';

    console.log(npcTokens);


    if (npcTokens.length === 0) {
        npcGrid.innerHTML = '<div class="error">No NPCs found</div>';
        return;
    }

    npcTokens.forEach(tokenPath => {
        // Extract filename to use as NPC name
        const fileName = decodeURI(tokenPath.split('/').pop());
        const npcName = fileName.substring(0, fileName.lastIndexOf('.'))
        //    .replace(/[_-]/g, ' ').replace(/[%20]/g, ' ');
        console.log(fileName);


        // Create NPC item element
        const npcItem = document.createElement('div');
        npcItem.className = 'npc-item';
        npcItem.dataset.path = tokenPath;

        // Create image and name elements
        const img = document.createElement('img');
        img.src = tokenPath;
        img.alt = npcName;
        img.loading = 'lazy';

        const span = document.createElement('span');
        span.textContent = npcName;

        // Add click event to add NPC to map
        npcItem.addEventListener('click', () => {
            let n = ctd.value;
            for (let i = 0; i < n; i++) {
                // decidir que distancia habrá entre NPCs al aparecer
                CharacterController.addCharacterToMap(tokenPath, { x: 0 + i * 50, y: 100 });
            }
            // CharacterController.addCharacterToMap(tokenPath);
            document.getElementById('npcModal').style.display = 'none';
        });

        // Append elements to NPC item
        npcItem.appendChild(img);
        npcItem.appendChild(span);

        // Append to grid
        npcGrid.appendChild(npcItem);
    });
}

/**
 * Filter NPCs based on search input
 */
function filterNpcs() {
    const searchText = document.getElementById('npcSearch').value.toLowerCase();
    const npcItems = document.getElementById('npcGrid').querySelectorAll('.npc-item');

    npcItems.forEach(item => {
        const npcName = item.querySelector('span').textContent.toLowerCase();

        if (npcName.includes(searchText)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}
