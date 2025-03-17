/**
 * Map API Integration
 * Handles map initialization and GIS functionality
 */

// Default map settings
const DEFAULT_CENTER = [37.7749, -122.4194]; // San Francisco
const DEFAULT_ZOOM = 4;

/**
 * Initialize a Leaflet map in the specified container
 * @param {string} containerId - ID of the HTML element to contain the map
 * @param {Array} center - [latitude, longitude] array for map center
 * @param {number} zoom - Initial zoom level
 * @returns {object} Leaflet map object
 */
function initializeMap(containerId = 'map', center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM) {
    // Create map instance
    const map = L.map(containerId).setView(center, zoom);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    return map;
}

/**
 * Add a marker to the map
 * @param {object} map - Leaflet map object
 * @param {Array} position - [latitude, longitude] array
 * @param {string} popupContent - HTML content for popup
 * @returns {object} Leaflet marker object
 */
function addMarker(map, position, popupContent = '') {
    const marker = L.marker(position).addTo(map);
    
    if (popupContent) {
        marker.bindPopup(popupContent);
    }
    
    return marker;
}

/**
 * Create a heatmap layer from data points
 * @param {object} map - Leaflet map object
 * @param {Array} points - Array of [lat, lng, intensity] arrays
 * @param {object} options - Heatmap options
 * @returns {object} Heatmap layer
 */
function createHeatmap(map, points, options = {}) {
    // Check if Leaflet.heat plugin is available
    if (typeof L.heatLayer === 'undefined') {
        console.error('Leaflet.heat plugin is required for heatmaps');
        return null;
    }
    
    // Default options
    const defaultOptions = {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: {0.4: 'blue', 0.65: 'lime', 0.85: 'yellow', 1.0: 'red'}
    };
    
    // Merge options
    const heatmapOptions = {...defaultOptions, ...options};
    
    // Create and add heatmap layer
    const heatLayer = L.heatLayer(points, heatmapOptions).addTo(map);
    
    return heatLayer;
}

/**
 * Add GeoJSON data to the map
 * @param {object} map - Leaflet map object
 * @param {object} geoJson - GeoJSON data
 * @param {object} options - GeoJSON options
 * @returns {object} GeoJSON layer
 */
function addGeoJson(map, geoJson, options = {}) {
    const layer = L.geoJSON(geoJson, options).addTo(map);
    return layer;
}

/**
 * Create a choropleth map from GeoJSON data
 * @param {object} map - Leaflet map object
 * @param {object} geoJson - GeoJSON data
 * @param {function} getColor - Function that returns color based on feature property
 * @param {string} property - Property name to use for coloring
 * @returns {object} GeoJSON layer
 */
function createChoropleth(map, geoJson, getColor, property) {
    const layer = L.geoJSON(geoJson, {
        style: function(feature) {
            return {
                fillColor: getColor(feature.properties[property]),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        },
        onEachFeature: function(feature, layer) {
            if (feature.properties && feature.properties.name) {
                layer.bindPopup(`<b>${feature.properties.name}</b><br>${property}: ${feature.properties[property]}`);
            }
        }
    }).addTo(map);
    
    return layer;
}

/**
 * Add a legend to the map
 * @param {object} map - Leaflet map object
 * @param {Array} grades - Array of threshold values
 * @param {function} getColor - Function that returns color based on value
 * @param {string} title - Legend title
 * @param {string} position - Legend position ('topleft', 'topright', 'bottomleft', 'bottomright')
 * @returns {object} Legend control
 */
function addLegend(map, grades, getColor, title = 'Legend', position = 'bottomright') {
    const legend = L.control({position: position});
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        
        // Add title
        div.innerHTML = `<h4>${title}</h4>`;
        
        // Add legend items
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        
        return div;
    };
    
    legend.addTo(map);
    return legend;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeMap,
        addMarker,
        createHeatmap,
        addGeoJson,
        createChoropleth,
        addLegend
    };
}
