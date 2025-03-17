// Initialize map and analysis functionality
let map;
let drawnItems;
let selectedLocation = null;

// Initialize the map
function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize drawing controls
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
        draw: {
            polygon: true,
            marker: true,
            circle: false,
            rectangle: true,
            polyline: false,
            circlemarker: false
        },
        edit: {
            featureGroup: drawnItems
        }
    });
    map.addControl(drawControl);

    // Add layer controls
    const overlayMaps = {
        'Solar Potential': createSolarLayer(),
        'Wind Potential': createWindLayer(),
        'Power Grid': createPowerGridLayer()
    };
    L.control.layers(null, overlayMaps).addTo(map);

    // Event handlers
    map.on('draw:created', handleAreaDrawn);
    map.on('click', handleMapClick);
}

// Create layer for solar potential visualization
function createSolarLayer() {
    return L.tileLayer('https://tiles.globalwindatlas.info/api/solar/ghi/{z}/{x}/{y}.png', {
        opacity: 0.7,
        attribution: '© Global Solar Atlas'
    });
}

// Create layer for wind potential visualization
function createWindLayer() {
    return L.tileLayer('https://tiles.globalwindatlas.info/api/wind/power-density/{z}/{x}/{y}.png', {
        opacity: 0.7,
        attribution: '© Global Wind Atlas'
    });
}

// Create layer for power grid infrastructure
function createPowerGridLayer() {
    return L.tileLayer('https://tiles.gridfinder.org/v1/{z}/{x}/{y}.png', {
        opacity: 0.7,
        attribution: '© GridFinder'
    });
}

// Handle map click events
async function handleMapClick(e) {
    selectedLocation = e.latlng;
    await updateAnalysisPanel(selectedLocation);
}

// Handle drawn area events
async function handleAreaDrawn(e) {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    await analyzeArea(e.layer);
}

// Calculate overall site score based on solar, wind, and terrain data
function calculateSiteScore(solarData, windData, terrainData) {
    const solarScore = calculateSolarScore(solarData);
    const windScore = calculateWindScore(windData);
    const terrainScore = calculateTerrainScore(terrainData);
    
    return (solarScore + windScore + terrainScore) / 3;
}

// Calculate solar potential score (0-100)
function calculateSolarScore(solarData) {
    const dailyIrradiance = solarData.outputs.monthly.fixed[0].H_day;
    if (dailyIrradiance >= 6.0) return 100;
    if (dailyIrradiance >= 4.5) return 75;
    if (dailyIrradiance >= 3.0) return 50;
    return 25;
}

// Calculate wind potential score (0-100)
function calculateWindScore(windData) {
    const windSpeed = windData.wind.speed;
    if (windSpeed >= 7.0) return 100;
    if (windSpeed >= 5.0) return 75;
    if (windSpeed >= 3.0) return 50;
    return 25;
}

// Calculate terrain suitability score (0-100)
function calculateTerrainScore(terrainData) {
    const slopeScore = calculateSlopeScore(terrainData.slope);
    const elevationScore = calculateElevationScore(terrainData.elevation);
    return (slopeScore + elevationScore) / 2;
}

// Calculate slope score (0-100)
function calculateSlopeScore(slope) {
    if (slope <= 5) return 100;
    if (slope <= 10) return 75;
    if (slope <= 15) return 50;
    return 25;
}

// Calculate elevation score (0-100)
function calculateElevationScore(elevation) {
    if (elevation >= 0 && elevation <= 2000) return 100;
    if (elevation > 2000 && elevation <= 3000) return 75;
    if (elevation > 3000 && elevation <= 4000) return 50;
    return 25;
}

// Update analysis panel with location data
async function updateAnalysisPanel(location) {
    const analysisPanel = document.getElementById('analysis-panel');
    if (!analysisPanel) {
        console.warn('Analysis panel not found in current page');
        return;
    }

    try {
        // Show loading state
        analysisPanel.innerHTML = '<div class="loading">Analyzing location data...</div>';

        // Fetch real-time data
        const [solarData, windData, terrainData] = await Promise.all([
            getSolarIrradiance(location.lat, location.lng),
            getWindData(location.lat, location.lng),
            getTerrainData(location.lat, location.lng)
        ]);

        // Process and display the analysis results
        const analysisResults = `
            <div class="analysis-section">
                <h3>Solar Potential Analysis ☀️</h3>
                <div class="analysis-data">
                    <div class="data-item">
                        <span class="label">Daily Irradiance:</span>
                        <span class="value">${solarData.outputs.monthly.fixed[0].H_day.toFixed(2)} kWh/m²/day</span>
                    </div>
                    <div class="data-item">
                        <span class="label">Annual Yield:</span>
                        <span class="value">${(solarData.outputs.totals.fixed.E_y / 1000).toFixed(1)} MWh/year</span>
                    </div>
                </div>
            </div>

            <div class="analysis-section">
                <h3>Wind Resource Analysis 🌪️</h3>
                <div class="analysis-data">
                    <div class="data-item">
                        <span class="label">Wind Speed:</span>
                        <span class="value">${windData.wind.speed.toFixed(1)} m/s</span>
                    </div>
                    <div class="data-item">
                        <span class="label">Wind Direction:</span>
                        <span class="value">${windData.wind.deg}°</span>
                    </div>
                </div>
            </div>

            <div class="analysis-section">
                <h3>Terrain Analysis 🌄</h3>
                <div class="analysis-data">
                    <div class="data-item">
                        <span class="label">Elevation:</span>
                        <span class="value">${terrainData.elevation.toFixed(1)}m</span>
                    </div>
                    <div class="data-item">
                        <span class="label">Slope:</span>
                        <span class="value">${terrainData.slope.toFixed(1)}°</span>
                    </div>
                    <div class="data-item">
                        <span class="label">Aspect:</span>
                        <span class="value">${terrainData.aspect}</span>
                    </div>
                </div>
            </div>

            <div class="analysis-section">
                <h3>Site Suitability Score 📊</h3>
                <div class="analysis-data">
                    <div class="data-item">
                        <span class="label">Overall Score:</span>
                        <span class="value">${calculateSiteScore(solarData, windData, terrainData).toFixed(1)}/100</span>
                    </div>
                </div>
            </div>
        `;

        analysisPanel.innerHTML = analysisResults;

        // Process results
        const solarPotential = calculateSolarPotential(solarData);
        const windSpeed = windData.wind.speed;
        const landSuitability = calculateLandSuitability(terrainData);
        const overallScore = calculateOverallScore(solarData, windData, terrainData);

        // Create analysis results HTML
        const resultsHTML = `
            <div class="analysis-results">
                <h3>Site Analysis Results</h3>
                <div class="result-section">
                    <h4>Solar Potential</h4>
                    <p>Daily Irradiance: ${solarPotential.toFixed(2)} kWh/m²</p>
                    <p>Annual Potential: ${(solarPotential * 365).toFixed(2)} kWh/m²/year</p>
                    <div class="progress-bar" style="--value: ${(solarPotential/7*100).toFixed(0)}%"></div>
                </div>
                <div class="result-section">
                    <h4>Wind Potential</h4>
                    <p>Average Wind Speed: ${windSpeed.toFixed(1)} m/s</p>
                    <p>Power Density: ${(Math.pow(windSpeed, 3) * 0.5).toFixed(2)} W/m²</p>
                    <div class="progress-bar" style="--value: ${(windSpeed/10*100).toFixed(0)}%"></div>
                </div>
                <div class="result-section">
                    <h4>Terrain Analysis</h4>
                    <p>Elevation: ${terrainData.elevation.toFixed(1)}m</p>
                    <p>Slope: ${terrainData.slope.toFixed(1)}°</p>
                    <p>Aspect: ${terrainData.aspect.toFixed(1)}°</p>
                    <p>Land Suitability: ${(landSuitability*100).toFixed(1)}%</p>
                </div>
                <div class="result-section">
                    <h4>Overall Site Score</h4>
                    <p>Score: ${overallScore.toFixed(1)}/100</p>
                    <div class="progress-bar" style="--value: ${overallScore.toFixed(0)}%"></div>
                </div>
            </div>
        `;

        // Update panel content
        analysisPanel.innerHTML = resultsHTML;

        // Update visualization
        visualizeAnalysisResults({
            sites: [{
                lat: location.lat,
                lng: location.lng,
                solarPotential,
                windPotential: windSpeed,
                landSuitability,
                elevation: terrainData.elevation,
                slope: terrainData.slope,
                aspect: terrainData.aspect,
                score: overallScore
            }]
        });

    } catch (error) {
        console.error('Error updating analysis panel:', error);
        analysisPanel.innerHTML = `<div class="error">Error analyzing location: ${error.message}</div>`;
    }
}

// Calculate solar potential from raw data
function calculateSolarPotential(solarData) {
    if (!solarData.outputs || !solarData.outputs.monthly || !solarData.outputs.monthly.fixed) {
        throw new Error('Invalid solar data format');
    }

    const monthlyValues = solarData.outputs.monthly.fixed;
    const annualAverage = monthlyValues.reduce((sum, month) => sum + month.H(a), 0) / 12;
    return annualAverage;
}

// Calculate land suitability based on terrain data
function calculateLandSuitability(terrainData) {
    const slopeWeight = 0.4;
    const elevationWeight = 0.3;
    const aspectWeight = 0.3;

    // Normalize slope (0-45 degrees)
    const slopeScore = Math.max(0, 1 - (terrainData.slope / 45));

    // Normalize elevation (0-3000m)
    const elevationScore = Math.max(0, 1 - (terrainData.elevation / 3000));

    // Calculate aspect score (south-facing is optimal)
    const aspectScore = Math.cos((terrainData.aspect - 180) * Math.PI / 180) * 0.5 + 0.5;

    return slopeScore * slopeWeight + 
           elevationScore * elevationWeight + 
           aspectScore * aspectWeight;
}

// Calculate overall site suitability score
function calculateOverallScore(solarData, windData, terrainData) {
    const solarWeight = 0.4;
    const windWeight = 0.3;
    const landWeight = 0.3;

    const solarScore = (calculateSolarPotential(solarData) / 7) * 100; // Normalize to 0-100
    const windScore = (windData.wind.speed / 10) * 100; // Normalize to 0-100
    const landScore = calculateLandSuitability(terrainData) * 100;

    return solarScore * solarWeight +
           windScore * windWeight +
           landScore * landWeight;
}

// Analyze drawn area
async function analyzeArea(layer) {
    try {
        const bounds = layer.getBounds();
        const center = bounds.getCenter();
        const radius = bounds.getNorthEast().distanceTo(bounds.getSouthWest()) / 2;

        // Generate analysis points within the area
        const points = generateAnalysisPoints(bounds, 5); // 5 points for analysis

        // Analyze each point
        const analysisPromises = points.map(async point => {
            const [solarData, windData, terrainData] = await Promise.all([
                getSolarIrradiance(point.lat, point.lng),
                getWindData(point.lat, point.lng),
                getTerrainData(point.lat, point.lng)
            ]);

            return {
                lat: point.lat,
                lng: point.lng,
                solarPotential: calculateSolarPotential(solarData),
                windPotential: windData.wind.speed,
                landSuitability: calculateLandSuitability(terrainData),
                elevation: terrainData.elevation,
                slope: terrainData.slope,
                aspect: terrainData.aspect,
                score: calculateOverallScore(solarData, windData, terrainData)
            };
        });

        const results = await Promise.all(analysisPromises);
        visualizeAnalysisResults({ sites: results });

    } catch (error) {
        console.error('Error analyzing area:', error);
        alert('Error analyzing selected area. Please try again.');
    }
}

// Generate analysis points within bounds
function generateAnalysisPoints(bounds, count) {
    const points = [];
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    for (let i = 0; i < count; i++) {
        points.push({
            lat: sw.lat + (ne.lat - sw.lat) * Math.random(),
            lng: sw.lng + (ne.lng - sw.lng) * Math.random()
        });
    }

    return points;
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.getElementById('analysis-panel').appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', initMap);