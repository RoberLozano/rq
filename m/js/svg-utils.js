/**
 * SVG Utilities Module
 * Provides helper functions for SVG manipulation and calculations
 */
const SVGUtils = {
    /**
     * Get point in SVG coordinates from screen coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object|null} - SVG coordinates {x, y} or null if transform failed
     */
    getPointInSVG(screenX, screenY) {
        if (!svgElement) return null;
        
        // Create an SVG point
        const svgPoint = svgElement.createSVGPoint();
        svgPoint.x = screenX;
        svgPoint.y = screenY;
        
        // Get the current transformation matrix of the SVG
        const CTM = svgElement.getScreenCTM();
        if (!CTM) return null;
        
        try {
            const invertedCTM = CTM.inverse();
            const transformedPoint = svgPoint.matrixTransform(invertedCTM);
            
            return {
                x: transformedPoint.x,
                y: transformedPoint.y
            };
        } catch (e) {
            console.error('Error transforming point:', e);
            return null;
        }
    },
    
    /**
     * Get center coordinates of an SVG element
     * @param {SVGElement} el - SVG element
     * @returns {Object} - Center coordinates {x, y}
     */
    getElementCenter(el) {
        const bbox = el.getBBox();
        const matrix = el.getCTM();
        const transformedPoint = svgElement.createSVGPoint();
        transformedPoint.x = bbox.x + bbox.width / 2;
        transformedPoint.y = bbox.y + bbox.height / 2;
        const transformedCenter = transformedPoint.matrixTransform(matrix);
        return { x: transformedCenter.x, y: transformedCenter.y };
    },

    getEntityPoint(entity) {
        if (!entity) return null;
        if (typeof entity === 'string') return this.findCoordinates(entity);

        const candidates = [entity, entity.position, entity.coordinates, entity.coords];
        for (const candidate of candidates) {
            if (!candidate) continue;
            const x = candidate.getAttribute?.('data-x') ?? candidate.x ?? candidate.getAttribute?.('x');
            const y = candidate.getAttribute?.('data-y') ?? candidate.y ?? candidate.getAttribute?.('y');
            if (x === null || x === undefined || y === null || y === undefined) continue;
            const point = { x: Number(x), y: Number(y) };
            if (Number.isFinite(point.x) && Number.isFinite(point.y)) return point;
        }

        const positionedElement = entity.querySelector?.('[data-x][data-y]');
        if (positionedElement) {
            const point = {
                x: Number(positionedElement.getAttribute('data-x')),
                y: Number(positionedElement.getAttribute('data-y'))
            };
            if (Number.isFinite(point.x) && Number.isFinite(point.y)) return point;
        }

        if (typeof entity.getBBox === 'function' && typeof entity.getCTM === 'function') {
            try {
                return this.getElementCenter(entity);
            } catch (error) {
                return null;
            }
        }
        return null;
    },

    distancia(entityA, entityB) {
        const pointA = this.getEntityPoint(entityA);
        const pointB = this.getEntityPoint(entityB);
        if (!pointA || !pointB) return null;
        return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) * (CONFIG.distanceScaleFactor ?? 1);
    },
    
    /**
     * Find coordinates of a named element in the SVG
     * @param {string} searchText - Text or ID to find in the SVG
     * @returns {Object|null} - Coordinates {x, y} or null if not found
     */
    findCoordinates(searchText) {
        if (!svgElement) return null;
        
        // First check if element exists with that ID
        if (svgElement.getElementById(searchText)) {
            const el = svgElement.getElementById(searchText);
            return this.getElementCenter(el);
        }
        
        // Otherwise search for text elements containing the search text
        const texts = svgElement.querySelectorAll('text');
        for (const textEl of texts) {
            if (textEl.textContent.includes(searchText)) {
                return this.getElementCenter(textEl);
            }
        }
        
        return null;
    },
    
    /**
     * Generate a smooth SVG path from points
     * @param {Array} points - Array of {x, y} coordinates
     * @returns {string} - SVG path data string
     */
    generateSmoothPath(points) {
        return simplifySvgPath(points);
    },
    
    /**
     * Find the nearest text element to given coordinates
     * @param {Object} location - Coordinates {x, y}
     * @returns {string|null} - Text content of nearest element or null
     */
    findNearestText(location) {
        if (!svgElement || !location) return null;
        
        const texts = svgElement.querySelectorAll('text');
        let closest = null;
        let minDistance = Number.MAX_VALUE;
        
        for (const textEl of texts) {
            const elLocation = this.getElementCenter(textEl);
            const dx = elLocation.x - location.x;
            const dy = elLocation.y - location.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closest = textEl.textContent;
            }
        }
        
        return closest;
    }
};
