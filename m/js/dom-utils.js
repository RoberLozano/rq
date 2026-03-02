/**
 * DOM Utilities Module
 * Provides helper functions for DOM manipulation
 */
const DOM = {
    // Element cache
    cache: {},
    
    /**
     * Get element with caching for better performance
     * @param {string} id - Element ID
     * @returns {HTMLElement} - The requested element
     */
    getElement(id) {
        if (!this.cache[id]) {
            this.cache[id] = document.getElementById(id);
        }
        return this.cache[id];
    },


    /**
     * Devuelve si un elemento tiene una clase
     * @param {HTMLElement} element - Elemento a comprobar
     * @param {string} className - Nombre de la clase a comprobar
     * @returns {boolean} - True si el elemento tiene la clase, false en caso contrario
     */
    hasClass(element, className) {
        return element.classList.contains(className);
    },
    
    /**
     * Create SVG element with namespace
     * @param {string} tagName - SVG element tag name
     * @param {Object} attributes - Attributes to set on the element
     * @returns {SVGElement} - The created SVG element
     */
    createSVGElement(tagName, attributes = {}) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    },
    
    /**
     * Create HTML element
     * @param {string} tagName - HTML element tag name
     * @param {Object} attributes - Attributes to set on the element
     * @param {string} textContent - Optional text content
     * @returns {HTMLElement} - The created HTML element
     */
    createElement(tagName, attributes = {}, textContent = '') {
        const element = document.createElement(tagName);
        
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'class' || key === 'className') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        }
        
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    },

    
    
    /**
     * Add event listener with proper context
     * @param {HTMLElement|SVGElement} element - Element to add the event to
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     */
    addEvent(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
        }
    }
};
