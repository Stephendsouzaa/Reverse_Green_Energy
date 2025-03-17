// Map API Integration for Real-time Renewable Energy Data

// API Keys and Configuration
const OPENWEATHER_API_KEY = 'e086049ce09e1e2225c70492674c4802';
const PVGIS_API_BASE = 'https://re.jrc.ec.europa.eu/api/v5/';
const GLOBAL_WIND_API = 'https://api.openweathermap.org/data/2.5/weather';
const TERRAIN_API = 'https://api.opentopodata.org/v1/srtm90m';
const GRID_API = 'https://maps.nrel.gov/api/developer/ghi';

// Configuration for analysis thresholds
const ANALYSIS_CONFIG = {
    solar: {
        excellent: 6.0,
        good: 4.5,
        fair: 3.0
    },
    wind: {
        excellent: 7.0,
        good: 5.0,
        fair: 3.0
    }
};

// Real-time data fetching configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Real-time data fetching functions
async function getTerrainData(lat, lon, retries = MAX_RETRIES) {
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        throw new Error('Invalid coordinates: Please provide valid latitude and longitude values');
    }

    try {
        const url = `${TERRAIN_API}?locations=${lat},${lon}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Failed to fetch terrain data: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || !data.results || !data.results[0]) {
            throw new Error('Invalid terrain data response');
        }

        const elevation = data.results[0].elevation;
        const slope = await calculateSlope(lat, lon);
        const aspect = await calculateAspect(lat, lon);

        return {
            elevation: elevation,
            slope: slope,
            aspect: aspect,
            soilType: await getSoilData(lat, lon),
            floodRisk: await getFloodRiskData(lat, lon)
        };
    } catch (error) {
        console.error('Error fetching terrain data:', error);
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return getTerrainData(lat, lon, retries - 1);
        }
        throw new Error(`Terrain data error: ${error.message}`);
    }
}

async function getSolarIrradiance(lat, lon, retries = MAX_RETRIES) {
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        throw new Error('Invalid coordinates: Please provide valid latitude and longitude values');
    }

    try {
        const url = `${PVGIS_API_BASE}/seriescalc?lat=${lat}&lon=${lon}&raddatabase=PVGIS-SARAH2&outputformat=json&pvcalculation=1&pvtechchoice=crystSi&mountingplace=free&loss=14&trackingtype=0&startyear=2020&endyear=2020`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
            } else if (response.status === 404) {
                throw new Error('Solar data not available for this location. Please try a different area.');
            } else {
                throw new Error(`Failed to fetch solar data: ${response.status} - ${errorText || response.statusText}`);
            }
        }

        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format: The server returned unexpected data');
        }

        if (!data.outputs?.monthly?.fixed?.length) {
            throw new Error('No solar data available for this location. Please try a different area.');
        }

        return data;
    } catch (error) {
        console.error('Error fetching solar data:', error);
        if (retries > 0) {
            console.log(`Retrying... ${retries} attempts remaining`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getSolarIrradiance(lat, lon, retries - 1);
        }
        throw new Error(`Solar data error: ${error.message}`);
    }
}

async function getWindData(lat, lon, retries = MAX_RETRIES) {
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        throw new Error('Invalid coordinates: Please provide valid latitude and longitude values');
    }

    try {
        const url = `${GLOBAL_WIND_API}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 429) {
                throw new Error('Rate limit exceeded for wind data. Please wait a moment before trying again.');
            } else if (response.status === 401) {
                throw new Error('API key error. Please check your configuration.');
            } else {
                throw new Error(`Failed to fetch wind data: ${response.status} - ${errorText || response.statusText}`);
            }
        }

        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format: The server returned unexpected data');
        }

        if (!data.wind?.speed || !data.wind?.deg) {
            throw new Error('Wind data not available for this location. Please try a different area.');
        }

        return data;
    } catch (error) {
        console.error('Error fetching wind data:', error);
        throw new Error(`Wind data error: ${error.message}`);
    }
}

// Initialize Leaflet Map
let map;
let solarLayer;
let windLayer;
let gridLayer;

// Ensure map container is ready before initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
});

function initializeMap() {
    const mapContainer = document.getElementById('map');
    const errorElement = document.getElementById('error-message');

    if (!mapContainer) {
        console.error('Map container not found');
        if (errorElement) {
            errorElement.textContent = 'Map container not found. Please check the HTML structure.';
            errorElement.classList.remove('hidden');
        }
        return;
    }

    // Set explicit height to ensure visibility
    mapContainer.style.height = '70vh';
    mapContainer.style.width = '100%';
    mapContainer.style.display = 'block';

    try {
        // Initialize the map
        map = L.map('map', {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 18
        });

        // Add OpenStreetMap base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        // Initialize layer groups
        solarLayer = L.layerGroup().addTo(map);
        windLayer = L.layerGroup().addTo(map);
        gridLayer = L.layerGroup().addTo(map);

        // Initialize map controls and event listeners
        initializeMapControls();
        initializeEventListeners();

    } catch (error) {
        console.error('Error initializing map:', error);
        if (errorElement) {
            errorElement.textContent = 'Error initializing map. Please refresh the page.';
            errorElement.classList.remove('hidden');
        }
    }
}

function initializeMapControls() {
    // Add geocoding control
    const geocoder = L.Control.Geocoder.nominatim();
    L.Control.geocoder({
        geocoder: geocoder,
        defaultMarkGeocode: false
    }).on('markgeocode', function(e) {
        const { center, bounds } = e.geocode;
        updateLocationMarker(center.lat, center.lng);
        map.fitBounds(bounds);
    }).addTo(map);

    // Initialize drawing controls
    const drawControl = new L.Control.Draw({
        draw: {
            marker: false,
            circle: false,
            circlemarker: false,
            rectangle: true,
            polygon: true,
            polyline: false
        },
        edit: {
            featureGroup: new L.FeatureGroup().addTo(map)
        }
    }).addTo(map);
}

function initializeEventListeners() {
    // Search button click event
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    // Map click event
    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        try {
            showLoading();
            let solarData, windData;

            try {
                [solarData, windData] = await Promise.all([
                    getSolarIrradiance(lat, lng),
                    getWindData(lat, lng)
                ]);
            } catch (fetchError) {
                // Try fetching data separately if parallel fetch fails
                try {
                    solarData = await getSolarIrradiance(lat, lng);
                } catch (solarError) {
                    console.error('Solar data fetch failed:', solarError);
                }

                try {
                    windData = await getWindData(lat, lng);
                } catch (windError) {
                    console.error('Wind data fetch failed:', windError);
                }

                if (!solarData && !windData) {
                    throw new Error('Unable to fetch renewable energy data for this location.');
                }
            }

            updateLocationMarker(lat, lng);
            displayAnalysisResults(solarData, windData);
            hideLoading();
        } catch (error) {
            hideLoading();
            showError(error.message || 'Error: Unable to fetch data. Please try again later.');
            console.error('Data fetch error:', error);
        }
    });

    // Layer toggle events
    const layerToggles = {
        'solarLayer': solarLayer,
        'windLayer': windLayer,
        'gridLayer': gridLayer
    };

    Object.entries(layerToggles).forEach(([id, layer]) => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    map.addLayer(layer);
                } else {
                    map.removeLayer(layer);
                }
            });
        }
    });

    // Clear map button
    const clearBtn = document.getElementById('clearMap');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearMap);
    }
}

function showLoading() {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function hideLoading() {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.classList.add('hidden');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }
}

function displayAnalysisResults(solarData, windData) {
    const resultsDiv = document.getElementById('analysisResults');
    if (!resultsDiv) return;

    const solarIrradiance = solarData?.outputs?.monthly?.fixed?.[0]?.H_m || 'N/A';
    const windSpeed = windData?.wind?.speed || 'N/A';

    resultsDiv.classList.remove('hidden');
    resultsDiv.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div class="p-4 ${solarIrradiance === 'N/A' ? 'bg-gray-50' : 'bg-yellow-50'} rounded-lg">
                <h3 class="font-bold text-lg mb-2">Solar Potential</h3>
                ${solarIrradiance === 'N/A' ? 
                    `<p class="text-gray-600">Solar data currently unavailable for this location</p>` :
                    `<p>Irradiance: ${solarIrradiance} kWh/m²/day</p>
                     <p class="mt-2 text-sm">${getSolarRating(solarIrradiance)}</p>`
                }
            </div>
            <div class="p-4 ${windSpeed === 'N/A' ? 'bg-gray-50' : 'bg-blue-50'} rounded-lg">
                <h3 class="font-bold text-lg mb-2">Wind Potential</h3>
                ${windSpeed === 'N/A' ? 
                    `<p class="text-gray-600">Wind data currently unavailable for this location</p>` :
                    `<p>Wind Speed: ${windSpeed} m/s</p>
                     <p class="mt-2 text-sm">${getWindRating(windSpeed)}</p>`
                }
            </div>
        </div>
        ${(solarIrradiance === 'N/A' || windSpeed === 'N/A') ? 
            `<p class="mt-4 text-sm text-gray-600 text-center">Some data is unavailable. You may try refreshing or selecting a different location.</p>` : 
            ''}
    `;
}

function getSolarRating(irradiance) {
    if (irradiance === 'N/A') return 'Data not available';
    if (irradiance >= ANALYSIS_CONFIG.solar.excellent) return 'Excellent potential';
    if (irradiance >= ANALYSIS_CONFIG.solar.good) return 'Good potential';
    if (irradiance >= ANALYSIS_CONFIG.solar.fair) return 'Fair potential';
    return 'Limited potential';
}

function getWindRating(windSpeed) {
    if (windSpeed === 'N/A') return 'Data not available';
    if (windSpeed >= ANALYSIS_CONFIG.wind.excellent) return 'Excellent potential';
    if (windSpeed >= ANALYSIS_CONFIG.wind.good) return 'Good potential';
    if (windSpeed >= ANALYSIS_CONFIG.wind.fair) return 'Fair potential';
    return 'Limited potential';
}

function clearMap() {
    const markers = document.querySelectorAll('.leaflet-marker-icon');
    markers.forEach(marker => marker.remove());

    const resultsDiv = document.getElementById('analysisResults');
    if (resultsDiv) {
        resultsDiv.classList.add('hidden');
    }

    const latInput = document.getElementById('latInput');
    const lngInput = document.getElementById('lngInput');
    if (latInput) latInput.value = '';
    if (lngInput) lngInput.value = '';
}

async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-message');

    if (!searchInput || !searchInput.value.trim()) {
        if (errorElement) {
            errorElement.textContent = 'Please enter a location to search';
            errorElement.classList.remove('hidden');
        }
        return;
    }

    try {
        loadingElement?.classList.remove('hidden');
        const geocoder = L.Control.Geocoder.nominatim();
        
        geocoder.geocode(searchInput.value, (results) => {
            if (results && results.length > 0) {
                const { lat, lng } = results[0].center;
                updateLocationMarker(lat, lng);
                map.setView([lat, lng], 10);
            } else {
                if (errorElement) {
                    errorElement.textContent = 'Location not found. Please try a different search term.';
                    errorElement.classList.remove('hidden');
                }
            }
            loadingElement?.classList.add('hidden');
        });
    } catch (error) {
        console.error('Error during geocoding:', error);
        if (errorElement) {
            errorElement.textContent = 'Error searching location. Please try again.';
            errorElement.classList.remove('hidden');
        }
        loadingElement?.classList.add('hidden');
    }
}

function updateLocationMarker(lat, lng) {
    // Update input fields
    const latInput = document.getElementById('latInput');
    const lngInput = document.getElementById('lngInput');

    if (latInput && lngInput) {
        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);
    }

    // Clear existing markers
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // Add new marker
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup('Selected Location').openPopup();

    // Update map layers
    updateMapLayers(lat, lng);
}

function handleDrawCreated(e) {
    const layer = e.layer;
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    
    layer.addTo(map);
    updateLocationMarker(center.lat, center.lng);
}

function clearMap() {
    solarLayer.clearLayers();
    windLayer.clearLayers();
    gridLayer.clearLayers();

    // Clear markers
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // Reset form inputs
    const inputs = ['latInput', 'lngInput', 'searchInput'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });

    // Hide analysis results
    const analysisResults = document.getElementById('analysisResults');
    if (analysisResults) {
        analysisResults.classList.add('hidden');
    }
}

// Update map layers with real-time data
async function updateMapLayers(lat, lon) {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-message');
    
    try {
        if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
            throw new Error('Invalid coordinates provided');
        }

        loadingElement?.classList.remove('hidden');
        errorElement?.classList.add('hidden');
        
        // Clear existing layers
        solarLayer.clearLayers();
        windLayer.clearLayers();
        
        // Fetch real-time data with retries
        let solarData, windData;
        try {
            [solarData, windData] = await Promise.all([
                getSolarIrradiance(lat, lon),
                getWindData(lat, lon)
            ]);
        } catch (fetchError) {
            console.error('Error fetching data:', fetchError);
            // Try fetching solar data separately with retries
            try {
                solarData = await getSolarIrradiance(lat, lon, MAX_RETRIES);
            } catch (solarError) {
                console.error('Solar data fetch failed after retries:', solarError);
                throw new Error('Unable to fetch solar data. Please try again later.');
            }
            // Try fetching wind data
            try {
                windData = await getWindData(lat, lon);
            } catch (windError) {
                console.error('Wind data fetch failed:', windError);
            }
        }
        
        // Validate and update solar layer
        if (solarData?.outputs?.monthly?.fixed?.[0]?.H_m > 0) {
            const solarMarker = L.circle([lat, lon], {
                color: 'yellow',
                fillColor: '#ff7800',
                fillOpacity: 0.5,
                radius: Math.min(solarData.outputs.monthly.fixed[0].H_m * 100, 50000)
            }).addTo(solarLayer);
            
            solarMarker.bindPopup(`Solar Irradiance: ${solarData.outputs.monthly.fixed[0].H_m.toFixed(2)} kWh/m²`);
        } else {
            console.warn('Invalid or missing solar data values');
        }
        
        // Update wind layer if data is available
        if (windData?.wind?.speed > 0) {
            const windMarker = L.circle([lat, lon], {
                color: 'blue',
                fillColor: '#0078ff',
                fillOpacity: 0.5,
                radius: Math.min(windData.wind.speed * 1000, 30000)
            }).addTo(windLayer);
            
            windMarker.bindPopup(`Wind Speed: ${windData.wind.speed.toFixed(1)} m/s`);
        }
        
        // Update analysis results if we have valid data
        if (solarData || windData) {
            updateAnalysisResults(solarData, windData);
        }
        
    } catch (error) {
        console.error('Error updating map layers:', error);
        if (errorElement) {
            errorElement.textContent = `Error: ${error.message}`;
            errorElement.classList.remove('hidden');
            // Hide error message after 5 seconds
            setTimeout(() => {
                errorElement.classList.add('hidden');
            }, 5000);
        }
    } finally {
        loadingElement?.classList.add('hidden');
    }
}

// Helper functions for analysis
function calculateSuitabilityScore(value, thresholds) {
    if (value >= thresholds.excellent) return 'Excellent';
    if (value >= thresholds.good) return 'Good';
    if (value >= thresholds.fair) return 'Fair';
    return 'Poor';
}

function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

function calculateWindPowerDensity(windSpeed) {
    const airDensity = 1.225; // kg/m³ at sea level, 15°C
    return 0.5 * airDensity * Math.pow(windSpeed, 3);
}

async function getTerrainData(lat, lon, retries = MAX_RETRIES) {
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        throw new Error('Invalid coordinates: Please provide valid latitude and longitude values');
    }

    try {
        const url = `${TERRAIN_API}?locations=${lat},${lon}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Failed to fetch terrain data: ${response.status}`);
        }

        const data = await response.json();
        return {
            elevation: data.results[0].elevation,
            slope: await calculateSlope(lat, lon),
            aspect: await calculateAspect(lat, lon)
        };
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return getTerrainData(lat, lon, retries - 1);
        }
        throw new Error(`Terrain data error: ${error.message}`);
    }
}

async function calculateSlope(lat, lon) {
    const resolution = 0.0008333333333333; // Approximately 90m at equator
    const points = [
        [lat, lon],
        [lat + resolution, lon],
        [lat - resolution, lon],
        [lat, lon + resolution],
        [lat, lon - resolution]
    ];

    const elevations = await Promise.all(points.map(async ([lat, lon]) => {
        const data = await getTerrainData(lat, lon, 1);
        return data.elevation;
    }));

    const dz_dx = (elevations[3] - elevations[4]) / (2 * resolution);
    const dz_dy = (elevations[1] - elevations[2]) / (2 * resolution);
    
    return Math.atan(Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy)) * (180 / Math.PI);
}

async function calculateAspect(lat, lon) {
    const resolution = 0.0008333333333333;
    const points = [
        [lat, lon + resolution],
        [lat, lon - resolution],
        [lat + resolution, lon],
        [lat - resolution, lon]
    ];

    const elevations = await Promise.all(points.map(async ([lat, lon]) => {
        const data = await getTerrainData(lat, lon, 1);
        return data.elevation;
    }));

    const dz_dx = (elevations[0] - elevations[1]) / (2 * resolution);
    const dz_dy = (elevations[2] - elevations[3]) / (2 * resolution);
    
    let aspect = Math.atan2(dz_dy, -dz_dx) * (180 / Math.PI);
    if (aspect < 0) aspect += 360;
    
    return aspect;
}

function assessTerrainSuitability(elevation, slope) {
    if (slope > 30) return 'Not Suitable';
    if (slope > 15) return 'Marginally Suitable';
    if (elevation > 2000) return 'Challenging';
    return 'Suitable';
}

function addSuitabilityIndicators(solarScore, windScore) {
    const indicators = document.createElement('div');
    indicators.className = 'mt-4 flex justify-center gap-4';
    indicators.innerHTML = `
        <div class="p-2 rounded ${getSuitabilityColor(solarScore)}">
            <span class="font-bold">Solar Suitability:</span> ${solarScore}
        </div>
        <div class="p-2 rounded ${getSuitabilityColor(windScore)}">
            <span class="font-bold">Wind Suitability:</span> ${windScore}
        </div>
    `;
    document.getElementById('analysisResults').appendChild(indicators);
}

function getSuitabilityColor(score) {
    switch (score) {
        case 'Excellent': return 'bg-green-200';
        case 'Good': return 'bg-blue-200';
        case 'Fair': return 'bg-yellow-200';
        default: return 'bg-red-200';
    }
}

// Update analysis results panel
async function updateAnalysisResults(solarData, windData) {
    const analysisResults = document.getElementById('analysisResults');
    const solarAnalysis = document.getElementById('solarAnalysis');
    const windAnalysis = document.getElementById('windAnalysis');
    const terrainAnalysis = document.getElementById('terrainAnalysis');

    if (!analysisResults || !solarAnalysis || !windAnalysis || !terrainAnalysis) {
        console.error('Analysis results elements not found');
        return;
    }

    try {
        // Check if we have valid data
        if (!solarData?.outputs?.monthly?.fixed || !windData?.wind) {
            throw new Error('Invalid or missing data');
        }

        const monthlyData = solarData.outputs.monthly.fixed[0];
        const slope = solarData.inputs?.mounting_system?.fixed?.slope || 'N/A';
        
        // Get terrain data
        const terrainData = await getTerrainData(windData.coord.lat, windData.coord.lon);
        
        // Calculate suitability scores
        const solarScore = calculateSuitabilityScore(monthlyData.H_m, ANALYSIS_CONFIG.solar);
        const windScore = calculateSuitabilityScore(windData.wind.speed, ANALYSIS_CONFIG.wind);
        
        // Update solar analysis with enhanced metrics
        solarAnalysis.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow-md">
                <h3 class="font-bold mb-2 text-lg text-green-700">Solar Potential</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="font-semibold">Daily Irradiance:</p>
                        <p class="text-lg">${monthlyData ? monthlyData.H_m.toFixed(2) : 'N/A'} kWh/m²</p>
                        <p class="text-sm text-gray-600">Suitability: ${solarScore}</p>
                    </div>
                    <div>
                        <p class="font-semibold">Optimal Setup:</p>
                        <p>Panel Angle: ${slope}°</p>
                        <p>Efficiency: ${(monthlyData.H_m / 8.0 * 100).toFixed(1)}%</p>
                    </div>
                </div>
                <div class="mt-2">
                    <p class="font-semibold">Annual Potential:</p>
                    <p>${(monthlyData.H_m * 365).toFixed(0)} kWh/m²/year</p>
                </div>
            </div>
        `;
        
        // Update wind analysis with detailed metrics
        windAnalysis.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow-md mt-4">
                <h3 class="font-bold mb-2 text-lg text-blue-700">Wind Conditions</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="font-semibold">Current Speed:</p>
                        <p class="text-lg">${windData.wind.speed.toFixed(1)} m/s</p>
                        <p class="text-sm text-gray-600">Suitability: ${windScore}</p>
                    </div>
                    <div>
                        <p class="font-semibold">Wind Direction:</p>
                        <p>${windData.wind.deg.toFixed(0)}° ${getWindDirection(windData.wind.deg)}</p>
                        <p>Gusts: ${windData.wind.gust ? windData.wind.gust.toFixed(1) : 'N/A'} m/s</p>
                    </div>
                </div>
                <div class="mt-2">
                    <p class="font-semibold">Power Density:</p>
                    <p>${calculateWindPowerDensity(windData.wind.speed).toFixed(0)} W/m²</p>
                </div>
            </div>
        `;

        // Add terrain analysis
        terrainAnalysis.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow-md mt-4">
                <h3 class="font-bold mb-2 text-lg text-purple-700">Terrain Analysis</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="font-semibold">Elevation:</p>
                        <p>${terrainData.elevation.toFixed(0)} meters</p>
                    </div>
                    <div>
                        <p class="font-semibold">Slope Grade:</p>
                        <p>${calculateSlopeGrade(terrainData.elevation).toFixed(1)}%</p>
                    </div>
                </div>
                <div class="mt-2">
                    <p class="font-semibold">Land Suitability:</p>
                    <p>${assessTerrainSuitability(terrainData.elevation, calculateSlopeGrade(terrainData.elevation))}</p>
                </div>
            </div>
        `;
        
        // Show the analysis results
        analysisResults.classList.remove('hidden');
        
        // Add visual indicators
        addSuitabilityIndicators(solarScore, windScore);
        
    } catch (error) {
        console.error('Error updating analysis results:', error);
        analysisResults.classList.add('hidden');
        
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = `Error displaying analysis results: ${error.message}`;
            errorElement.classList.remove('hidden');
            setTimeout(() => errorElement.classList.add('hidden'), 5000);
        }
    }
}

// Event Listeners
document.getElementById('searchBtn').addEventListener('click', async () => {
    const searchInput = document.getElementById('searchInput').value;
    const geocoder = L.Control.Geocoder.nominatim();
    
    try {
        document.getElementById('loading').classList.remove('hidden');
        geocoder.geocode(searchInput, (results) => {
            if (results && results.length > 0) {
                const { lat, lng } = results[0].center;
                document.getElementById('latInput').value = lat.toFixed(6);
                document.getElementById('lngInput').value = lng.toFixed(6);
                
                map.setView([lat, lng], 10);
                updateMapLayers(lat, lng);
                
                // Add a marker for the searched location
                L.marker([lat, lng]).addTo(map)
                    .bindPopup('Selected Location')
                    .openPopup();
            } else {
                alert('Location not found. Please try a different search term.');
            }
            document.getElementById('loading').classList.add('hidden');
        });
    } catch (error) {
        console.error('Error during geocoding:', error);
        alert('Error searching location. Please try again.');
        document.getElementById('loading').classList.add('hidden');
    }
});

// Add map click event handler
map.on('click', async (e) => {
    const { lat, lng } = e.latlng;
    
    // Update input fields
    document.getElementById('latInput').value = lat.toFixed(6);
    document.getElementById('lngInput').value = lng.toFixed(6);
    
    // Clear existing markers and add new one
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup('Selected Location').openPopup();
    
    try {
        // Show loading indicator
        document.getElementById('loading')?.classList.remove('hidden');
        
        // Update map layers with new location data
        await updateMapLayers(lat, lng);
        
        // Ensure the popup stays open after data is loaded
        marker.openPopup();
    } catch (error) {
        console.error('Error updating location data:', error);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = `Error: ${error.message}`;
            errorElement.classList.remove('hidden');
            setTimeout(() => errorElement.classList.add('hidden'), 5000);
        }
    } finally {
        document.getElementById('loading')?.classList.add('hidden');
    }
});

// Add geocoding control to the map
L.Control.geocoder({
    defaultMarkGeocode: false
}).on('markgeocode', function(e) {
    const { lat, lng } = e.geocode.center;
    
    // Update input fields
    document.getElementById('latInput').value = lat.toFixed(6);
    document.getElementById('lngInput').value = lng.toFixed(6);
    
    map.setView([lat, lng], 10);
    updateMapLayers(lat, lng);
}).addTo(map);

// Layer toggle events
document.getElementById('solarLayer').addEventListener('change', (e) => {
    if (e.target.checked) {
        map.addLayer(solarLayer);
    } else {
        map.removeLayer(solarLayer);
    }
});

document.getElementById('windLayer').addEventListener('change', (e) => {
    if (e.target.checked) {
        map.addLayer(windLayer);
    } else {
        map.removeLayer(windLayer);
    }
});

document.getElementById('gridLayer').addEventListener('change', (e) => {
    if (e.target.checked) {
        map.addLayer(gridLayer);
    } else {
        map.removeLayer(gridLayer);
    }
});

// Initialize drawing controls
const drawControl = new L.Control.Draw({
    draw: {
        marker: false,
        circle: false,
        circlemarker: false,
        rectangle: true,
        polygon: true,
        polyline: false
    }
}).addTo(map);

// Handle drawn shapes
map.on('draw:created', (e) => {
    const layer = e.layer;
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    
    updateMapLayers(center.lat, center.lng);
    layer.addTo(map);
});

// Clear map button
document.getElementById('clearMap').addEventListener('click', () => {
    solarLayer.clearLayers();
    windLayer.clearLayers();
    gridLayer.clearLayers();
    document.getElementById('analysisResults').classList.add('hidden');
    document.getElementById('latInput').value = '';
    document.getElementById('lngInput').value = '';
    document.getElementById('searchInput').value = '';
});