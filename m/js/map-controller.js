/**
 * Map Controller Module
 * Handles map operations, transformations, and events
 */
const MapController = {
    // Map state
    scale: 1,
    pointX: 0,
    pointY: 0,
    panning: false,
    start: { x: 0, y: 0 },
    lastDist: null,
    measuring: false,
    measureStart: null,
    measureLine: null,
    measureText: null,
    
    /**
     * Initialize the map controller
     */
    init() {
        this.mapContainer = document.getElementById("map-container");
        this.svgContainer = document.getElementById("svg-container");
        this.setupEventListeners();
    },

    grosorCamino(mult=1, pathElem){
        if(pathElem){
            let grosor= mult/this.scale;
            pathElem.setAttribute('stroke-width', grosor);
            pathElem.setAttribute('stroke-dasharray', `${2*grosor} ${1.5*grosor}`);
        }
        return mult/this.scale;
    },
    
    /**
     * Set up map event listeners
     */
    setupEventListeners() {
        // Touch events
        this.mapContainer.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.mapContainer.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.mapContainer.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Mouse events
        this.mapContainer.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.mapContainer.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.mapContainer.addEventListener('mouseup', () => this.panning = false);
        this.mapContainer.addEventListener('mouseleave', () => this.panning = false);
        this.mapContainer.addEventListener('wheel', this.handleWheelZoom.bind(this));
        
        // Button handlers
        document.getElementById('zoomIn').addEventListener('click', this.zoomIn.bind(this));
        document.getElementById('zoomOut').addEventListener('click', this.zoomOut.bind(this));
        document.getElementById('resetView').addEventListener('click', this.resetView.bind(this));
        document.getElementById('searchButton').addEventListener('click', this.handleSearch.bind(this));

        // Configurar el menú contextual del mapa
        this.setupMapContextMenu();

        // Añadir soporte para long press en dispositivos táctiles
        let longPressTimer;
        const longPressDuration = 500; // medio segundo para considerar long press

        this.mapContainer.addEventListener('touchstart', (e) => {
            // Solo proceder si es un único toque y no es en un personaje
            if (e.touches.length !== 1 || e.target.closest('.character')) return;
            
            longPressTimer = setTimeout(() => {
                const contextMenu = document.getElementById('mapContextMenu');
                contextMenu.style.display = 'block';
                contextMenu.style.left = `${e.touches[0].pageX}px`;
                contextMenu.style.top = `${e.touches[0].pageY}px`;
                
                // Actualizar texto del toggle path
                const togglePathItem = document.getElementById('mapTogglePath');
                togglePathItem.textContent = CharacterController.rastro ? 'Ocultar camino' : 'Mostrar camino';
                
                // Actualizar valor de escala
                const scaleValue = document.getElementById('mapScaleValue');
                scaleValue.value = CONFIG.distanceScaleFactor;
            }, longPressDuration);
        });

        this.mapContainer.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });

        this.mapContainer.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        });
    },
    
    /**
     * Setup map context menu
     */
    setupMapContextMenu() {
        // Mostrar menú contextual con clic derecho en el mapa
        this.mapContainer.addEventListener('contextmenu', (e) => {
            // No mostrar si el clic es en un personaje
            if (e.target.closest('.character')) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const contextMenu = document.getElementById('mapContextMenu');
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
            
            // Actualizar texto del toggle path
            const togglePathItem = document.getElementById('mapTogglePath');
            togglePathItem.textContent = CharacterController.rastro ? 'Ocultar camino' : 'Mostrar camino';
            
            // Actualizar valor de escala
            const scaleValue = document.getElementById('mapScaleValue');
            scaleValue.value = CONFIG.distanceScaleFactor;
        });
        
        // Separar los eventos de click y touch
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('mapContextMenu');
            if (contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });

        document.addEventListener('touchstart', (e) => {
            const contextMenu = document.getElementById('mapContextMenu');
            if (contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
                e.preventDefault();
                contextMenu.style.display = 'none';
            }
        });

        // Prevenir que el menú se cierre al interactuar con inputs
        const contextMenu = document.getElementById('mapContextMenu');
        contextMenu.querySelectorAll('input').forEach(input => {
            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
        
        // Prevenir que el menú se cierre al tocar dentro de él
        contextMenu.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        });

        // Añadir handler para el botón de medición
        document.getElementById('mapMeasure').addEventListener('click', () => {
            this.startMeasuring();
            document.getElementById('mapContextMenu').style.display = 'none';
        });
    },

    startMeasuring() {
        this.measuring = true;
        this.mapContainer.style.cursor = 'crosshair';
        
        const measureHandler = (e) => {
            if (!this.measuring) return;
            
            const point = SVGUtils.getPointInSVG(e.clientX, e.clientY);
            if (!point) return;

            if (!this.measureStart) {
                // Primer click - iniciar medición
                this.measureStart = point;
                
                // Crear elementos de medición
                this.measureLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                this.measureLine.classList.add('measure-line');
                this.measureText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                this.measureText.classList.add('measure-text');

                this.measureLine.setAttribute('stroke-width', 1 / MapController.scale);
                this.measureLine.setAttribute('stroke-dasharray', '1 1');
                
                svgElement.appendChild(this.measureLine);
                svgElement.appendChild(this.measureText);
                
                this.measureLine.setAttribute('x1', point.x);
                this.measureLine.setAttribute('y1', point.y);
            } else {
                // Segundo click - finalizar medición
                const dx = point.x - this.measureStart.x;
                const dy = point.y - this.measureStart.y;
                const distance = Math.sqrt(dx * dx + dy * dy) * CONFIG.distanceScaleFactor;
                
                // Limpiar medición
                if (this.measureLine) this.measureLine.remove();
                if (this.measureText) this.measureText.remove();
                
                this.measuring = false;
                this.measureStart = null;
                this.mapContainer.style.cursor = 'default';
                this.mapContainer.removeEventListener('click', measureHandler);
            }
        };

        const mouseMoveHandler = (e) => {
            if (!this.measuring || !this.measureStart) return;
            
            const point = SVGUtils.getPointInSVG(e.clientX, e.clientY);
            if (!point) return;

            // Actualizar línea
            this.measureLine.setAttribute('x2', point.x);
            this.measureLine.setAttribute('y2', point.y);

            // Calcular y mostrar distancia
            const dx = point.x - this.measureStart.x;
            const dy = point.y - this.measureStart.y;
            const distance = Math.sqrt(dx * dx + dy * dy) * CONFIG.distanceScaleFactor;
            
            // Actualizar texto
            const textX = (point.x + this.measureStart.x) / 2;
            const textY = (point.y + this.measureStart.y) / 2 - 10;
            this.measureText.setAttribute('x', textX);
            this.measureText.setAttribute('y', textY);
            this.measureText.textContent = distance >= 1000 ? 
                `${(distance/1000).toFixed(2)} km` : 
                `${distance.toFixed(0)} m`;
        };

        this.mapContainer.addEventListener('click', measureHandler);
        this.mapContainer.addEventListener('mousemove', mouseMoveHandler);
    },
    
    /**
     * Handle touch start event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            this.panning = true;
            this.start = {
                x: e.touches[0].clientX - this.pointX,
                y: e.touches[0].clientY - this.pointY
            };
        }
    },
    
    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1 && this.panning) {
            this.pointX = e.touches[0].clientX - this.start.x;
            this.pointY = e.touches[0].clientY - this.start.y;
            this.setTransform();
        } else if (e.touches.length === 2) {
            this.panning = false;
            this.handlePinchZoom(e);
        }
    },
    
    /**
     * Handle pinch zoom with two fingers
     * @param {TouchEvent} e - Touch event
     */
    handlePinchZoom(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // Calculate midpoint between two fingers
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        
        // Calculate distance between two fingers
        const dist = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        if (this.lastDist) {
            const svgPointBefore = SVGUtils.getPointInSVG(midX, midY);
            if (!svgPointBefore) return;
            
            // Calculate zoom delta based on finger distance difference
            const delta = dist - this.lastDist;
            this.scale += delta * 0.01;
            this.scale = Math.min(Math.max(CONFIG.minScale, this.scale), CONFIG.maxScale);
            
            // Apply initial transformation
            this.setTransform();
            
            // Adjust position to keep the point under the fingers
            const svgPointAfter = SVGUtils.getPointInSVG(midX, midY);
            if (!svgPointAfter) return;
            
            this.pointX += (svgPointAfter.x - svgPointBefore.x) * this.scale;
            this.pointY += (svgPointAfter.y - svgPointBefore.y) * this.scale;
            this.setTransform();
        }
        
        this.lastDist = dist;
    },
    
    /**
     * Handle touch end event
     */
    handleTouchEnd() {
        this.panning = false;
        this.lastDist = null;
    },
    
    /**
     * Handle mouse down event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseDown(e) {
        if (e.button === 2) {
            this.panning = false;
            return;
        }
        
        this.panning = true;
        this.start = {
            x: e.clientX - this.pointX,
            y: e.clientY - this.pointY
        };
        
        // Log SVG coordinates for debugging
        const svgPoint = SVGUtils.getPointInSVG(e.clientX, e.clientY);
        if (svgPoint) {
            console.log('SVG Coordinates:', svgPoint.x, svgPoint.y);
        }
    },
    
    /**
     * Handle mouse move event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        if (this.panning) {
            this.pointX = e.clientX - this.start.x;
            this.pointY = e.clientY - this.start.y;
            this.setTransform();
        }
    },
    
    /**
     * Handle wheel zoom event
     * @param {WheelEvent} e - Wheel event
     */
    handleWheelZoom(e) {
        e.preventDefault();
        
        const zoomFactor = e.deltaY < 0 ? CONFIG.zoomInFactor : CONFIG.zoomOutFactor;
        this.zoomToPoint({ x: e.clientX, y: e.clientY }, zoomFactor);
    },
    
    /**
     * Zoom to a specific point
     * @param {Object} point - Point to zoom to {x, y}
     * @param {number} zoomFactor - Factor to zoom by
     */
    zoomToPoint(point, zoomFactor) {
        const svgPointBefore = SVGUtils.getPointInSVG(point.x, point.y);
        if (!svgPointBefore) return;
        
        const newScale = Math.min(Math.max(CONFIG.minScale, this.scale * zoomFactor), CONFIG.maxScale);
        this.scale = newScale;
        this.setTransform();
        
        const svgPointAfter = SVGUtils.getPointInSVG(point.x, point.y);
        if (!svgPointAfter) return;
        
        this.pointX += (svgPointAfter.x - svgPointBefore.x) * this.scale;
        this.pointY += (svgPointAfter.y - svgPointBefore.y) * this.scale;
        this.setTransform();
    },
    
    /**
     * Zoom in centered on the viewport
     * @param {number} factor - Zoom factor
     */
    zoomIn(factor) {
        this.zoomToPoint(
            { x: window.innerWidth / 2, y: window.innerHeight / 2 }, 
            factor||CONFIG.zoomInFactor
        );
    },
    
    /**
     * Zoom out centered on the viewport
     */
    zoomOut() {
        this.zoomToPoint(
            { x: window.innerWidth / 2, y: window.innerHeight / 2 }, 
            CONFIG.zoomOutFactor
        );
    },
    
    /**
     * Reset the view to default
     */
    resetView() {
        this.scale = 1;
        this.pointX = 0;
        this.pointY = 0;
        this.setTransform();
    },
    
    /**
     * Handle search button click
     */
    handleSearch() {
        const searchText = document.getElementById('searchInput').value;
        this.zoomToText(searchText);
    },
    
    /**
     * Zoom to text element with specific content
     * @param {string} text - Text to find and zoom to
     */
    zoomToText(text) {
        if (!svgElement) return;
        
        this.scale = 1;
        this.setTransform();
        
        const transformedCenter = SVGUtils.findCoordinates(text);
        if (!transformedCenter) {
            console.warn('Element not found:', text);
            return;
        }
        
        // console.log('Zooming to:', transformedCenter.x, transformedCenter.y);
        
        this.pointX = -transformedCenter.x * this.scale + this.mapContainer.clientWidth / 2;
        this.pointY = -transformedCenter.y * this.scale + this.mapContainer.clientHeight / 2;
        this.setTransform();
    },
    
    /**
     * Apply transform to SVG element
     */
    setTransform() {
        if (svgElement) {
            svgElement.style.transform = `translate(${this.pointX}px, ${this.pointY}px) scale(${this.scale})`;
            CharacterController.updateTransformCharacters();
        }
    },
    
    /**
     * Load map from URL
     * @param {string} url - URL of the SVG map file
     * @returns {Promise} - Promise that resolves when the map is loaded
     */
    async loadMapFromURL(url) {
        console.log(url);
        
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.svgContainer.innerHTML = event.target.result;
                    svgElement = this.svgContainer.querySelector('svg');
                    this.adjustContainerToSVG();
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsText(blob);
                let nombre = url.split('/').pop();
                // Remove the extension from the filename
                nombre= nombre.substring(0, nombre.lastIndexOf('.'));
                
                CONFIG.map = nombre;
                console.log('Loaded map:', CONFIG.map);
                
            });
        } catch (error) {
            console.error('Error loading map:', error);
            throw error;
        }
    },
    
    /**
     * Adjust container to SVG size and restore characters
     */
    adjustContainerToSVG() {
        if (svgElement) {
            // Store existing characters
            const existingCharacters = svgElement.querySelectorAll('.character');
            existingCharacters.forEach(char => {
                const image = char.querySelector('image');
                if (image) {
                    const x = image.getAttribute('x');
                    const y = image.getAttribute('y');
                    const href = image.getAttribute('href');
                    characters.set(char.id, { x, y, href });
                }
            });
            
            const bbox = svgElement.getBBox();
            this.svgContainer.style.width = `${bbox.width}px`;
            this.svgContainer.style.height = `${bbox.height}px`;
            this.svgContainer.style.overflow = 'visible';
            
            this.pointX = 0;
            this.pointY = 0;
            this.scale = 1;
            this.setTransform();
            
            LayerController.setupLayers();
            
            // Restore characters
            characters.forEach((data, id) => {
                if (typeof data === 'object' && data.href) {
                    CharacterController.addCharacterToMap(data.href, { x: data.x, y: data.y });
                }
            });
        }
    },

    /**
     * Dibuja un círculo de área de efecto y devuelve los personajes afectados
     * @param {number} x - Coordenada X del centro
     * @param {number} y - Coordenada Y del centro
     * @param {number} radiusMeters - Radio en metros
     * @param {number} opacity - Opacidad del círculo (0-1)
     * @param {boolean} gradient - Si se usa degradado radial
     * @param {number} ms - Tiempo en milisegundos para eliminar el círculo
     * @param {string} color - Color del círculo
     * @returns {Array} - Array de personajes dentro del área
     */
    createAreaEffect(x, y, radiusMeters, opacity = 0.5, gradient = false, ms=2000, color='red') {
        if (!svgElement) return [];

        const radius = radiusMeters / CONFIG.distanceScaleFactor;

        // Crear el círculo
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('class', 'area-effect');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', radius);

        if (gradient) {
            // Crear degradado radial
            const gradientId = `areaGradient-${Date.now()}`;
            const radialGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
            radialGradient.setAttribute('id', gradientId);
            radialGradient.setAttribute('cx', '50%');
            radialGradient.setAttribute('cy', '50%');
            radialGradient.setAttribute('r', '50%');

            // Stops del degradado
            const stops = [
                { offset: '0%', opacity: opacity },
                { offset: '50%', opacity: opacity * 0.5 }, //75%
                { offset: '100%', opacity: 0 }
            ];

            stops.forEach(stop => {
                const stopEl = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                stopEl.setAttribute('offset', stop.offset);
                stopEl.setAttribute('stop-color', color);
                stopEl.setAttribute('stop-opacity', stop.opacity);
                radialGradient.appendChild(stopEl);
            });

            // Añadir el degradado al SVG
            const defs = svgElement.querySelector('defs') || 
                        svgElement.insertBefore(document.createElementNS("http://www.w3.org/2000/svg", "defs"), 
                        svgElement.firstChild);
            defs.appendChild(radialGradient);

            circle.setAttribute('fill', `url(#${gradientId})`);
            circle.setAttribute('stroke', 'none');
        } else {
            // Estilo sólido original
            circle.setAttribute('fill', color);
            circle.setAttribute('opacity', opacity);
            circle.setAttribute('stroke', 'none');
        }

        svgElement.appendChild(circle);

        // Encontrar personajes afectados
        const affectedCharacters = [];
        CharacterController.characters.forEach((char) => {
            const img = char.querySelector('image');
            const charX = parseFloat(img.getAttribute('data-x'));
            const charY = parseFloat(img.getAttribute('data-y'));
            
            const dx = charX - x;
            const dy = charY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius) {
                affectedCharacters.push(char);
            }
        });

        // Eliminar el círculo después de un tiempo
        setTimeout(() => {
            circle.remove();
            // Limpiar el gradiente si existe
            if (gradient) {
                const gradientEl = svgElement.querySelector(`#areaGradient-${Date.now()}`);
                if (gradientEl) gradientEl.remove();
            }
        }, ms);

        return affectedCharacters;
    },
};
