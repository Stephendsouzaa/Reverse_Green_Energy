/**
 * GIS Mapping Module
 * Handles GIS mapping and visualization functionality
 */

/**
 * Initialize the main map with base layers
 * @param {string} containerId - ID of the HTML element to contain the map
 * @param {Array} center - [latitude, longitude] array for map center
 * @param {number} zoom - Initial zoom level
 * @returns {object} Leaflet map object and layer control
 */
function initializeMap(containerId = 'map', center = [37.7749, -122.4194], zoom = 4) {
    // Create map instance
    const map = L.map(containerId).setView(center, zoom);
    
    // Define base maps
    const baseMaps = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }),
        "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
        }),
        "Terrain": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
            maxZoom: 19
        })
    };
    
    // Add default base map
    baseMaps["OpenStreetMap"].addTo(map);
    
    // Create overlay layers object for layer control
    const overlayMaps = {};
    
    // Add layer control
    const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
    
    // Add scale control
    L.control.scale().addTo(map);
    
    // Return map and layer control for further use
    return {
        map: map,
        layerControl: layerControl,
        overlayMaps: overlayMaps
    };
}

/**
 * Plot sites on the map with customizable markers
 * @param {object} map - Leaflet map object
 * @param {Array} sites - Array of site objects with lat, lon, and other properties
 * @param {object} options - Options for marker display
 * @returns {object} Layer group containing all markers
 */
function plotSitesOnMap(map, sites, options = {}) {
    const {
        markerColor = 'blue',
        markerSize = 10,
        clustered = true,
        popupTemplate = site => `<b>${site.name || 'Site'}</b><br>Coordinates: ${site.lat}, ${site.lon}`
    } = options;
    
    // Create marker layer group or cluster group
    const markers = clustered ? L.markerClusterGroup() : L.layerGroup();
    
    // Add markers for each site
    sites.forEach(site => {
        // Create marker
        const marker = L.circleMarker([site.lat, site.lon], {
            radius: markerSize,
            fillColor: typeof markerColor === 'function' ? markerColor(site) : markerColor,
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
        
        // Add popup
        marker.bindPopup(popupTemplate(site));
        
        // Add tooltip if site has a name
        if (site.name) {
            marker.bindTooltip(site.name);
        }
        
        // Add marker to layer group
        markers.addLayer(marker);
    });
    
    // Add markers to map
    markers.addTo(map);
    
    return markers;
}

/**
 * Create a heatmap layer from data points
 * @param {object} map - Leaflet map object
 * @param {Array} points - Array of [lat, lng, intensity] arrays or objects with lat, lng, intensity properties
 * @param {object} options - Heatmap options
 * @returns {object} Heatmap layer
 */
function createHeatmap(map, points, options = {}) {
    // Check if Leaflet.heat plugin is available
    if (typeof L.heatLayer === 'undefined') {
        console.error('Leaflet.heat plugin is required for heatmaps. Please include leaflet-heat.js');
        return null;
    }
    
    // Process points to ensure they're in the format [lat, lng, intensity]
    const processedPoints = points.map(point => {
        if (Array.isArray(point)) {
            return point;
        } else {
            return [
                point.lat || point.latitude,
                point.lng || point.lon || point.longitude,
                point.intensity || point.value || 1
            ];
        }
    });
    
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
    const heatLayer = L.heatLayer(processedPoints, heatmapOptions).addTo(map);
    
    return heatLayer;
}

/**
 * Create a choropleth map from GeoJSON data
 * @param {object} map - Leaflet map object
 * @param {object} geoJson - GeoJSON data
 * @param {function} getColor - Function that returns color based on feature property
 * @param {string} property - Property name to use for coloring
 * @param {object} options - Additional options
 * @returns {object} GeoJSON layer
 */
function createChoropleth(map, geoJson, getColor, property, options = {}) {
    const {
        fillOpacity = 0.7,
        weight = 2,
        opacity = 1,
        dashArray = '3',
        popupTemplate = feature => `<b>${feature.properties.name || 'Area'}</b><br>${property}: ${feature.properties[property]}`
    } = options;
    
    const layer = L.geoJSON(geoJson, {
        style: function(feature) {
            return {
                fillColor: getColor(feature.properties[property]),
                weight: weight,
                opacity: opacity,
                color: 'white',
                dashArray: dashArray,
                fillOpacity: fillOpacity
            };
        },
        onEachFeature: function(feature, layer) {
            if (feature.properties) {
                layer.bindPopup(popupTemplate(feature));
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

/**
 * Create a solar potential heatmap
 * @param {object} map - Leaflet map object
 * @param {object} layerControl - Layer control to add the heatmap to
 * @param {Array} bounds - [[south, west], [north, east]] bounds for the heatmap
 * @param {number} resolution - Resolution of the heatmap grid (higher = more points)
 * @returns {object} Heatmap layer
 */
function createSolarPotentialHeatmap(map, layerControl, bounds, resolution = 20) {
    // Generate grid points within bounds
    const points = [];
    const [[south, west], [north, east]] = bounds;
    
    const latStep = (north - south) / resolution;
    const lngStep = (east - west) / resolution;
    
    for (let lat = south; lat <= north; lat += latStep) {
        for (let lng = west; lng <= east; lng += lngStep) {
            // Calculate solar potential based on latitude (simplified model)
            const absLat = Math.abs(lat);
            
            // Base value based on latitude
            let value;
            if (absLat < 23.5) { // Tropical
                value = 0.9; // High potential
            } else if (absLat < 45) { // Temperate
                value = 0.7; // Moderate potential
            } else { // Polar
                value = 0.4; // Lower potential
            }
            
            // Add some randomness to simulate local variations
            const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
            value *= randomFactor;
            
            // Clamp value between 0 and 1
            value = Math.max(0, Math.min(1, value));
            
            points.push([lat, lng, value]);
        }
    }
    
    // Create heatmap
    const heatmap = createHeatmap(map, points, {
        radius: 15,
        blur: 10,
        gradient: {0.4: 'blue', 0.65: 'lime', 0.85: 'yellow', 1.0: 'red'},
        maxZoom: 10
    });
    
    // Add to layer control if provided
    if (layerControl) {
        layerControl.addOverlay(heatmap, "Solar Potential");
    }
    
    return heatmap;
}

/**
 * Create a wind potential heatmap
 * @param {object} map - Leaflet map object
 * @param {object} layerControl - Layer control to add the heatmap to
 * @param {Array} bounds - [[south, west], [north, east]] bounds for the heatmap
 * @param {number} resolution - Resolution of the heatmap grid (higher = more points)
 * @returns {object} Heatmap layer
 */
function createWindPotentialHeatmap(map, layerControl, bounds, resolution = 20) {
    // Generate grid points within bounds
    const points = [];
    const [[south, west], [north, east]] = bounds;
    
    const latStep = (north - south) / resolution;
    const lngStep = (east - west) / resolution;
    
    for (let lat = south; lat <= north; lat += latStep) {
        for (let lng = west; lng <= east; lng += lngStep) {
            // Calculate wind potential based on latitude (simplified model)
            const absLat = Math.abs(lat);
            
            // Base value based on latitude
            let value;
            if (absLat < 15) { // Equatorial
                value = 0.3; // Low potential
            } else if (absLat < 30) { // Tropical
                value = 0.5; // Moderate-low potential
            } else if (absLat < 45) { // Temperate
                value = 0.7; // Moderate potential
            } else if (absLat < 60) { // Subpolar
                value = 0.9; // High potential
            } else { // Polar
                value = 0.8; // Moderate-high potential
            }
            
            // Add some randomness to simulate local variations
            const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
            value *= randomFactor;
            
            // Clamp value between 0 and 1
            value = Math.max(0, Math.min(1, value));
            
            points.push([lat, lng, value]);
        }
    }
    
    // Create heatmap
    const heatmap = createHeatmap(map, points, {
        radius: 15,
        blur: 10,
        gradient: {0.4: 'purple', 0.6: 'blue', 0.8: 'green', 1.0: 'yellow'},
        maxZoom: 10
    });
    
    // Add to layer control if provided
    if (layerControl) {
        layerControl.addOverlay(heatmap, "Wind Potential");
    }
    
    return heatmap;
}

/**
 * Create a combined renewable energy potential heatmap
 * @param {object} map - Leaflet map object
 * @param {object} layerControl - Layer control to add the heatmap to
 * @param {Array} bounds - [[south, west], [north, east]] bounds for the heatmap
 * @param {number} resolution - Resolution of the heatmap grid (higher = more points)
 * @returns {object} Heatmap layer
 */
function createCombinedPotentialHeatmap(map, layerControl, bounds, resolution = 20) {
    // Generate grid points within bounds
    const points = [];
    const [[south, west], [north, east]] = bounds;
    
    const latStep = (north - south) / resolution;
    const lngStep = (east - west) / resolution;
    
    for (let lat = south; lat <= north; lat += latStep) {
        for (let lng = west; lng <= east; lng += lngStep) {
            // Calculate solar potential based on latitude
            const absLat = Math.abs(lat);
            
            // Solar potential
            let solarValue;
            if (absLat < 23.5) { // Tropical
                solarValue = 0.9; // High potential
            } else if (absLat < 45) { // Temperate
                solarValue = 0.7; // Moderate potential
            } else { // Polar
                solarValue = 0.4; // Lower potential
            }
            
            // Wind potential
            let windValue;
            if (absLat < 15) { // Equatorial
                windValue = 0.3; // Low potential
            } else if (absLat < 30) { // Tropical
                windValue = 0.5; // Moderate-low potential
            } else if (absLat < 45) { // Temperate
                windValue = 0.7; // Moderate potential
            } else if (absLat < 60) { // Subpolar
                windValue = 0.9; // High potential
            } else { // Polar
                windValue = 0.8; // Moderate-high potential
            }
            
            // Combined value (weighted average)
            const combinedValue = (solarValue * 0.6) + (windValue * 0.4);
            
            // Add some randomness to simulate local variations
            const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
            const value = combinedValue * randomFactor;
            
            // Clamp value between 0 and 1
            const clampedValue = Math.max(0, Math.min(1, value));
            
            points.push([lat, lng, clampedValue]);
        }
    }
    
    // Create heatmap
    const heatmap = createHeatmap(map, points, {
        radius: 15,
        blur: 10,
        gradient: {0.4: 'blue', 0.6: 'green', 0.8: 'yellow', 1.0: 'red'},
        maxZoom: 10
    });
    
    // Add to layer control if provided
    if (layerControl) {
        layerControl.addOverlay(heatmap, "Combined Renewable Potential");
    }
    
    return heatmap;
}

/**
 * Create a land suitability heatmap
 * @param {object} map - Leaflet map object
 * @param {object} layerControl - Layer control to add the heatmap to
 * @param {Array} bounds - [[south, west], [north, east]] bounds for the heatmap
 * @param {number} resolution - Resolution of the heatmap grid (higher = more points)
 * @returns {object} Heatmap layer
 */
function createLandSuitabilityHeatmap(map, layerControl, bounds, resolution = 20) {
    // Generate grid points within bounds
    const points = [];
    const [[south, west], [north, east]] = bounds;
    
    const latStep = (north - south) / resolution;
    const lngStep = (east - west) / resolution;
    
    for (let lat = south; lat <= north; lat += latStep) {
        for (let lng = west; lng <= east; lng += lngStep) {
            // Simplified land suitability model
            // In a real application, this would use actual land use data
            
            // Base value (random for demonstration)
            const baseValue = 0.3 + (Math.random() * 0.7); // 0.3 to 1.0
            
            // Simulate some patterns (e.g., higher values away from coasts)
            const distanceFromEquator = Math.abs(lat) / 90;
            const equatorFactor = 1 - (distanceFromEquator * 0.3); // Slight preference for areas closer to equator
            
            const value = baseValue * equatorFactor;
            
            // Clamp value between 0 and 1
            const clampedValue = Math.max(0, Math.min(1, value));
            
            points.push([lat, lng, clampedValue]);
        }
    }
    
    // Create heatmap
    const heatmap = createHeatmap(map, points, {
        radius: 15,
        blur: 10,
        gradient: {0.4: 'red', 0.6: 'orange', 0.8: 'yellow', 1.0: 'green'},
        maxZoom: 10
    });
    
    // Add to layer control if provided
    if (layerControl) {
        layerControl.addOverlay(heatmap, "Land Suitability");
    }
    
    return heatmap;
}

/**
 * Add a drawing control to the map for custom area selection
 * @param {object} map - Leaflet map object
 * @param {function} onDrawCallback - Callback function when a shape is drawn
 * @returns {object} Draw control
 */
function addDrawingControl(map, onDrawCallback) {
    // Check if Leaflet.draw plugin is available
    if (typeof L.Control.Draw === 'undefined') {
        console.error('Leaflet.draw plugin is required for drawing. Please include leaflet.draw.js');
        return null;
    }
    
    // Create feature group to store drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    // Define draw control options
    const drawControlOptions = {
        position: 'topright',
        draw: {
            polyline: false,
            circle: false,
            circlemarker: false,
            marker: {
                icon: new L.Icon.Default()
            },
            polygon: {
                allowIntersection: false,
                drawError: {
                    color: '#e1e100',
                    message: '<strong>Error:</strong> Shape edges cannot cross!'
                },
                shapeOptions: {
                    color: '#3388ff'
                }
            },
            rectangle: {
                shapeOptions: {
                    color: '#3388ff'
                }
            }
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    };
    
    // Create draw control
    const drawControl = new L.Control.Draw(drawControlOptions);
    map.addControl(drawControl);
    
    // Handle draw events
    map.on(L.Draw.Event.CREATED, function(event) {
        const layer = event.layer;
        drawnItems.addLayer(layer);
        
        // Get shape data
        const shape = layer.toGeoJSON();
        
        // Call callback if provided
        if (typeof onDrawCallback === 'function') {
            onDrawCallback(shape, layer);
        }
    });
    
    // Handle edit events
    map.on(L.Draw.Event.EDITED, function(event) {
        const layers = event.layers;
        layers.eachLayer(function(layer) {
            // Get updated shape data
            const shape = layer.toGeoJSON();
            
            // Call callback if provided
            if (typeof onDrawCallback === 'function') {
                onDrawCallback(shape, layer);
            }
        });
    });
    
    return {
        control: drawControl,
        featureGroup: drawnItems
    };
}

/**
 * Add a measurement control to the map
 * @param {object} map - Leaflet map object
 * @returns {object} Measurement control
 */
function addMeasurementControl(map) {
    // Check if Leaflet.measure plugin is available
    if (typeof L.control.measure === 'undefined') {
        console.error('Leaflet.measure plugin is required for measurement. Please include leaflet.measure.js');
        return null;
    }
    
    // Create measurement control
    const measureControl = L.control.measure({
        position: 'topright',
        primaryLengthUnit: 'kilometers',
        secondaryLengthUnit: 'miles',
        primaryAreaUnit: 'sqkilometers',
        secondaryAreaUnit: 'acres'
    });
    
    // Add to map
    measureControl.addTo(map);
    
    return measureControl;
}

/**
 * Add a geocoding control to the map
 * @param {object} map - Leaflet map object
 * @returns {object} Geocoding control
 */
function addGeocodingControl(map) {
    // Check if Leaflet.Control.Geocoder plugin is available
    if (typeof L.Control.Geocoder === 'undefined') {
        console.error('Leaflet.Control.Geocoder plugin is required for geocoding. Please include Control.Geocoder.js');
        return null;
    }
    
    // Create geocoding control
    const geocoder = L.Control.geocoder({
        defaultMarkGeocode: false
    }).addTo(map);
    
    // Handle geocoding results
    geocoder.on('markgeocode', function(event) {
        const result = event.geocode;
        const latlng = result.center;
        
        // Create marker
        L.marker(latlng)
            .addTo(map)
            .bindPopup(result.name)
            .openPopup();
        
        // Zoom to location
        map.fitBounds(result.bbox);
    });
    
    return geocoder;
}

/**
 * Export map as image
 * @param {object} map - Leaflet map object
 * @returns {string} Data URL of the map image
 */
function exportMapAsImage(map) {
    // Check if html2canvas is available
    if (typeof html2canvas === 'undefined') {
        console.error('html2canvas is required for exporting maps. Please include html2canvas.js');
        return null;
    }
    
    // Get map container
    const mapContainer = map.getContainer();
    
    // Use html2canvas to create image
    return html2canvas(mapContainer).then(function(canvas) {
        return canvas.toDataURL('image/png');
    });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeMap,
        plotSitesOnMap,
        createHeatmap,
        createChoropleth,
        addLegend,
        createSolarPotentialHeatmap,
        createWindPotentialHeatmap,
        createCombinedPotentialHeatmap,
        createLandSuitabilityHeatmap,
        addDrawingControl,
        addMeasurementControl,
        addGeocodingControl,
        exportMapAsImage
    };
}
