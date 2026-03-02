/**
 * Character Controller Module
 * Handles character creation, movement, and interactions
 */
const CharacterController = {
    // Character tracking
    characters: new Map(), // Map of DOM elements, keyed by normalized ID
    selectedCharacters: new Map(),
    personajes: new Map(), // Map of character objects, keyed by character name
    characterRoutes: new Map(),
    plannedRoutes: new Map(),
    plannedStartPositions: new Map(),
    draggedCharacter: null,
    activeCharacter: null,
    rastro: true,
    // Mapa para almacenar las posiciones originales para cancelar movimientos
    originalPositions: new Map(),
    // Control de confirmación automática de movimientos
    autoConfirmMove: true,
    routePlanningMode: false,
    travelTime: 0,
    // Propiedades para el modo de ataque
    attackMode: false,
    attackingCharacter: null,
    // Propiedades para el modo de establecer objetivo
    targetMode: false,
    targetCharacters: [],
    targetClickHandler: null,

    /**
     * Normalize character name to ID (spaces to underscores)
     * This is the SINGLE SOURCE OF TRUTH for name normalization
     * @param {string} name - Character name
     * @returns {string} - Normalized ID (spaces replaced with underscores)
     */
    normalizeId(name) {
        if (!name || typeof name !== 'string') return '';
        return name.trim().replace(/%20/g, '_').replace(/ /g, '_');
    },

    /**
     * Get character element by normalized or full name
     * @param {string} nameOrId - Character name or normalized ID
     * @returns {Element|null} - The character DOM element
     */
    getCharacterElement(nameOrId) {
        if (!nameOrId) return null;
        const id = this.normalizeId(nameOrId);
        return this.characters.get(id) || null;
    },

    /**
     * Initialize the character controller
     */
    init() {
        // Inicializar tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.style.cssText = "position: fixed; display: none; background: rgba(0,0,0,0.8); color: white; padding: 5px; border-radius: 3px; z-index: 1100; font-size: 12px;";
        document.body.appendChild(this.tooltip);

        // Inicializar controladores para los botones de confirmación
        this.initMoveConfirmation();

        // Inicializar controlador para el checkbox de auto-confirmación
        this.initAutoConfirmMove();

        this.initRouteSimulationControls();
    },

    /**
     * Initialize auto-confirm move checkbox
     */
    initAutoConfirmMove() {
        const autoConfirmCheckbox = document.getElementById('autoConfirmMove');

        // Establecer estado inicial
        autoConfirmCheckbox.checked = this.autoConfirmMove;

        // Añadir event listener para actualizar el estado
        autoConfirmCheckbox.addEventListener('change', () => {
            this.autoConfirmMove = autoConfirmCheckbox.checked;
            console.log(`Auto-confirmación de movimientos: ${this.autoConfirmMove ? 'Activada' : 'Desactivada'}`);
        });
    },

    initRouteSimulationControls() {
        const slider = document.getElementById('routeTime');
        const label = document.getElementById('routeTimeLabel');
        if (!slider || !label) return;

        slider.disabled = true;
        slider.addEventListener('input', () => {
            const seconds = parseInt(slider.value, 10) || 0;
            this.simulateRouteTime(seconds);
            label.textContent = this.formatSeconds(seconds);
        });

        slider.addEventListener('change', () => {
            const seconds = parseInt(slider.value, 10) || 0;
            this.simulateRouteTime(seconds);
            label.textContent = this.formatSeconds(seconds);
        });
    },

    toggleRoutePlanning() {
        this.routePlanningMode = !this.routePlanningMode;
        bPlanificar.hidden = this.routePlanningMode;
        this.updateRoutePlanningLabel();
        if (!this.routePlanningMode) {
            this.finalizePlannedRoutes();
            routeSimulation.hidden=true;
            console.log("qacabado");
        }
        else
            routeSimulation.hidden=false;
     
    },

    updateRoutePlanningLabel() {
        const item = document.getElementById('planRoute');
        if (!item) return;
        item.textContent = this.routePlanningMode ? 'Terminar planificación' : 'Planificar ruta';
    },

    refreshRouteSimulationRange() {
        const slider = document.getElementById('routeTime');
        const label = document.getElementById('routeTimeLabel');
        if (!slider || !label) return;

        const targets = this.plannedRoutes.size > 0
            ? Array.from(this.plannedRoutes.keys())
            : this.getSimulationTargets();
        let maxSeconds = 0;
        targets.forEach((char) => {
            const route = this.plannedRoutes.get(char);
            if (!route || route.length < 2) return;
            const speed = parseFloat(char.getAttribute('data-speed')) || CONFIG.defaultSpeed;
            const duration = this.getRouteDurationSeconds(route, speed);
            if (duration > maxSeconds) maxSeconds = duration;
        });

        slider.max = Math.ceil(maxSeconds);
        slider.value = Math.min(parseInt(slider.value || '0', 10), slider.max || 0);
        slider.disabled = maxSeconds <= 0;
        label.textContent = this.formatSeconds(parseInt(slider.value, 10) || 0);
    },

    getSimulationTargets() {
        if (this.selectedCharacters.size > 0) {
            return Array.from(this.selectedCharacters.values());
        }
        if (this.activeCharacter) return [this.activeCharacter];
        return Array.from(this.plannedRoutes.keys());
    },

    simulateRouteTime(seconds) {
        const targets = this.getSimulationTargets();
        targets.forEach((char) => {
            const route = this.plannedRoutes.get(char);
            if (!route || route.length < 2) return;

            const speed = parseFloat(char.getAttribute('data-speed')) || CONFIG.defaultSpeed;
            const duration = this.getRouteDurationSeconds(route, speed);
            const pos = this.getRoutePositionAtTime(route, speed, seconds);
            if (!pos) return;
            const img = char.querySelector('image');
            this.moveCharacter(img, pos.x, pos.y, false);

            this.setPlannedRoutePath(char, route);
            const traveled = this.getRouteTraveledSegment(route, speed, seconds);
            if (traveled.length >= 2) {
                this.setNormalRoutePath(char, traveled);
            } else {
                this.removeNormalRoutePath(char);
            }
        });
    },

    getRouteDurationSeconds(route, speed) {
        if (!route || route.length < 2) return 0;
        let totalDistance = 0;
        for (let i = 1; i < route.length; i++) {
            const dx = route[i].x - route[i - 1].x;
            const dy = route[i].y - route[i - 1].y;
            totalDistance += Math.sqrt(dx * dx + dy * dy) * CONFIG.distanceScaleFactor;
        }
        const metersPerSecond = (speed * 1000) / 3600;
        if (metersPerSecond <= 0) return 0;
        return totalDistance / metersPerSecond;
    },

    getRoutePositionAtTime(route, speed, seconds) {
        if (!route || route.length < 2) return null;
        const metersPerSecond = (speed * 1000) / 3600;
        if (metersPerSecond <= 0) return route[0];
        let remaining = metersPerSecond * seconds;
        for (let i = 1; i < route.length; i++) {
            const start = route[i - 1];
            const end = route[i];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const segmentMeters = Math.sqrt(dx * dx + dy * dy) * CONFIG.distanceScaleFactor;
            if (remaining <= segmentMeters) {
                const ratio = segmentMeters === 0 ? 0 : remaining / segmentMeters;
                return { x: start.x + dx * ratio, y: start.y + dy * ratio };
            }
            remaining -= segmentMeters;
        }
        return route[route.length - 1];
    },

    getRouteTraveledSegment(route, speed, seconds) {
        if (!route || route.length < 2) return [];
        const metersPerSecond = (speed * 1000) / 3600;
        if (metersPerSecond <= 0) return [route[0]];
        let remaining = metersPerSecond * seconds;
        const traveled = [route[0]];
        for (let i = 1; i < route.length; i++) {
            if (remaining <= 0) break;
            const start = route[i - 1];
            const end = route[i];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const segmentMeters = Math.sqrt(dx * dx + dy * dy) * CONFIG.distanceScaleFactor;
            if (remaining >= segmentMeters) {
                traveled.push(end);
                remaining -= segmentMeters;
            } else {
                const ratio = segmentMeters === 0 ? 0 : remaining / segmentMeters;
                traveled.push({ x: start.x + dx * ratio, y: start.y + dy * ratio });
                remaining = 0;
            }
        }
        return traveled;
    },

    getRoutePathElement(char, className, stroke, suffix) {
        let pathElem = svgElement.querySelector(`.${char.id}-${suffix}`);
        if (!pathElem) {
            pathElem = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathElem.setAttribute('class', className);
            pathElem.setAttribute('fill', 'none');
            pathElem.classList.add(`${char.id}-${suffix}`);
            MapController.grosorCamino(3, pathElem);
            svgElement.appendChild(pathElem);
        }
        pathElem.setAttribute('stroke', stroke);
        return pathElem;
    },

    setNormalRoutePath(char, route) {
        if (!route || route.length < 2) {
            this.removeNormalRoutePath(char);
            return;
        }
        const path = SVGUtils.generateSmoothPath(route);
        const pathElem = this.getRoutePathElement(char, 'character-route', 'red', 'route');
        pathElem.setAttribute('d', path);
    },

    setPlannedRoutePath(char, route) {
        if (!route || route.length < 2) {
            this.removePlannedRoutePath(char);
            return;
        }
        const path = SVGUtils.generateSmoothPath(route);
        const pathElem = this.getRoutePathElement(char, 'planned-route', 'deepskyblue', 'planned-route');
        pathElem.setAttribute('d', path);
    },

    removePlannedRoutePath(char) {
        const elem = svgElement.querySelector(`.${char.id}-planned-route`);
        if (elem) elem.remove();
    },

    removeNormalRoutePath(char) {
        const elem = svgElement.querySelector(`.${char.id}-route`);
        if (elem) elem.remove();
    },

    finalizePlannedRoutes() {
        const targets = this.getSimulationTargets();
        if (targets.length === 0) return;
        const slider = document.getElementById('routeTime');
        const seconds = slider ? parseInt(slider.value, 10) || 0 : 0;
        this.travelTime = seconds / 3600;
        targets.forEach((char) => {
            const route = this.plannedRoutes.get(char);
            if (!route || route.length < 2) return;
            const speed = parseFloat(char.getAttribute('data-speed')) || CONFIG.defaultSpeed;
            const traveled = this.getRouteTraveledSegment(route, speed, seconds);
            this.originalPositions.set(char, { x: route[0].x, y: route[0].y });
            if (traveled.length >= 2) {
                this.characterRoutes.set(char, traveled);
                this.setNormalRoutePath(char, traveled);
            } else {
                this.removeNormalRoutePath(char);
            }
            this.removePlannedRoutePath(char);
            this.plannedRoutes.delete(char);
        });
        this.refreshRouteSimulationRange();

        if (this.autoConfirmMove) {
            if (SyncController.isOnline) {
                targets.forEach((char) => {
                    SyncController.saveMapState(char);
                });
            }
            this.originalPositions.clear();
        } else {
            const confirmationDiv = document.getElementById('moveConfirmation');
            const anchor = this.activeCharacter || targets[0];
            if (confirmationDiv && anchor) {
                const rect = anchor.getBoundingClientRect();
                confirmationDiv.style.display = 'block';
                confirmationDiv.style.left = `${rect.right - CONFIG.iconSize}px`;
                confirmationDiv.style.top = `${rect.top - CONFIG.iconSize}px`;
            }
        }
    },

    formatSeconds(seconds) {
        const total = Math.max(0, Math.floor(seconds));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        if (h > 0) {
            return `${h}h ${m}m ${s}s`;
        }
        if (m > 0) {
            return `${m}m ${s}s`;
        }
        return `${s}s`;
    },

    /**
     * Initialize move confirmation buttons
     */
    initMoveConfirmation() {
        const confirmButton = document.getElementById('confirmMove');
        const timeButton = document.getElementById('confirmTime');
        const cancelButton = document.getElementById('cancelMove');
        const confirmationDiv = document.getElementById('moveConfirmation');

        // Confirmar movimiento
        confirmButton.addEventListener('click', () => {
            confirmationDiv.style.display = 'none';
            this.originalPositions.clear();

            // Si estamos online, guardar el estado
            if (SyncController.isOnline)
                this.saveDraggedCharactersState();

        });
        timeButton.addEventListener('click', () => {
            fechaMundo = fechaMundo.mod('hora', this.travelTime);
            fecha.value = fechaMundo.fechahora();
        });

        // Cancelar movimiento
        cancelButton.addEventListener('click', () => {
            this.undoCharacterMovement();
            confirmationDiv.style.display = 'none';
        });
    },

    /**
     * Save state of all dragged characters to Firebase
     */
    saveDraggedCharactersState() {
        if (!SyncController.isOnline) return;

        if (this.draggedCharacter) {
            SyncController.saveMapState(this.draggedCharacter);
        }

        this.selectedCharacters.forEach((char) => {
            if (char !== this.draggedCharacter) {
                SyncController.saveMapState(char);
            }
        });
    },

    /**
     * Undo character movement by restoring original positions
     */
    undoCharacterMovement() {
        this.originalPositions.forEach((originalPos, charElement) => {
            const img = charElement.querySelector('image');
            this.moveCharacter(img, originalPos.x, originalPos.y);

            // En lugar de eliminar el rastro completo, solo eliminamos la última ruta añadida
            // Esto mantiene el historial de rutas anteriores
            let caminos = svgElement.querySelectorAll('.character-route');
            console.log(caminos);
            let ultimoCamino = caminos[caminos.length - 1];
            if (ultimoCamino) ultimoCamino.remove();
        });

        this.originalPositions.clear();
    },

    // /**
    //  * Set the distance scale factor
    //  * @param {number} value - The scale value in meters per unit
    //  */
    // setDistanceScale(value) {
    //     console.log('setDISTANCE1');

    //     const scaleFactor = parseFloat(value);
    //     if (isNaN(scaleFactor) || scaleFactor <= 0) return;

    //     CONFIG.distanceScaleFactor = scaleFactor;
    //     console.log(`Escala establecida: ${scaleFactor} metros por unidad`);

    //     // Cerrar el menú contextual
    //     document.getElementById('mapContextMenu').style.display = 'none';
    // },

    /**
     * Selecciona el personaje
     * @param {*} charElement Elemento del personaje
     * @returns {void}
     */
    select(charElement) {
        const id = charElement.getAttribute('id');
        if (this.selectedCharacters.has(id)) {
            return;
        } else {
            this.selectedCharacters.set(id, charElement);
            charElement.classList.add('selected');
        }
        this.drawSelectionCircle(charElement.querySelector('image'));
    },

    selectAll() {
        this.characters.forEach((char) => {
            if (char.classList.contains('selected')) return;
            this.select(char);
        });
    },
    deselectAll() {
        this.selectedCharacters.forEach((char) => {
            // Eliminar el círculo de selección

            char.classList.remove('selected');
            this.drawSelectionCircle(char.querySelector('image'));
        });
        this.selectedCharacters.clear();

    },

    toggleSelection(charElement) {
        const id = charElement.getAttribute('id');
        if (this.selectedCharacters.has(id)) {
            this.selectedCharacters.delete(id);
            charElement.classList.remove('selected');
        } else {
            this.selectedCharacters.set(id, charElement);
            charElement.classList.add('selected');
            //si esta abierto la tarjeta de personaje
            console.log(id + 'selected');
            if( mostrarTarjeta.checked)
            this.showCharacterCard(charElement.p);
        }
        this.drawSelectionCircle(charElement.querySelector('image'));
    },

    showStats(campo) {
        if (!this.activeCharacter) return;
        let personaje = this.activeCharacter.nombre;
        let pe = this.personajes.get(personaje);
        
        if (campo === 'modal') {
            // Mostrar en el modal original
            document.getElementById('infoTitle').innerHTML =
                `<h2 ><a href="../vue.html?pj=${pe.nombre}" target="_blank">${pe.nombre}</a> <FONT SIZE=4> ${pe.clase} ${pe.sexo}</FONT></h2> `;
            var ic;
            let info = document.getElementById('infoContent');
            info.innerHTML = '';
            ic = new InputCustom(pe, null, true);
            info.appendChild(ic);
            const infoModal = document.getElementById('infoModal');
            infoModal.style.display = 'block';
            return;
        }
        
        // Mostrar en la tarjeta de características
        this.showCharacterCard(pe);
    },
    
    /**
     * Muestra la tarjeta de características del personaje
     * @param {Object} personaje - El objeto personaje
     */
    showCharacterCard(personaje) {
        const characterCard = document.getElementById('characterCard');
        const characterName = document.getElementById('characterName');
        const statsGrid = document.querySelector('.stats-grid');
        const bodyDamageList = document.getElementById('bodyDamageList');
        
        // Establecer el nombre del personaje
        characterName.textContent = personaje.nombre;
        
        // Limpiar contenido anterior
        statsGrid.innerHTML = '';
        weaponContainer.innerHTML='';
        bodyDamageList.innerHTML = '';
        
        // Mostrar características principales
        const mainStats = ['FUE', 'CON', 'DES', 'PG'];
        mainStats.forEach(stat => {
            const statValue = personaje[stat] || personaje.getCar(stat) || 0;
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            statItem.innerHTML = `<span>${stat}</span><span>${statValue}</span>`;
            statsGrid.appendChild(statItem);
        });

        personaje.inventario.darClaseRecursiva(Arma).forEach(element => {
            weaponContainer.innerHTML+=element.toString() + "->";
            if (personaje.getHabilidad(element.nombre))  weaponContainer.innerHTML+=personaje.getHabilidad(element.nombre).t + '<br>';
            
        });

        // Dibujar el daño en el canvas
        const zoomCuerpo = 1; // Escala para el dibujo del cuerpo
        personaje.cuerpoDaño('canvasCuerpo', zoomCuerpo);

        // Mostrar zonas dañadas del cuerpo
        if (personaje.cuerpo) {
            const dañadas = personaje.cuerpo.todosDaños();
            if (dañadas.length > 0) {
                dañadas.forEach(zona => {
                    const damageItem = document.createElement('div');
                    damageItem.className = 'damage-item';
                    damageItem.innerHTML = `
                        <span>${zona.nombre}</span>
                        <span>${zona.daño}/${zona.pg} (${zona.pa} PA)</span>
                    `;
                    bodyDamageList.appendChild(damageItem);
                });
            } else {
                bodyDamageList.innerHTML = '<div class="damage-item">No hay zonas dañadas</div>';
            }
        } else {
            bodyDamageList.innerHTML = '<div class="damage-item">No hay información de cuerpo</div>';
        }
        
        // Mostrar la tarjeta
        characterCard.style.display = 'block';

        // Asegurarse de que el canvas tenga el mismo tamaño que la imagen del cuerpo
        const cuerpoImage = document.getElementById('cuerpo');
        const canvasCuerpo = document.getElementById('canvasCuerpo');

        cuerpoImage.onload = () => {
            canvasCuerpo.width = cuerpoImage.naturalWidth;
            canvasCuerpo.height = cuerpoImage.naturalHeight;
            // Redibujar el daño después de que la imagen se haya cargado y el canvas redimensionado
            personaje.cuerpoDañoSolo('canvasCuerpo', zoomCuerpo);
        };

        // Si la imagen ya está cargada, redimensionar el canvas inmediatamente
        if (cuerpoImage.complete) {
            canvasCuerpo.width = cuerpoImage.naturalWidth;
            canvasCuerpo.height = cuerpoImage.naturalHeight;
            personaje.cuerpoDañoSolo('canvasCuerpo', zoomCuerpo);
        }

        // Evento para alternar la vista de pantalla completa al hacer clic en la imagen del cuerpo
        const bodyDamageContainer = cuerpoImage.closest('.body-damage-container');
        bodyDamageContainer.onclick = () => {
            const isFullScreen = bodyDamageContainer.classList.toggle('fullscreen');

            if (isFullScreen) {
                cuerpoImage.style.display = 'none'; // Ocultar la imagen original
                // Entrar en modo pantalla completa
                const aspectRatio = cuerpoImage.naturalWidth / cuerpoImage.naturalHeight;
                const maxWidth = window.innerWidth * 0.9;
                const maxHeight = window.innerHeight * 0.9;

                let newWidth = maxWidth;
                let newHeight = maxWidth / aspectRatio;

                if (newHeight > maxHeight) {
                    newHeight = maxHeight;
                    newWidth = maxHeight * aspectRatio;
                }

                canvasCuerpo.style.width = `${newWidth}px`;
                canvasCuerpo.style.height = `${newHeight}px`;
                canvasCuerpo.width = newWidth; // Usar el tamaño calculado para el contexto de dibujo
                canvasCuerpo.height = newHeight;
                personaje.cuerpoDaño('canvasCuerpo', 1); // Escala ajustada para pantalla completa


                // Adjuntar el evento de clic al canvas para salir del modo pantalla completa
                canvasCuerpo.onclick = () => {
                    bodyDamageContainer.classList.remove('fullscreen');
                    cuerpoImage.style.display = 'block'; // Mostrar la imagen original
                    canvasCuerpo.style.width = ``; // Restaurar el tamaño original del canvas
                    canvasCuerpo.style.height = ``;
                    canvasCuerpo.width = cuerpoImage.naturalWidth;
                    canvasCuerpo.height = cuerpoImage.naturalHeight;
                    personaje.cuerpoDaño('canvasCuerpo', zoomCuerpo); // Escala original
                    canvasCuerpo.onclick = null; // Eliminar el manejador de clic del canvas
                };
            } else {
                // Este bloque else ya no es necesario para el clic en cuerpoImage,
                // ya que la salida de pantalla completa se maneja en canvasCuerpo.onclick
                // Sin embargo, para mantener la estructura, lo dejaremos vacío o con la lógica original si fuera necesario para otros casos.
                // Por ahora, lo dejaremos como estaba, aunque no se ejecutará en el flujo de clic normal.
                cuerpoImage.style.display = 'block'; // Mostrar la imagen original
                // Salir del modo pantalla completa
                canvasCuerpo.style.width = ``; // Restaurar el tamaño original del canvas
                canvasCuerpo.style.height = ``;
                canvasCuerpo.width = cuerpoImage.naturalWidth;
                canvasCuerpo.height = cuerpoImage.naturalHeight;
                personaje.cuerpoDañoSolo('canvasCuerpo', zoomCuerpo); // Escala original
            }
        };

        // Configurar pestañas
        this.setupCharacterCardTabs();
    },
    
    /**
     * Muestra el modal de ataque para seleccionar la localización y aplicar daño
     * @param {Object} attackerPersonaje - El personaje que ataca
     * @param {Object} targetPersonaje - El personaje objetivo del ataque
     */
    showAttackModal(attackerPersonaje, targetPersonaje) {
        // Crear el modal si no existe
        if (!document.getElementById('attackModal')) {
            this.createAttackModal();
        }
        
        const attackModal = document.getElementById('attackModal');
        const attackerName = document.getElementById('attackerName');
        const targetName = document.getElementById('targetName');
        const locationSelect = document.getElementById('attackLocation');
        const locationRoll = document.getElementById('attackLocationRoll');
        
        // Establecer nombres
        attackerName.textContent = attackerPersonaje.nombre;
        targetName.textContent = targetPersonaje.nombre;
        
        // Limpiar y llenar el selector de localizaciones
        locationSelect.innerHTML = '';
        targetPersonaje.cuerpo.todas().forEach(loc => {
            const option = document.createElement('option');
            option.value = loc.nombre;
            option.textContent = `${loc.nombre} (${loc.daño}/${loc.pg})`;
            option.dataset.min = loc.min;
            option.dataset.max = loc.max;
            locationSelect.appendChild(option);
        });
        
        // Actualizar el valor del roll con el rango de la primera localización
        const firstOption = locationSelect.firstElementChild;
        if (firstOption) {
            locationRoll.value = firstOption.dataset.min;
        }
        
        // Guardar referencia a los elementos HTML de los personajes en el modal
        attackModal.dataset.attacker = this.attackingCharacter.id;
        
        // Buscar el elemento HTML del personaje objetivo por su nombre
        // El atributo data-name está en la imagen, no en el grupo
        const targetImages = document.querySelectorAll('image[data-name]');
        let targetElement = null;
        
        for (const img of targetImages) {
            if (img.getAttribute('data-name') === targetPersonaje.nombre) {
                // Obtener el grupo padre que es el elemento del personaje
                targetElement = img.closest('.character');
                break;
            }
        }
        
        if (targetElement) {
            attackModal.dataset.target = targetElement.id;
            console.log('Target element ID:', attackModal.dataset.target);
        } else {
            console.log('No se encontró el elemento HTML para el personaje:', targetPersonaje.nombre);
        }
        
        
        // Mostrar el modal
        attackModal.style.display = 'block';
        
        // Cancelar el modo de ataque
        this.cancelAttackMode();
    },
    
    /**
     * Crea el modal de ataque si no existe
     */
    createAttackModal() {
        const modal = document.createElement('div');
        modal.id = 'attackModal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Ataque</h3>
                    <span class="close-modal" id="closeAttackModal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="attack-info">
                        <p><strong id="attackerName"></strong> ataca a <strong id="targetName"></strong></p>
                    </div>
                    <div class="damage-controls">
                        <div>
                            <label for="attackDamage">Cantidad de daño:</label>
                            <input type="number" id="attackDamage" min="1" value="1">
                        </div>
                        <div class="location-input">
                            <label for="attackLocation">Localización:</label>
                            <select id="attackLocation"></select>
                            <input type="number" id="attackLocationRoll" min="1" max="100" value="1">
                            <span style="cursor:pointer; padding:5px;">
                                <img src="../img/10_sided_die.svg" width="30" height="30" id="rollDiceButton">
                            </span>
                        </div>
                        <button id="applyAttackDamage">Aplicar daño</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Configurar eventos
        document.getElementById('closeAttackModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('rollDiceButton').addEventListener('click', () => {
            const roll = Math.floor(Math.random() * 100) + 1;
            document.getElementById('attackLocationRoll').value = roll;
            document.getElementById('attackLocationRoll').dispatchEvent(new Event('input'));
        });
        
        document.getElementById('attackLocation').addEventListener('change', (e) => {
            const option = e.target.selectedOptions[0];
            document.getElementById('attackLocationRoll').value = option.dataset.min;
        });
        
        document.getElementById('attackLocationRoll').addEventListener('input', (e) => {
            const roll = parseInt(e.target.value);
            const options = document.getElementById('attackLocation').options;
            
            for(let i = 0; i < options.length; i++) {
                const min = parseInt(options[i].dataset.min);
                const max = parseInt(options[i].dataset.max);
                
                if (roll >= min && roll <= max) {
                    document.getElementById('attackLocation').selectedIndex = i;
                    break;
                }
            }
        });
        
        document.getElementById('applyAttackDamage').addEventListener('click', () => {
            this.applyAttackDamage();
        });
        
        // Cerrar el modal al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    },
    
    /**
     * Aplica el daño al personaje objetivo
     */
    applyAttackDamage() {
        const attackModal = document.getElementById('attackModal');
        const targetId = attackModal.dataset.target;
        const targetElement = document.getElementById(targetId);
        console.log(targetId);
        
        if (!targetElement) {
            console.log('No se encontró el elemento objetivo');
            attackModal.style.display = 'none';
            return;
        }
        
        // Usar getPersonajeFromElement en lugar de this.personajes.get
        const targetPersonaje = this.getPersonajeFromElement(targetElement);
        if (!targetPersonaje) {
            console.log('No se encontró el personaje objetivo');
            attackModal.style.display = 'none';
            return;
        }
        
        const amount = parseInt(document.getElementById('attackDamage').value);
        const location = document.getElementById('attackLocation').value;
        
        if (amount && location) {
            // Aplicar daño a la localización
            console.log(`Aplicando ${amount} de daño a ${location}`);
            //log targetPersonaje
            console.log(targetPersonaje);
            
            targetPersonaje.cuerpo.dañarLocalizacion(amount, location);
            
            // Actualizar la tarjeta de características si está visible
            if (document.getElementById('characterCard').style.display === 'block') {
                this.showCharacterCard(targetPersonaje);
            }
            
            // Cerrar el modal
            attackModal.style.display = 'none';
        }
    },
    
    /**
     * Obtiene el objeto personaje a partir del elemento DOM
     * @param {Element} element - El elemento DOM del personaje
     * @returns {Object} El objeto personaje
     */
    getPersonajeFromElement(element) {
        if (!element) return null;
        //TODO: return     perso 
        
        return this.personajes.get(element.nombre) || null;
        // console.log("personaje+:"+n);
        return element.p || null;
    },
    
    /**
     * Inicia el modo de ataque para el personaje activo
     */
    startAttackMode() {
        if (!this.activeCharacter) return;
        
        this.attackMode = true;
        this.attackingCharacter = this.activeCharacter;
        
        // Cambiar el cursor para indicar modo de ataque
        document.body.style.cursor = 'crosshair';
        
        // Añadir clase visual al personaje atacante
        this.attackingCharacter.classList.add('attacking');
        
        // Mostrar mensaje de ayuda
        this.showTooltip('Selecciona un personaje para atacar', 3000);
        
        // Añadir listener para cancelar el modo de ataque con Escape
        document.addEventListener('keydown', this.handleAttackModeEscape);
    },
    
    /**
     * Maneja la tecla Escape para cancelar el modo de ataque
     * @param {KeyboardEvent} e - El evento de teclado
     */
    handleAttackModeEscape(e) {
        if (e.key === 'Escape') {
            CharacterController.cancelAttackMode();
        }
    },
    
    /**
     * Cancela el modo de ataque
     */
    cancelAttackMode() {
        this.attackMode = false;
        
        // Restaurar cursor
        document.body.style.cursor = 'default';
        
        // Quitar clase visual del personaje atacante si existe
        if (this.attackingCharacter) {
            this.attackingCharacter.classList.remove('attacking');
            this.attackingCharacter = null;
        }
        
        // Eliminar listener de Escape
        document.removeEventListener('keydown', this.handleAttackModeEscape);
    },
    
    /**
     * Maneja el clic en un personaje cuando estamos en modo de ataque
     * @param {Element} targetElement - El elemento del personaje objetivo
     */
    handleAttackClick(targetElement) {
        if (!this.attackMode || !this.attackingCharacter) return;
        
        // No permitir atacarse a sí mismo
        if (targetElement === this.attackingCharacter) {
            this.showTooltip('No puedes atacarte a ti mismo', 2000);
            return;
        }
        
        const attackerPersonaje = this.getPersonajeFromElement(this.attackingCharacter);
        const targetPersonaje = this.getPersonajeFromElement(targetElement);
        
        if (!attackerPersonaje || !targetPersonaje) {
            this.cancelAttackMode();
            return;
        }
        
        // Mostrar el modal de ataque
        this.showAttackModal(attackerPersonaje, targetPersonaje);
    },
    
    /**
     * Muestra un tooltip con un mensaje
     * @param {string} message - El mensaje a mostrar
     * @param {number} duration - Duración en milisegundos
     */
    showTooltip(message, duration = 2000) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = message;
        document.body.appendChild(tooltip);
        
        // Posicionar en el centro de la pantalla
        tooltip.style.position = 'fixed';
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '10px';
        tooltip.style.borderRadius = '5px';
        tooltip.style.zIndex = '1000';
        
        // Eliminar después de la duración especificada
        setTimeout(() => {
            tooltip.remove();
        }, duration);
    },
    
    /**
     * Configura las pestañas de la tarjeta de características
     */
    setupCharacterCardTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Desactivar todas las pestañas
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Activar la pestaña seleccionada
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(`${tabId}Tab`).classList.add('active');
            });
        });
        
        // Configurar botón de cierre
        document.getElementById('closeCharacterCard').addEventListener('click', () => {
            document.getElementById('characterCard').style.display = 'none';
        });
    },

    /**
     * Inicia el modo para establecer el objetivo final de la ruta
     */
    startTargetMode() {
        this.targetMode = !this.targetMode;
        const button = document.getElementById('bObjetivo');
        const mapContainer = document.getElementById('svg-container');
        
        if (this.targetMode) {
            // Preparar lista de personajes objetivo
            if (this.selectedCharacters.size > 0) {
                this.targetCharacters = Array.from(this.selectedCharacters.values());
            } else if (this.activeCharacter) {
                this.targetCharacters = [this.activeCharacter];
            } else {
                this.targetMode = false;
                this.showTooltip('Selecciona un personaje primero', 2000);
                return;
            }
            
            // Cambiar estado visual del botón
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
            
            // Cambiar cursor
            document.body.style.cursor = 'crosshair';
            
            // Mostrar mensaje
            this.showTooltip(`Haz clic en el mapa para establecer el objetivo para ${this.targetCharacters.length} personaje(s)`, 3000);
            
            // Agregar listeners para clics en el mapa (mouse y touch)
            this.targetClickHandler = this.handleTargetClick.bind(this);
            mapContainer.addEventListener('click', this.targetClickHandler);
            mapContainer.addEventListener('touchend', this.targetClickHandler);
        } else {
            // Desactivar modo target
            button.style.backgroundColor = '';
            button.style.color = '';
            document.body.style.cursor = 'default';
            this.targetCharacters = [];
            
            // Remover listeners
            if (this.targetClickHandler) {
                mapContainer.removeEventListener('click', this.targetClickHandler);
                mapContainer.removeEventListener('touchend', this.targetClickHandler);
                this.targetClickHandler = null;
            }
        }
    },

    /**
     * Maneja el clic en el mapa cuando está activo el modo target
     * @param {MouseEvent|TouchEvent} e - Evento del clic o toque
     */
    handleTargetClick(e) {
        if (!this.targetMode) {
            const mapContainer = document.getElementById('svg-container');
            if (this.targetClickHandler) {
                mapContainer.removeEventListener('click', this.targetClickHandler);
                mapContainer.removeEventListener('touchend', this.targetClickHandler);
                this.targetClickHandler = null;
            }
            return;
        }
        
        // No procesar si el clic es en un personaje
        if (e.target.closest('.character')) {
            return;
        }
        
        // Prevenir propagación para no hacer pan del mapa
        e.stopPropagation();
        
        // Obtener coordenadas según el tipo de evento
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            // Event táctil
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            // Event táctil final (touchend)
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            // Event de mouse
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const point = SVGUtils.getPointInSVG(clientX, clientY);
        if (!point) return;
        
        // Establecer la ruta final
        this.setRouteTarget(point);
        
        // Desactivar modo target
        const button = document.getElementById('bObjetivo');
        const mapContainer = document.getElementById('svg-container');
        
        button.style.backgroundColor = '';
        button.style.color = '';
        document.body.style.cursor = 'default';
        
        // Remover listeners
        if (this.targetClickHandler) {
            mapContainer.removeEventListener('click', this.targetClickHandler);
            mapContainer.removeEventListener('touchend', this.targetClickHandler);
            this.targetClickHandler = null;
        }
        
        this.targetMode = false;
    },

    /**
     * Establece el punto final de la ruta para los personajes
     * @param {Object} targetPoint - Punto final {x, y}
     */
    setRouteTarget(targetPoint) {
        if (!targetPoint) return;
        
        this.targetCharacters.forEach((charElement) => {
            // Obtener la posición actual del personaje
            const image = charElement.querySelector('image');
            const currentX = parseFloat(image.getAttribute('data-x')) ||
                            (parseFloat(image.getAttribute('x')) + parseFloat(image.getAttribute('width')) / 2);
            const currentY = parseFloat(image.getAttribute('data-y')) ||
                            (parseFloat(image.getAttribute('y')) + parseFloat(image.getAttribute('height')) / 2);
            
            // Crear una ruta directa al punto objetivo
            const route = [
                { x: currentX, y: currentY },
                targetPoint
            ];
            
            if (this.routePlanningMode) {
                // En modo planificación, guardar como ruta planificada
                this.plannedRoutes.set(charElement, route);
                this.plannedStartPositions.set(charElement, { x: currentX, y: currentY });
                this.characterRoutes.set(charElement, route);
                this.setPlannedRoutePath(charElement, route);
            } else {
                // En modo normal, mover el personaje y guardar la ruta
                this.characterRoutes.set(charElement, route);
                this.moveCharacter(image, targetPoint.x, targetPoint.y);
                
                if (this.rastro) {
                    this.setNormalRoutePath(charElement, route);
                }
                
                // Store original position for undo
                this.originalPositions.set(charElement, { x: currentX, y: currentY });
                
                // Si autoconfirm está desactivado, mostrar botones de confirmación
                if (!this.autoConfirmMove) {
                    const confirmationDiv = document.getElementById('moveConfirmation');
                    const rect = charElement.getBoundingClientRect();
                    confirmationDiv.style.display = 'block';
                    confirmationDiv.style.left = `${rect.right - CONFIG.iconSize}px`;
                    confirmationDiv.style.top = `${rect.top - CONFIG.iconSize}px`;
                } else {
                    // Si autoconfirm está activado, guardar el estado
                    this.originalPositions.clear();
                    if (SyncController.isOnline) {
                        this.saveDraggedCharactersState();
                    }
                }
            }
            
            // Actualizar la visualización de distancia
            this.updateDistanceDisplay(charElement);
        });
        
        // Actualizar el rango de simulación de ruta si estamos en modo planificación
        if (this.routePlanningMode) {
            this.refreshRouteSimulationRange();
        }
        
        this.showTooltip('Ruta establecida', 1500);
    },


    setCharacterSpeed(speed) {
        if (!this.activeCharacter) return;

        // Convert to number and validate
        speed = parseFloat(speed);
        if (isNaN(speed) || speed <= 0) speed = CONFIG.defaultSpeed;

        // Update DOM
        document.getElementById('speedValue').value = speed;

        // Update for selected characters or active character
        if (this.selectedCharacters.size > 0) {
            this.selectedCharacters.forEach((char) => {
                char.setAttribute('data-speed', speed);
            });
        } else {
            this.activeCharacter.setAttribute('data-speed', speed);
        }

        // Update CONFIG default for new characters
        CONFIG.defaultSpeed = speed;
    },

    /**
     * Set the distance scale factor (meters per map unit)
     * @param {number} scale - Scale factor in meters per map unit
     */
    setDistanceScale(scale) {
        // Convert to number and validate
        scale = parseFloat(scale);
        if (isNaN(scale) || scale <= 0) scale = 1;

        // Update DOM
        document.getElementById('mapScaleValue').value = scale;

        // Update CONFIG
        CONFIG.distanceScaleFactor = scale;

        // Refresh all routes to update distances
        //esto HACE ALGO DE VERDAD??
        this.characterRoutes.forEach((route, charElement) => {
            if (route.length > 1) {
                this.updateDistanceDisplay(charElement);
            }
        });
        this.refreshRouteSimulationRange();
    },

    /**
     * Update distance display for a character's route
     * @param {SVGElement} charElement - Character element
     */
    updateDistanceDisplay(charElement) {
        if (!charElement) return;

        const route = this.characterRoutes.get(charElement) || [];
        if (route.length <= 1) return;

        // Calculate total distance
        let totalDistance = 0;
        for (let i = 1; i < route.length; i++) {
            const dx = route[i].x - route[i - 1].x;
            const dy = route[i].y - route[i - 1].y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
        }

        // Apply scale factor
        const scaledDistance = totalDistance * CONFIG.distanceScaleFactor;

        // Get character speed (km/h)
        const speed = parseFloat(charElement.getAttribute('data-speed')) || CONFIG.defaultSpeed;

        // Calculate time (h) = distance (m) / (speed (km/h) * 1000 (m/km))
        const timeHours = scaledDistance / (speed * 1000);
        this.travelTime = timeHours;

        // Format time in hours, minutes, seconds
        let timeString = '';
        if (timeHours >= 1) {
            timeString = Math.floor(timeHours) + 'h ';
        }

        const minutes = Math.floor((timeHours % 1) * 60);
        if (minutes > 0 || timeHours >= 1) {
            timeString += minutes + 'min ';
        }

        const seconds = Math.floor(((timeHours % 1) * 60 % 1) * 60);
        timeString += seconds + 's';

        // Display distance and time in tooltip
        const bbox = charElement.getBoundingClientRect();
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${bbox.right + 10}px`;
        this.tooltip.style.top = `${bbox.top + 10}px`;

        // Format distance in m or km
        let distanceText = '';
        if (scaledDistance >= 1000) {
            distanceText = `${(scaledDistance / 1000).toFixed(2)} km`;
        } else {
            distanceText = `${scaledDistance.toFixed(1)} m`;
        }

        this.tooltip.innerHTML = `Dist: ${distanceText}<br>Tiempo: ${timeString}`;

        clearTimeout(this.tooltip.hideTimeout);
        this.tooltip.hideTimeout = setTimeout(() => {
            this.tooltip.style.display = 'none';
        }, CONFIG.tooltipDisplayTime);
    },

    /**
     * Add character to the map
     * @param {string} imageUrl - URL of the character image
     * @param {Object|string} position - Position or URL for character
     * @returns {SVGElement} - The created character element
     */
    addCharacterToMap(imageUrl, position) {
        
        if (!svgElement) return;
        
        // Create character group
        const charGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        charGroup.setAttribute('class', 'character');

        // Decode URL
        imageUrl = decodeURI(imageUrl);

        // Extract name from URL
        const fileName = typeof position === 'string' ?
            position.split('/').pop() :
            imageUrl.split('/').pop();
        
        // Get display name with spaces
        const nombre = fileName.substring(0, fileName.lastIndexOf('.')).replace(/%20/g, ' ');
        
        // Get normalized ID without spaces
        let baseName = this.normalizeId(nombre);

        // Handle duplicate names by appending number
        let number = 1;
        let finalId = baseName;
        while (this.characters.has(finalId)) {
            number++;
            // Extract existing number if any and replace it
            const match = baseName.match(/\d+$/);
            if (match) {
                finalId = baseName.substring(0, baseName.length - match[0].length) + number;
            } else {
                finalId = baseName + number;
            }
        }

        // Set unique ID (normalized) and human-readable name
        charGroup.id = finalId;
        charGroup.nombre = nombre;

        // Set default speed
        charGroup.setAttribute('data-speed', CONFIG.defaultSpeed);

        // Create character image
        const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
        image.setAttribute('href', imageUrl);
        image.setAttribute('data-name', nombre); // Store readable name in DOM
        image.setAttribute('width', CONFIG.iconSize / MapController.scale);
        image.setAttribute('height', CONFIG.iconSize / MapController.scale);
        image.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // Position the character
        let x, y;
        if (typeof position === 'object' && position.x && position.y) {
            x = parseFloat(position.x);
            y = parseFloat(position.y);
        } else {
            const point = SVGUtils.getPointInSVG(window.innerWidth / 2, window.innerHeight / 2);
            x = point.x;
            y = point.y;
        }

        image.setAttribute('data-x', x);
        image.setAttribute('data-y', y);

        // Add title for hover information
        const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "title");
        titleElement.textContent = nombre;
        charGroup.insertBefore(titleElement, charGroup.firstChild);

        // Size and position with proper centering
        const size = CONFIG.iconSize / MapController.scale;
        image.setAttribute('x', x - size / 2);
        image.setAttribute('y', y - size / 2);

        // Add position cross reference (initially hidden)
        const crossGroup = this.createPositionCross();
        charGroup.appendChild(image);
        charGroup.appendChild(crossGroup);

        svgElement.appendChild(charGroup);

        // Set up event handlers
        this.setupCharacterDrag(charGroup);
        this.setupRotationHandlers(charGroup);
        this.setupContextMenu(charGroup);
        this.setupSelection(charGroup);

        // Store character reference using normalized ID as key
        this.characters.set(finalId, charGroup);

        if (SyncController.isOnline) {
            console.log('cargo desde crear personaje:' + nombre);
            SyncController.cargarPersonaje(nombre);
        }

        //TODO: crear personaje si no existe
        let charCreado= new Humano();
        charCreado.sexo='♂'
        charCreado.nombre=nombre;
        charCreado.act();
        charCreado.setMaxPuntos();
        GA.forEach((arma,nombreArma) => {
   
           if(nombre.toLowerCase().includes(nombreArma.toLowerCase())){
               console.log(nombreArma);
               let arma=GA.get(nombreArma).generar();
               console.log(arma);         
               charCreado.inventario.add(arma);
               charCreado.setHabilidad(new HabilidadMarcial(nombreArma, Manipulación, 25 + new Dado('1d100').tirar(), true, "Brazo D", arma));
               if (nombre.toLowerCase().includes('doble')){
                   charCreado.inventario.add(GA.get(nombreArma).generar());
                   charCreado.setHabilidad(new HabilidadMarcial(nombreArma, Manipulación, 25 + new Dado('1d100').tirar(), true, "Brazo I", arma));                 
               }
           }
        //    console.log(nombreArma);
    
        });  
            

        this.personajes.set(nombre, charCreado);
        
        // Asignar el personaje al elemento DOM para poder acceder a él desde el elemento
        charGroup.p = charCreado;
        
        return charGroup;
    },

    /**
     * Update character route during movement
     * @param {SVGElement} charElement - Character element
     * @param {number} newX - X coordinate
     * @param {number} newY - Y coordinate
     */
    updateCharacterRoute(charElement, newX, newY) {
        let route = this.characterRoutes.get(charElement) || [];

        if (route.length === 0) {
            route.push({ x: newX, y: newY });
        } else {
            const lastPoint = route[route.length - 1];
            const dx = newX - lastPoint.x, dy = newY - lastPoint.y;

            // Add point only if moved enough
            if (Math.sqrt(dx * dx + dy * dy) >= CONFIG.moveThreshold) {
                route.push({ x: newX, y: newY });
            }
        }

        this.characterRoutes.set(charElement, route);

        // Use updated method to display distance and time
        this.updateDistanceDisplay(charElement);
    },

    /**
     * Setup selection handling for a character
     * @param {SVGElement} charElement - Character element
     */
    setupSelection(charElement) {


        // Touch event handlers for selection
        charElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                e.stopPropagation();

                const id = charElement.getAttribute('id');

                console.log('Touch start', { id, selected: this.selectedCharacters.has(id) });

                if (e.touches.length === 1 && e.touches[0].force > 0.5) {
                    // Long press / force touch for multi-select             
                    this.toggleSelection(charElement);
                    console.log('Long press:' + e.touches[0].force);

                } else {
                    // Single tap for single selection
                    this.toggleSelection(charElement);
                }
            }
        });
        // Handle click events for selection
        charElement.addEventListener('click', (e) => {
            e.stopPropagation();

            // Check if we're in attack mode
            if (this.attackMode && this.attackingCharacter !== charElement) {
                this.performAttack(charElement);
                return;
            }

            const id = charElement.getAttribute('id');
            // if (this.isDragging) return;
            // console.log('Click', { id, selected: this.selectedCharacters.has(id) });

            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                // Toggle selection with Ctrl/Cmd key
                this.toggleSelection(charElement);
            } else {
                // Single selection without Ctrl/Cmd
                // toggleSelection(charElement);
            }
        });

        // Clear selection when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.closest('#sidePanel')) return;
            if (e.target.closest('#routeSimulation')) return;
            if (e.target.closest('#moveConfirmation')) return;
            if (this.routePlanningMode) return;
            if (!e.target.closest('.character') && !this.draggedCharacter) {
                this.selectedCharacters.forEach((char) => {
                    char.classList.remove('selected');
                    this.drawSelectionCircle(char.querySelector('image'));
                });
                this.selectedCharacters.clear();
            }
        });

    },

    /**
     * Setup character drag behavior
     * @param {SVGElement} charElement - Character element
     */
    setupCharacterDrag(charElement) {
        let startX, startY, originalPos;
        let isDragging = false;
        let hasStartedDrag = false;
        let wasSelected = false;

        const image = () => charElement.querySelector('image');
        const cross = () => charElement.querySelector('.position-cross');


        // Store original positions of all selected characters
        let selectedOriginalPos = new Map();

        const startDragging = e => {
            if (this.selectedCharacters.has(charElement.getAttribute('id'))) {
                wasSelected = charElement.getAttribute('id');
            }
            if (e.button === 2) return;
            e.stopPropagation();

            const evt = e.touches ? e.touches[0] : e;
            const point = SVGUtils.getPointInSVG(evt.clientX, evt.clientY);
            if (!point) return;

            startX = point.x;
            startY = point.y;
            isDragging = true;
            hasStartedDrag = false;

            // Store original position of dragged character
            originalPos = {
                x: parseFloat(image().getAttribute('data-x')) ||
                    (parseFloat(image().getAttribute('x')) + parseFloat(image().getAttribute('width')) / 2),
                y: parseFloat(image().getAttribute('data-y')) ||
                    (parseFloat(image().getAttribute('y')) + parseFloat(image().getAttribute('height')) / 2)
            };

            // Store original positions of all selected characters
            selectedOriginalPos.clear();
            this.selectedCharacters.forEach((char) => {
                const img = char.querySelector('image');
                selectedOriginalPos.set(char, {
                    x: parseFloat(img.getAttribute('data-x')) ||
                        (parseFloat(img.getAttribute('x')) + parseFloat(img.getAttribute('width')) / 2),
                    y: parseFloat(img.getAttribute('data-y')) ||
                        (parseFloat(img.getAttribute('y')) + parseFloat(img.getAttribute('height')) / 2)
                });
            });

            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag);
            document.addEventListener('mouseup', stopDragging);
            document.addEventListener('touchend', stopDragging);
        };

        const drag = e => {
            if (!isDragging) return;
            e.preventDefault();

            const evt = e.touches ? e.touches[0] : e;
            const point = SVGUtils.getPointInSVG(evt.clientX, evt.clientY);
            if (!point) return;

            const dx = point.x - startX;
            const dy = point.y - startY;

            // Only start real dragging if movement exceeds threshold
            if (!hasStartedDrag) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < CONFIG.dragThreshold) return;

                hasStartedDrag = true;
                this.draggedCharacter = charElement;
                cross().style.display = 'block';
                image().style.opacity = '0.5';
                this.characterRoutes.set(charElement, [{ x: originalPos.x, y: originalPos.y }]);

                if (this.routePlanningMode) {
                    this.plannedStartPositions.set(charElement, {
                        x: originalPos.x,
                        y: originalPos.y
                    });
                    this.selectedCharacters.forEach((char) => {
                        if (char !== charElement) {
                            const origPos = selectedOriginalPos.get(char);
                            this.characterRoutes.set(char, [{ x: origPos.x, y: origPos.y }]);
                            char.querySelector('image').style.opacity = '0.5';
                            this.plannedStartPositions.set(char, {
                                x: origPos.x,
                                y: origPos.y
                            });
                        }
                    });
                } else {
                    this.originalPositions.set(charElement, {
                        x: originalPos.x,
                        y: originalPos.y
                    });

                    this.selectedCharacters.forEach((char) => {
                        if (char !== charElement) {
                            const origPos = selectedOriginalPos.get(char);
                            this.characterRoutes.set(char, [{ x: origPos.x, y: origPos.y }]);
                            char.querySelector('image').style.opacity = '0.5';

                            this.originalPositions.set(char, {
                                x: origPos.x,
                                y: origPos.y
                            });
                        }
                    });
                }
            }

            if (hasStartedDrag) {
                const newX = originalPos.x + dx;
                const newY = originalPos.y + dy;

                this.updateCharacterRoute(charElement, newX, newY);
                if (this.routePlanningMode) {
                    this.setPlannedRoutePath(charElement, this.characterRoutes.get(charElement));
                }

                //ruta planificada
                if (this.routePlanningMode) {
                    this.selectedCharacters.forEach((char) => {
                        if (char !== charElement) {
                            const origPos = selectedOriginalPos.get(char);
                            const newSelectedX = origPos.x + dx;
                            const newSelectedY = origPos.y + dy;
                            this.updateCharacterRoute(char, newSelectedX, newSelectedY);
                            this.setPlannedRoutePath(char, this.characterRoutes.get(char));
                        }
                    });
                } else {
                    //movimiento normal
                    this.moveCharacter(image(), newX, newY);
                    this.updateCross(cross(), newX, newY);
                    this.selectedCharacters.forEach((char) => {
                        if (char !== charElement) {
                            const origPos = selectedOriginalPos.get(char);
                            const newSelectedX = origPos.x + dx;
                            const newSelectedY = origPos.y + dy;

                            this.moveCharacter(char.querySelector('image'), newSelectedX, newSelectedY);
                            this.updateCharacterRoute(char, newSelectedX, newSelectedY);
                        }
                    });
                }
            }
        };

        const stopDragging = e => {
            if (!isDragging) return;
            isDragging = false;

            if (hasStartedDrag) {
                image().style.opacity = '1';
                // Ocultar cruz si no está configurada como visible
                CharacterUtils.portada(charElement);

                // Restore opacity for selected characters
                this.selectedCharacters.forEach((char) => {
                    if (char !== charElement) {
                        char.querySelector('image').style.opacity = '1';
                        // Ocultar cruz entera, con flecha, para caracteres seleccionados si no es portrait
                        CharacterUtils.portada(char);
                    }
                });

                if (this.rastro || this.routePlanningMode) {
                    // Draw paths for all moved characters
                    const drawPath = (char) => {
                        const ruta = this.characterRoutes.get(char);
                        if (ruta && ruta.length >= 2) {
                            try {
                                if (this.routePlanningMode) {
                                    this.setPlannedRoutePath(char, ruta);
                                } else {
                                    this.setNormalRoutePath(char, ruta);
                                }
                            } catch (error) {
                                console.error('Error creating path:', error);
                            }
                        }
                    };

                    drawPath(charElement);
                    this.selectedCharacters.forEach((char) => {
                        if (char !== charElement) {
                            drawPath(char);
                        }
                    });
                }

                if (this.routePlanningMode) {
                    const startPos = this.plannedStartPositions.get(charElement);
                    if (startPos) {
                        this.moveCharacter(image(), startPos.x, startPos.y, false);
                        this.updateCross(cross(), startPos.x, startPos.y);
                    }
                    this.selectedCharacters.forEach((char) => {
                        if (char !== charElement) {
                            const origPos = this.plannedStartPositions.get(char);
                            if (origPos) {
                                this.moveCharacter(char.querySelector('image'), origPos.x, origPos.y, false);
                            }
                        }
                    });
                    this.plannedStartPositions.clear();
                }

                if (this.routePlanningMode) {
                    this.plannedRoutes.set(charElement, this.characterRoutes.get(charElement) || []);
                    this.selectedCharacters.forEach((char) => {
                        if (char !== charElement) {
                            this.plannedRoutes.set(char, this.characterRoutes.get(char) || []);
                        }
                    });
                    this.refreshRouteSimulationRange();
                } else {
                    if (this.autoConfirmMove) {
                        this.originalPositions.clear();

                        if (SyncController.isOnline) {
                            this.saveDraggedCharactersState();
                        }
                    } else {
                        const confirmationDiv = document.getElementById('moveConfirmation');
                        const rect = charElement.getBoundingClientRect();
                        confirmationDiv.style.display = 'block';
                        confirmationDiv.style.left = `${rect.right - CONFIG.iconSize}px`;
                        confirmationDiv.style.top = `${rect.top - CONFIG.iconSize}px`;
                    }
                }

                //si estaba seleccionado antes de empezar a arrastar lo volvemos a seleccionar, porque el click largo lo ha deseleccionado
                if (wasSelected && wasSelected == charElement.getAttribute('id')) {
                    console.log('wasSelected', wasSelected);

                    this.selectedCharacters.set(wasSelected, charElement);
                    charElement.classList.add('selected');
                    this.drawSelectionCircle(charElement.querySelector('image'));
                    wasSelected = false;
                }
            } else {
                this.activeCharacter = charElement;
            }


            this.draggedCharacter = null;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', stopDragging);
            document.removeEventListener('touchend', stopDragging);
        };

        charElement.addEventListener('mousedown', startDragging);
        charElement.addEventListener('touchstart', startDragging);
    },

    /**
     * Setup rotation handlers for a character
     * @param {SVGElement} charElement - Character element
     */
    setupRotationHandlers(charElement) {
        // Set up mouse wheel with shift key for rotation
        charElement.addEventListener('wheel', (e) => {
            if (e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                let img = charElement.querySelector('image');
                let currentRotation = parseFloat(img.getAttribute('data-rotation')) || 0;
                let delta = e.deltaY > 0 ? 15 : -15;
                let newRotation = (currentRotation + delta) % 360;

                this.rotateCharacters(charElement, newRotation);
            }
        });

        // Touch rotation variables
        let startAngle = null;
        let startRotation = 0;

        // Calculate angle between two touch points
        const getAngle = (touch1, touch2) => {
            return Math.atan2(
                touch2.clientY - touch1.clientY,
                touch2.clientX - touch1.clientX
            ) * 180 / Math.PI;
        };

        // Touch rotation start
        charElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                MapController.panning = false;
                e.preventDefault();

                let img = charElement.querySelector('image');
                startRotation = parseFloat(img.getAttribute('data-rotation')) || 0;
                startAngle = getAngle(e.touches[0], e.touches[1]);
            }
        });

        // Touch rotation move
        charElement.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && startAngle !== null) {
                MapController.panning = false;
                e.preventDefault();
                e.stopPropagation();

                let currentAngle = getAngle(e.touches[0], e.touches[1]);
                let angleDelta = currentAngle - startAngle;

                let newRotation = (startRotation + angleDelta) % 360;
                if (newRotation < 0) newRotation += 360;
                this.rotateCharacters(charElement, newRotation);
            }
        });

        // Touch rotation end
        charElement.addEventListener('touchend', (e) => {
            if (startAngle !== null && e.touches.length < 2) {
                startAngle = null;

                // if (SyncController.isOnline) {
                //     if (this.selectedCharacters.size > 0) {
                //         this.selectedCharacters.forEach((char) => {
                //             if (char == charElement) return;
                //             SyncController.saveMapState(char);
                //         });
                //         SyncController.saveMapState(charElement);
                //     }
                // }
            }
        });

        // Touch cancel
        charElement.addEventListener('touchcancel', () => {
            startAngle = null;
        });
    },

    /**
     * Setup context menu for a character
     * @param {SVGElement} charElement - Character element
     */
    setupContextMenu(charElement) {
        charElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.activeCharacter = charElement;
            const contextMenu = document.getElementById('characterContextMenu');
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;

            // Update speed value
            const speedValue = document.getElementById('speedValue');
            speedValue.value = parseFloat(charElement.getAttribute('data-speed')) || CONFIG.defaultSpeed;
            this.updateRoutePlanningLabel();
        });


        // Añadir handler para ataque
        document.getElementById('attackCharacter').addEventListener('click', () => {
            this.startAttackMode(this.activeCharacter);
            document.getElementById('characterContextMenu').style.display = 'none';
        });

        // Cerrar el menú contextual al hacer clic en cualquier parte fuera del menú
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('characterContextMenu');
            if (contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });

        // Prevenir que el menú se cierre al interactuar con inputs dentro del menú
        const contextMenu = document.getElementById('characterContextMenu');
        contextMenu.querySelectorAll('input').forEach(input => {
            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Añadir event listeners para cerrar el menú al hacer clic en opciones que no requieren inputs
        const closeOnClick = ['deleteRoute', 'deleteCharacter', 'showStats', 'inventario'];
        closeOnClick.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', () => {
                    contextMenu.style.display = 'none';
                });
            }
        });
    },

    startAttackMode(attacker) {
        this.attackMode = true;
        this.attackingCharacter = attacker;
        document.body.classList.add('attack-mode');

        // Añadir listener temporal para cancelar el ataque con clic derecho
        const cancelAttack = (e) => {
            if (e.button === 2) {
                this.cancelAttackMode();
                document.removeEventListener('mousedown', cancelAttack);
            }
        };
        document.addEventListener('mousedown', cancelAttack);
    },

    cancelAttackMode() {
        this.attackMode = false;
        this.attackingCharacter = null;
        document.body.classList.remove('attack-mode');
    },

    performAttack(targetCharacter) {
        if (!this.attackMode || !this.attackingCharacter) return;

        // Trigger attack animation
        targetCharacter.classList.add('attack-animation');

        // Obtener la posición del personaje atacado
        const img = targetCharacter.querySelector('image');
        const x = parseFloat(img.getAttribute('data-x'));
        const y = parseFloat(img.getAttribute('data-y'));

        // Crear efecto de onda (radio de 2 metros con degradado)
        MapController.createAreaEffect(x, y, 100 / MapController.scale, 0.7, true, 1000);

        setTimeout(() => {
            targetCharacter.classList.remove('attack-animation');
        }, 300);

        // Usar el método handleAttackClick para gestionar el ataque
        this.handleAttackClick(targetCharacter);
    },

    /**
     * Toggle path visibility
     */
    togglePath() {
        console.log('togglePath()');
        this.rastro = !this.rastro;
        svgElement.querySelectorAll('.character-route').forEach(el => {
            el.style.display = this.rastro ? 'block' : 'none';
        });

        // Update toggle path text in both menus
        const mapTogglePathItem = document.getElementById('mapTogglePath');
        if (mapTogglePathItem) {
            mapTogglePathItem.textContent = this.rastro ? 'Ocultar camino' : 'Mostrar camino';
        }
        if (this.rastro) ocultarCamino.checked =false
        else ocultarCamino.checked =true;
    },

    /**
     * Delete the route for the active character
     */
    deleteRoute() {
        if (!this.activeCharacter) return;
        if (this.selectedCharacters.size > 0) {
            this.selectedCharacters.forEach((char) => {
                svgElement.querySelectorAll(`.${char.id}-route`).forEach(el => {
                    el.remove();
                });
                svgElement.querySelectorAll(`.${char.id}-planned-route`).forEach(el => {
                    el.remove();
                });
                this.plannedRoutes.delete(char);
            });
        } else
            svgElement.querySelectorAll(`.${this.activeCharacter.id}-route`).forEach(el => {
                el.remove();
            });
        if (this.selectedCharacters.size === 0) {
            svgElement.querySelectorAll(`.${this.activeCharacter.id}-planned-route`).forEach(el => {
                el.remove();
            });
            this.plannedRoutes.delete(this.activeCharacter);
        }
        this.refreshRouteSimulationRange();
    },

    /**
     * Delete the active character
     */
    deleteCharacter() {
        if (!this.activeCharacter) return;
        if (this.selectedCharacters.size > 0) {
            this.selectedCharacters.forEach((char) => {
                this.borrarP(char);
            });
        } else
            this.borrarP(this.activeCharacter);

    }
    ,
    /**
     * Borrar un personaje del mapa
     * @param {SVGElement} char - Personaje a eliminar
     */
    borrarP(char) {
        if (!char) return;

        const id = char.getAttribute('id');
        // Clean up
        this.characterRoutes.delete(char);
        this.plannedRoutes.delete(char);
        this.plannedStartPositions.delete(char);
        svgElement.querySelectorAll(`.${id}-route`).forEach(el => {
            el.remove();
        });
        svgElement.querySelectorAll(`.${id}-planned-route`).forEach(el => {
            el.remove();
        });

        char.remove();
        this.characters.delete(id);
        this.activeCharacter = null;
    },

    /**
     * Create position cross marker for dragging
     * @returns {SVGElement} - The created cross element
     */
    createPositionCross() {
        const crossGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        crossGroup.setAttribute('class', 'position-cross');
        crossGroup.style.display = 'block';

        // Horizontal line
        const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        hLine.setAttribute('stroke', 'white 0');
        hLine.setAttribute('stroke-width', '1');

        // Vertical line
        const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        vLine.setAttribute('stroke', 'white 0');
        vLine.setAttribute('stroke-width', '1');

        crossGroup.appendChild(hLine);
        crossGroup.appendChild(vLine);

        return crossGroup;
    },

    drawSelectionCircle(char) {
        // Draw selection circle
        if (char.parentElement.classList.contains('selected')) {
            const size = parseFloat(char.getAttribute('width'));
            let x = parseFloat(char.getAttribute('data-x')) || parseFloat(char.getAttribute('x')) + size / 2;
            let y = parseFloat(char.getAttribute('data-y')) || parseFloat(char.getAttribute('y')) + size / 2;
            const circle = char.parentElement.querySelector('.selection-circle') ||
                document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('class', 'selection-circle');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke-width', 0.000001);
            circle.setAttribute('r', size / 2);
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            if (!char.parentElement.contains(circle)) {
                char.parentElement.appendChild(circle);
            }
        } else {
            const circle = char.parentElement.querySelector('.selection-circle');
            if (circle) circle.remove();
        }
    },

    /**
     * Update position cross during character drag
     * @param {SVGElement} crossEl - The cross element
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    updateCross(crossEl, x, y) {
        if (!crossEl) return;

        const [hLine, vLine] = crossEl.children;
        const halfCross = (CONFIG.iconSize / 2) / MapController.scale;
        const strokeWidth = 2 / MapController.scale;

        // Update cross lines
        hLine.setAttribute('x1', x - halfCross);
        hLine.setAttribute('x2', x + halfCross);
        hLine.setAttribute('y1', y);
        hLine.setAttribute('y2', y);
        hLine.setAttribute('stroke-width', strokeWidth);
        hLine.setAttribute('stroke', 'white ');

        vLine.setAttribute('x1', x);
        vLine.setAttribute('x2', x);
        vLine.setAttribute('y1', y - halfCross);
        vLine.setAttribute('y2', y + halfCross);
        vLine.setAttribute('stroke-width', strokeWidth);
        vLine.setAttribute('stroke', 'white');

        // opacity 0.5
        vLine.setAttribute('opacity', '0.5');
        hLine.setAttribute('opacity', '0.5');


        // Update or create arrow
        let arrow = crossEl.querySelector('.cross-arrow');
        if (!arrow) {
            arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
            arrow.setAttribute('class', 'cross-arrow');
            crossEl.appendChild(arrow);
        }

        // Create chevron with scaled size
        const chevronPath = `M ${x - halfCross} ${y} L ${x} ${y + halfCross} L ${x + halfCross} ${y}`;
        arrow.setAttribute('d', chevronPath);
        arrow.setAttribute('stroke', 'red');
        arrow.setAttribute('stroke-width', strokeWidth);
        arrow.setAttribute('fill', 'none');
    },

    rotateCharacters(charElement, newRotation) {
        if (this.selectedCharacters.size > 0) {
            this.selectedCharacters.forEach((char) => {
                if (char == charElement) return;
                // CharacterUtils.rotate(char.querySelector('image'),newRotation);
                CharacterUtils.rotate(char, newRotation);
            });
        }
        // CharacterUtils.rotate(img, newRotation); //por si falla lo de abajo
        CharacterUtils.rotate(charElement, newRotation);
    },

    /**
     * Move character to position
     * @param {SVGImageElement} image - Character image element
     * @param {number|Object} newX - X coordinate or position object
     * @param {number} newY - Y coordinate (if newX is not an object)
     */
    moveCharacter(image, newX, newY, saveState = true) {
        let x, y;

        // Handle both coordinate formats
        ({ x, y } = newX.x !== undefined && newX.y !== undefined ?
            { x: newX.x, y: newX.y } :
            { x: newX, y: newY });

        // Store coordinates
        image.setAttribute('data-x', x);
        image.setAttribute('data-y', y);

        // Set position considering icon size
        const size = parseFloat(image.getAttribute('width'));
        image.setAttribute('x', x - size / 2);
        image.setAttribute('y', y - size / 2);

        this.drawSelectionCircle(image);

        // Save state if online
        if (saveState && SyncController.isOnline) {
            SyncController.saveMapState(image.parentElement);
        }
    },

    getActivePersonaje() {
        if (!this.activeCharacter) return null;
        const personaje = this.activeCharacter.nombre;
        return this.personajes.get(personaje);
    },

    /**
     * Move character by name to a location
     * @param {string} personaje - Character name
     * @param {string|Object} lugar - Target location name or coordinates
     */
    moveCharacterToLocation(personaje, lugar) {
        let coords = typeof lugar === 'string' ?
            SVGUtils.findCoordinates(lugar) :
            lugar;

        let img = this.getCharacterImage(personaje);

        // Only move if valid target and character
        if (!coords || !img) return;

        this.moveCharacter(img, coords);

    },

    /**
     * Get character position
     * @param {string} personaje - Character name
     * @returns {Object} - Character position {x, y}
     */
    getCharacterLocation(personaje) {
        const img = this.getCharacterImage(personaje);
        if (!img) return null;

        const x = img.getAttribute('data-x');
        const y = img.getAttribute('data-y');
        return { x: parseFloat(x), y: parseFloat(y) };
    },

    /**
     * Get character screen position
     * @param {string} personaje - Character name
     * @returns {Object} - Character screen position {x, y}
     */
    getCharacterScreenLocation(personaje) {
        const img = this.getCharacterImage(personaje);
        if (!img) return null;

        const x = img.getAttribute('x');
        const y = img.getAttribute('y');
        return { x: parseFloat(x), y: parseFloat(y) };
    },

    /**
     * Find nearest location name to a character
     * @param {string} personaje - Character name
     * @returns {string|null} - Name of nearest location
     */
    findNearestLocation(personaje) {
        const loc = this.getCharacterLocation(personaje);
        if (!loc || !svgElement) return null;

        return SVGUtils.findNearestText(loc);
    },

    /**
     * Get character image element by name
     * @param {string} personaje - Character name
     * @returns {SVGImageElement|null} - Character image element
     */
    getCharacterImage(personaje) {
        return this.characters.get(personaje)?.querySelector('image') || null;
    },

    /**
     * Update characters' transform on zoom
     */
    updateTransformCharacters() {
        if (!svgElement) return;
        let grosor = MapController.grosorCamino(3);
        if (this.rastro)
            svgElement.querySelectorAll('.character-route').forEach(el => {
                //cambiar el grosor de la linea
                MapController.grosorCamino(3, el);
            });

        svgElement.querySelectorAll('.measure-line').forEach(el => {
            console.log('measureline encontrada');
            MapController.grosorCamino(3, el);
            //cambiar el grosor de la linea
            // el.setAttribute('stroke-width', grosor);
            // el.setAttribute('stroke-dasharray', `${2*grosor} ${grosor}`);
        });



        const characterEls = svgElement.querySelectorAll('.character');
        characterEls.forEach(char => {
            const img = char.querySelector('image');
            const cross = char.querySelector('.position-cross');
            //TODO: permitir valores personalizados de iconos            
            const size = CONFIG.iconSize / MapController.scale;

            // Update image size and position
            img.setAttribute('width', size);
            img.setAttribute('height', size);

            const x = parseFloat(img.getAttribute('data-x') || img.getAttribute('x'));
            const y = parseFloat(img.getAttribute('data-y') || img.getAttribute('y'));

            img.setAttribute('x', x - size / 2);
            img.setAttribute('y', y - size / 2);

            // Update cross and arrow if they exist
            if (cross) {
                this.updateCross(cross, x, y);
            }

            this.drawSelectionCircle(img);
        });
    },
};

/**
 * Character utility functions
 */
const CharacterUtils = {
    /**
     * Rotate a character image
     * @param {SVGImageElement|SVGElement} img - Character image or element
     * @param {number} angle - Rotation angle in degrees
     */
    /**
     * Rotate a character image
     * @param {SVGImageElement|SVGElement} img - Character image or group
     * @param {number} angle - Rotation angle in degrees
     * @param {boolean} skipSync - If true, won't save to Firebase (for synced updates)
     */
    rotate(img, angle, skipSync = false) {
        if (!img) return;

        // If passed the character group instead of the image
        if (img.tagName === 'g') {
            img = img.querySelector('image');
            if (!img) return;
        }

        let p = img.parentElement;
        if (DOM.hasClass(p, 'portrait')) {
            // La imagen debe estar igual
        }
        else {
            img.style.transformBox = 'fill-box';
            img.style.transformOrigin = 'center';
            img.setAttribute('data-rotation', angle);
            img.style.transform = `rotate(${angle}deg)`;
        }

        let arrow = img.parentElement.querySelector('.position-cross');
        if (arrow) {
            img.setAttribute('data-rotation', angle);
            arrow.style.transformBox = 'fill-box';
            arrow.style.transformOrigin = 'center';
            arrow.setAttribute('data-rotation', angle);
            arrow.style.transform = `rotate(${angle}deg)`;
            CharacterUtils.portada(p);
        }

        // Only save to Firebase if this is a local user action, not a synced update
        if (SyncController.isOnline && !skipSync) {
            SyncController.saveMapState(img.parentElement);
        }
    }
    ,

    /**
     * Rotate a character by a relative amount
     * @param {SVGImageElement|SVGElement} img - Character image or group
     * @param {number} angle - Degrees to rotate (positive or negative)
     * @param {boolean} skipSync - If true, won't save to Firebase (for synced updates)
     */
    rotateMore(img, angle, skipSync = false) {
        if (!img) return;
        // If passed the character group instead of the image
        if (img.tagName === 'g') {
            img = img.querySelector('image');
            if (!img) return;
        }
        let grados = img.getAttribute('data-rotation') || 0;
        this.rotate(img, grados + angle, skipSync);
    },
    /**
     * Set the visibility of the cross and arrow for a character if portrait or not
     * @param {SVGElement} char - Character element
     */
    portada(char) {
        if (!char) return;
        if (DOM.hasClass(char, 'portrait')) {
            //oculta las lineas pero no la flecha
            char.querySelector('.position-cross').style.display = 'block';
            char.querySelector('.position-cross').querySelectorAll('line').forEach(line => {
                line.setAttribute('stroke', 'white 0');
            });
        }
        else {
            char.querySelector('.position-cross').style.display = 'none';
        }
    }
};

