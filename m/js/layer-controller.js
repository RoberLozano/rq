/**
 * Layer Controller Module
 * Handles SVG layer management and filtering
 */
const LayerController = {
    // Layers state
    layers: new Map(),
    
    /**
     * Initialize layer controller
     */
    init() {
        this.layersList = DOM.getElement('layersList');
        this.layerSearch = DOM.getElement('layerSearch');
        
        // Set up search filtering
        this.layerSearch.addEventListener('input', this.filterLayers.bind(this));
    },
    
    /**
     * Setup layers from SVG
     */
    setupLayers() {
        if (!svgElement) return;
        
        // Clear previous layers list
        this.layersList.innerHTML = '';
        this.layers.clear();
        
        // Find all layers (g elements)
        const groups = Array.from(svgElement.querySelectorAll('g'));
        
        // Filter for valid layers and sort alphabetically
        const layerGroups = groups
            .filter(g => g.getAttribute('id') && !g.classList.contains('character'))
            .sort((a, b) => {
                const aId = a.getAttribute('id') || '';
                const bId = b.getAttribute('id') || '';
                return aId.localeCompare(bId);
            });
            
        // Add layer toggle elements
        layerGroups.forEach(layer => {
            const id = layer.getAttribute('id');
            this.layers.set(id, layer);
            
            // Create checkbox and label
            const layerItem = DOM.createElement('div', { class: 'layer-item' });
            const checkbox = DOM.createElement('input', {
                type: 'checkbox',
                id: `layer-${id}`,
                checked: layer.style.display !== 'none'
            });
            const label = DOM.createElement('label', {
                for: `layer-${id}`
            }, id);
            
            // Set initial visibility
            layer.style.display = checkbox.checked ? 'inline' : 'none';
            
            // Add layer toggle handler
            checkbox.addEventListener('change', () => {
                layer.style.display = checkbox.checked ? 'inline' : 'none';
                this.saveLayerState();
            });
            
            // Append to DOM
            layerItem.appendChild(checkbox);
            layerItem.appendChild(label);
            this.layersList.appendChild(layerItem);
        });
        
        // Load saved layer state
        this.loadLayerState();
    },
    
    /**
     * Filter layers based on search text
     */
    filterLayers() {
        const searchText = this.layerSearch.value.toLowerCase();
        const layerItems = this.layersList.querySelectorAll('.layer-item');
        
        layerItems.forEach(item => {
            const label = item.querySelector('label');
            const itemText = label.textContent.toLowerCase();
            
            if (itemText.includes(searchText)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    },
    
    /**
     * Save layer visibility state to local storage
     */
    saveLayerState() {
        const layerState = {};
        
        this.layers.forEach((layer, id) => {
            layerState[id] = layer.style.display !== 'none';
        });
        
        try {
            localStorage.setItem('layerState', JSON.stringify(layerState));
        } catch (e) {
            console.error('Error saving layer state:', e);
        }
    },
    
    /**
     * Load layer visibility state from local storage
     */
    loadLayerState() {
        try {
            const savedState = localStorage.getItem('layerState');
            if (!savedState) return;
            
            const layerState = JSON.parse(savedState);
            
            // Apply saved visibility
            for (const [id, visible] of Object.entries(layerState)) {
                const layer = this.layers.get(id);
                const checkbox = document.getElementById(`layer-${id}`);
                
                if (layer && checkbox) {
                    layer.style.display = visible ? 'inline' : 'none';
                    checkbox.checked = visible;
                }
            }
        } catch (e) {
            console.error('Error loading layer state:', e);
        }
    },
    
    /**
     * Show all layers
     */
    showAllLayers() {
        const checkboxes = this.layersList.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            const id = checkbox.id.replace('layer-', '');
            const layer = this.layers.get(id);
            
            if (layer) {
                layer.style.display = 'inline';
            }
        });
        
        this.saveLayerState();
    },
    
    /**
     * Hide all layers
     */
    hideAllLayers() {
        const checkboxes = this.layersList.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const id = checkbox.id.replace('layer-', '');
            const layer = this.layers.get(id);
            
            if (layer) {
                layer.style.display = 'none';
            }
        });
        
        this.saveLayerState();
    }
};
