// Terrain Visualization Module
const TerrainVisualization = {
    chart: null,
    map3D: null,
    scene: null,
    camera: null,
    renderer: null,
    terrain: null,
    isRotating: false,
    rotationSpeed: 0.01,
    currentLocation: null,
    apiEndpoint: '/api/terrain-analysis',
    mockDataMode: false, // Using real data from backend API
    lastTerrainData: null,

    async initialize() {
        await this.loadDependencies();
        this.setupTabSwitching();
        this.initializeVisualizations();
        this.setupLocationListeners();
    },

    async loadDependencies() {
        await Promise.all([
            this.loadScript('https://cdn.plot.ly/plotly-latest.min.js'),
            this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'),
            this.loadScript('https://unpkg.com/deck.gl@latest/dist.min.js'),
            this.loadScript('https://unpkg.com/heatmap.js@2.0.5/build/heatmap.min.js'),
            this.loadScript('https://unpkg.com/@turf/turf@6/turf.min.js')
        ]);
    },

    loadScript(url) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    setupLocationListeners() {
        if (window.map) {
            window.map.on('click', (e) => {
                this.setLocation(e.latlng.lat, e.latlng.lng);
            });
        }
        
        const analyzeBtn = document.getElementById('analyzeLocation');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                const lat = parseFloat(document.getElementById('latInput').value);
                const lng = parseFloat(document.getElementById('lngInput').value);
                if (!isNaN(lat) && !isNaN(lng)) {
                    this.setLocation(lat, lng);
                }
            });
        }
    },
    
    async setLocation(lat, lng) {
        this.currentLocation = { lat, lng };
        this.showLoadingState();
        
        try {
            const data = await this.getTerrainData(lat, lng);
            this.lastTerrainData = data;
            this.updateAllVisualizations(data);
            
            document.querySelector('.results-container').style.display = 'block';
            document.querySelector('.results-container').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error analyzing terrain:', error);
            alert('Error analyzing terrain data. Please try again.');
        }
    },
    
    showLoadingState() {
        const containers = [
            'elevation-map', 'slope-map', 'drainage-map', 'risk-map', 'terrain-3d-container'
        ];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>';
            }
        });
    },
    
    async getTerrainData(lat, lng) {
        if (this.mockDataMode) {
            return this.generateMockTerrainData(lat, lng);
        } else {
            const response = await fetch(`${this.apiEndpoint}?lat=${lat}&lng=${lng}`);
            if (!response.ok) {
                throw new Error('Failed to fetch terrain data');
            }
            return await response.json();
        }
    },
    
    generateMockTerrainData(lat, lng) {
        // Generate deterministic but varied data based on coordinates
        const latSeed = Math.sin(lat * 0.1) * 500;
        const lngSeed = Math.cos(lng * 0.1) * 500;
        const combinedSeed = (latSeed + lngSeed) / 2;
        
        // Use the seed to generate consistent values for a location
        const elevation = 200 + Math.abs(combinedSeed % 800);
        const slope = 5 + Math.abs((combinedSeed * 0.1) % 35);
        const waterTableDepth = 2 + Math.abs((combinedSeed * 0.05) % 15);
        
        // Determine categorical values based on numerical ranges
        const getSurfaceRoughness = (val) => {
            if (val < 15) return 'Low';
            if (val < 25) return 'Medium';
            return 'High';
        };
        
        const getErosionRisk = (val) => {
            if (val < 10) return 'Low';
            if (val < 25) return 'Medium';
            return 'High';
        };
        
        const getFloodRisk = (val) => {
            if (val > 10) return 'Low';
            if (val > 5) return 'Medium';
            return 'High';
        };
        
        const soilTypes = ['Sandy', 'Clay', 'Loam', 'Silt', 'Rocky'];
        const soilType = soilTypes[Math.floor(Math.abs(combinedSeed) % soilTypes.length)];
        
        const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
        const flowDirection = directions[Math.floor(Math.abs(combinedSeed * 10) % directions.length)];
        
        // Generate soil composition based on soil type
        let sandPercent, siltPercent, clayPercent;
        switch(soilType) {
            case 'Sandy':
                sandPercent = 60 + (combinedSeed % 20);
                siltPercent = 30 - (combinedSeed % 15);
                clayPercent = 100 - sandPercent - siltPercent;
                break;
            case 'Clay':
                clayPercent = 50 + (combinedSeed % 20);
                siltPercent = 30 - (combinedSeed % 15);
                sandPercent = 100 - clayPercent - siltPercent;
                break;
            case 'Loam':
                sandPercent = 40 + (combinedSeed % 10);
                siltPercent = 40 + (combinedSeed % 10);
                clayPercent = 100 - sandPercent - siltPercent;
                break;
            case 'Silt':
                siltPercent = 60 + (combinedSeed % 20);
                clayPercent = 30 - (combinedSeed % 15);
                sandPercent = 100 - siltPercent - clayPercent;
                break;
            case 'Rocky':
                sandPercent = 70 + (combinedSeed % 20);
                siltPercent = 20 - (combinedSeed % 10);
                clayPercent = 100 - sandPercent - siltPercent;
                break;
        }
        
        // Generate recommendations based on data
        const recommendations = [];
        
        if (slope < 15 && getErosionRisk(slope) === 'Low') {
            recommendations.push('Site shows excellent potential for development');
        } else if (slope < 25 && getErosionRisk(slope) === 'Medium') {
            recommendations.push('Site shows good potential with some modifications');
        } else {
            recommendations.push('Site requires significant engineering for development');
        }
        
        if (getErosionRisk(slope) === 'Medium' || getErosionRisk(slope) === 'High') {
            recommendations.push('Consider implementing erosion control measures');
        }
        
        if (getFloodRisk(waterTableDepth) === 'Medium' || getFloodRisk(waterTableDepth) === 'High') {
            recommendations.push('Implement drainage systems to manage water flow');
        }
        
        if (soilType === 'Sandy' || soilType === 'Clay') {
            recommendations.push('Conduct detailed geotechnical survey before construction');
        }
        
        return {
            elevation_analysis: {
                elevation: parseFloat(elevation.toFixed(1)),
                slope: parseFloat(slope.toFixed(1)),
                surface_roughness: getSurfaceRoughness(slope)
            },
            soil_stability: {
                soil_type: soilType,
                foundation_strength: parseFloat((50 + (combinedSeed % 50)).toFixed(1)),
                erosion_risk: getErosionRisk(slope),
                composition: {
                    sand: parseFloat(sandPercent.toFixed(0)),
                    silt: parseFloat(siltPercent.toFixed(0)),
                    clay: parseFloat(clayPercent.toFixed(0))
                },
                bearing_capacity: getSurfaceRoughness(slope) === 'High' ? 'Low' : 'Medium',
                permeability: soilType === 'Sandy' ? 'High' : (soilType === 'Clay' ? 'Low' : 'Medium')
            },
            drainage_analysis: {
                flow_direction: flowDirection,
                flood_risk: getFloodRisk(waterTableDepth),
                water_table_depth: parseFloat(waterTableDepth.toFixed(1))
            },
            erosion_analysis: {
                water_erosion: getErosionRisk(slope),
                wind_erosion: soilType === 'Sandy' ? 'High' : 'Low',
                vegetation_cover: ['Sparse', 'Moderate', 'Dense'][Math.floor(Math.abs(combinedSeed) % 3)]
            },
            surface_characteristics: {
                roughness: getSurfaceRoughness(slope),
                terrain_type: soilType === 'Rocky' ? 'Rocky' : 'Normal',
                excavation_difficulty: getSurfaceRoughness(slope) === 'High' ? 'High' : 'Medium',
                solar_suitability: slope < 15 ? 'High' : (slope < 25 ? 'Moderate' : 'Low')
            },
            landslide_risk: {
                susceptibility: slope > 30 ? 'High' : (slope > 20 ? 'Medium' : 'Low'),
                risk_percentage: parseFloat((slope / 45 * 100).toFixed(0))
            },
            recommendations: recommendations
        };
    },
    
    updateAllVisualizations(data) {
        // Update UI elements with terrain data
        this.updateTerrainData(data);
        
        // Update visualizations
        this.createElevationMap('elevation-map', data);
        this.createSlopeAnalysis('slope-map', data);
        this.createDrainageVisualization('drainage-map', data);
        this.createRiskZonesMap('risk-map', data);
        this.update3DTerrainModel('terrain-3d-container', data);
    },

    updateTerrainData(data) {
        if (!data) return;
        
        // Update elevation data
        if (data.elevation_analysis) {
            document.getElementById('elevation-value').textContent = `${data.elevation_analysis.elevation}m`;
            document.getElementById('slope-value').textContent = `${data.elevation_analysis.slope}°`;
            document.getElementById('roughness-value').textContent = data.elevation_analysis.surface_roughness;
        }
        
        // Update soil data
        if (data.soil_stability) {
            document.getElementById('soil-type-value').textContent = data.soil_stability.soil_type;
            document.getElementById('erosion-risk-value').textContent = data.soil_stability.erosion_risk;
            
            // Update soil composition chart if it exists
            if (data.soil_stability.composition && this.chart) {
                const composition = data.soil_stability.composition;
                const chartData = [{
                    values: [composition.sand, composition.silt, composition.clay],
                    labels: ['Sand', 'Silt', 'Clay'],
                    type: 'pie',
                    marker: {
                        colors: ['#e5c07b', '#c678dd', '#61afef']
                    }
                }];
                
                Plotly.react('soil-composition-chart', chartData, {
                    margin: {t: 0, b: 0, l: 0, r: 0},
                    height: 200
                });
            }
        }
        
        // Update drainage data
        if (data.drainage_analysis) {
            document.getElementById('flow-direction-value').textContent = data.drainage_analysis.flow_direction;
            document.getElementById('flood-risk-value').textContent = data.drainage_analysis.flood_risk;
            document.getElementById('water-table-value').textContent = `${data.drainage_analysis.water_table_depth}m`;
        }
        
        // Update recommendations
        if (data.recommendations && data.recommendations.length > 0) {
            const recList = document.getElementById('recommendations-list');
            if (recList) {
                recList.innerHTML = '';
                data.recommendations.forEach(rec => {
                    const li = document.createElement('li');
                    li.className = 'mb-2 flex items-start';
                    li.innerHTML = `
                        <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>${rec}</span>
                    `;
                    recList.appendChild(li);
                });
            }
        }
    },

    setupTabSwitching() {
        const tabs = document.querySelectorAll('#visualization-tabs button');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => {
                    t.classList.remove('active', 'border-blue-500');
                    t.classList.add('border-transparent');
                });
                
                // Add active class to clicked tab
                tab.classList.add('active', 'border-blue-500');
                tab.classList.remove('border-transparent');
                
                // Hide all content
                const contentDivs = document.querySelectorAll('#visualization-content > div');
                contentDivs.forEach(div => div.classList.add('hidden'));
                
                // Show selected content
                const contentId = tab.getAttribute('data-tab');
                document.getElementById(contentId).classList.remove('hidden');
                document.getElementById(contentId).classList.add('block');
                
                // Initialize visualization if needed
                this.initializeTabContent(contentId);
            });
        });
        
        // Setup 3D terrain controls
        this.setup3DTerrainControls();
    },
    
    setup3DTerrainControls() {
        const rotateButton = document.getElementById('rotate-terrain');
        const toggleLayersButton = document.getElementById('toggle-layers');
        const resetViewButton = document.getElementById('reset-view');
        
        if (rotateButton) {
            rotateButton.addEventListener('click', () => {
                this.isRotating = !this.isRotating;
                rotateButton.textContent = this.isRotating ? 'Stop Rotation' : 'Rotate View';
                rotateButton.classList.toggle('bg-red-500');
                rotateButton.classList.toggle('bg-blue-500');
            });
        }
        
        if (toggleLayersButton) {
            toggleLayersButton.addEventListener('click', () => {
                if (this.terrain) {
                    this.terrain.material.wireframe = !this.terrain.material.wireframe;
                }
            });
        }
        
        if (resetViewButton) {
            resetViewButton.addEventListener('click', () => {
                if (this.camera) {
                    this.camera.position.set(0, 5, 10);
                    this.camera.lookAt(0, 0, 0);
                }
            });
        }
    },

    initializeVisualizations() {
        // Initialize the first tab (elevation map) by default
        this.createElevationMap('elevation-map');
        
        // Initialize 3D terrain model
        this.create3DTerrainModel('terrain-3d-container');
    },
    
    initializeTabContent(contentId) {
        // If we have location data, use it for visualization
        if (this.currentLocation && this.lastTerrainData) {
            const data = this.lastTerrainData;
            
            switch(contentId) {
                case 'elevation-content':
                    this.createElevationMap('elevation-map', data);
                    break;
                case 'slope-content':
                    this.createSlopeAnalysis('slope-map', data);
                    break;
                case 'drainage-content':
                    this.createDrainageVisualization('drainage-map', data);
                    break;
                case 'risk-content':
                    this.createRiskZonesMap('risk-map', data);
                    break;
            }
        } else {
            // Otherwise initialize with default data
            switch(contentId) {
                case 'elevation-content':
                    this.createElevationMap('elevation-map');
                    break;
                case 'slope-content':
                    this.createSlopeAnalysis('slope-map');
                    break;
                case 'drainage-content':
                    this.createDrainageVisualization('drainage-map');
                    break;
                case 'risk-content':
                    this.createRiskZonesMap('risk-map');
                    break;
            }
        }
    },

    createElevationMap(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Create heatmap instance
        const heatmapInstance = h337.create({
            container: container,
            radius: 15,
            maxOpacity: 0.8,
            minOpacity: 0.3,
            blur: 0.75,
            gradient: {
                0.1: 'rgb(0, 128, 0)',    // Green for low elevation
                0.5: 'rgb(255, 255, 0)',  // Yellow for medium elevation
                0.9: 'rgb(255, 0, 0)'     // Red for high elevation
            }
        });
        
        // Generate elevation data
        const width = container.clientWidth;
        const height = container.clientHeight;
        const points = [];
        const max = 100;
        
        // If we have real data, use it to influence the visualization
        let elevationValue = 50; // Default middle value
        let elevationVariance = 1.0; // Default variance
        
        if (data && data.elevation_analysis) {
            // Normalize elevation to 0-100 scale (assuming max elevation of 2000m)
            elevationValue = Math.min(100, data.elevation_analysis.elevation / 20);
            
            // Adjust variance based on roughness
            if (data.elevation_analysis.surface_roughness === 'High') {
                elevationVariance = 1.5;
            } else if (data.elevation_analysis.surface_roughness === 'Low') {
                elevationVariance = 0.5;
            }
        }
        
        // Create a more realistic terrain pattern
        for (let x = 0; x < width; x += 10) {
            for (let y = 0; y < height; y += 10) {
                // Use Perlin noise or similar algorithm for realistic terrain
                // Here we're using a simplified approach with sine waves
                const baseValue = elevationValue + 
                    20 * Math.sin(x/50) * elevationVariance + 
                    20 * Math.sin(y/50) * elevationVariance + 
                    30 * Math.sin((x+y)/100) * elevationVariance;
                
                // Ensure value is within bounds
                const value = Math.max(0, Math.min(100, baseValue));
                
                points.push({
                    x: x,
                    y: y,
                    value: value
                });
            }
        }
        
        // Set data
        heatmapInstance.setData({
            max: max,
            data: points
        });
        
        // Add a central marker if we have real data
        if (data && data.elevation_analysis) {
            const marker = document.createElement('div');
            marker.className = 'absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 z-10';
            marker.style.left = '50%';
            marker.style.top = '50%';
            marker.title = `Elevation: ${data.elevation_analysis.elevation}m`;
            container.appendChild(marker);
        }
    },
    
    createSlopeAnalysis(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Create heatmap instance for slope analysis
        const heatmapInstance = h337.create({
            container: container,
            radius: 15,
            maxOpacity: 0.8,
            minOpacity: 0.3,
            blur: 0.75,
            gradient: {
                0.1: 'rgb(0, 0, 255)',    // Blue for flat areas
                0.4: 'rgb(255, 165, 0)',  // Orange for moderate slopes
                0.7: 'rgb(255, 0, 0)'     // Red for steep slopes
            }
        });
        
        // Generate slope data
        const width = container.clientWidth;
        const height = container.clientHeight;
        const points = [];
        const max = 100;
        
        // If we have real data, use it to influence the visualization
        let slopeValue = 30; // Default middle value
        let slopePattern = 1.0; // Default pattern intensity
        
        if (data && data.elevation_analysis) {
            // Normalize slope to 0-100 scale (assuming max slope of 45 degrees)
            slopeValue = Math.min(100, data.elevation_analysis.slope * 2.2);
            
            // Adjust pattern based on roughness
            if (data.elevation_analysis.surface_roughness === 'High') {
                slopePattern = 1.5;
            } else if (data.elevation_analysis.surface_roughness === 'Low') {
                slopePattern = 0.5;
            }
        }
        
        // Create slope pattern
        for (let x = 0; x < width; x += 10) {
            for (let y = 0; y < height; y += 10) {
                // Calculate slope based on position
                // Higher values near edges to simulate mountains/hills
                const distFromCenter = Math.sqrt(
                    Math.pow((x - width/2) / (width/2), 2) + 
                    Math.pow((y - height/2) / (height/2), 2)
                );
                
                // Base value influenced by the actual slope data
                let value = slopeValue * 0.5 + 30 * distFromCenter * slopePattern;
                
                // Add some randomness
                value += Math.random() * 10 - 5;
                
                // Add some ridges and valleys
                value += 10 * Math.sin(x/30) * Math.cos(y/30) * slopePattern;
                
                // Clamp values
                value = Math.max(0, Math.min(100, value));
                
                points.push({
                    x: x,
                    y: y,
                    value: value
                });
            }
        }
        
        // Set data
        heatmapInstance.setData({
            max: max,
            data: points
        });
        
        // Add a central marker if we have real data
        if (data && data.elevation_analysis) {
            const marker = document.createElement('div');
            marker.className = 'absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 z-10';
            marker.style.left = '50%';
            marker.style.top = '50%';
            marker.title = `Slope: ${data.elevation_analysis.slope}°`;
            container.appendChild(marker);
        }
    },
    
    createDrainageVisualization(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Create canvas for drainage visualization
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Draw background
        ctx.fillStyle = '#f0f8ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Generate drainage patterns
        if (data && data.drainage_analysis) {
            this.drawDrainagePatternWithData(ctx, canvas.width, canvas.height, data.drainage_analysis);
        } else {
            this.drawDrainagePattern(ctx, canvas.width, canvas.height);
        }
    },
    
    drawDrainagePatternWithData(ctx, width, height, drainageData) {
        // Determine flow direction angle
        let flowAngle = 0;
        switch(drainageData.flow_direction) {
            case 'North': flowAngle = Math.PI * 3 / 2; break;
            case 'Northeast': flowAngle = Math.PI * 7 / 4; break;
            case 'East': flowAngle = 0; break;
            case 'Southeast': flowAngle = Math.PI / 4; break;
            case 'South': flowAngle = Math.PI / 2; break;
            case 'Southwest': flowAngle = Math.PI * 3 / 4; break;
            case 'West': flowAngle = Math.PI; break;
            case 'Northwest': flowAngle = Math.PI * 5 / 4; break;
        }
        
        // Determine color intensity based on flood risk and slope gradient
        let colorIntensity = Math.min(1.0, drainageData.flood_risk * 0.8 + drainageData.slope_gradient * 0.2);
        
        // Create arrow style based on flow direction and risk
        const arrowStyle = {
            color: `rgba(0, 0, 255, ${colorIntensity})`,
            width: 2 + (colorIntensity * 3),
            length: 15 + (colorIntensity * 10)
        };
        
        // Draw main rivers/streams
        ctx.strokeStyle = `rgba(0, 102, 204, ${colorIntensity})`;
        ctx.lineWidth = 3;
        
        // Main river - direction based on flow direction
        const centerX = width / 2;
        const centerY = height / 2;
        const riverLength = Math.min(width, height) * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
            centerX - Math.cos(flowAngle) * riverLength / 2,
            centerY - Math.sin(flowAngle) * riverLength / 2
        );
        
        // Control points for bezier curve
        const cp1x = centerX - Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp1y = centerY - Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        const cp2x = centerX + Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp2y = centerY + Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        
        ctx.bezierCurveTo(
            cp1x, cp1y,
            cp2x, cp2y,
            centerX + Math.cos(flowAngle) * riverLength / 2,
            centerY + Math.sin(flowAngle) * riverLength / 2
        );
        ctx.stroke();
        
        // Tributaries
        const perpAngle = flowAngle + Math.PI / 2;
        this.drawTributary(ctx, centerX - Math.cos(flowAngle) * riverLength / 4, centerY - Math.sin(flowAngle) * riverLength / 4, 2, 40, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        this.drawTributary(ctx, centerX, centerY, 2, 30, Math.cos(perpAngle) * -0.3, Math.sin(perpAngle) * -0.3);
        this.drawTributary(ctx, centerX + Math.cos(flowAngle) * riverLength / 4, centerY + Math.sin(flowAngle) * riverLength / 4, 2, 25, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        
        // Draw pooling areas - more if flood risk is high
        ctx.fillStyle = `rgba(0, 102, 204, ${colorIntensity * 0.5})`;
        
        const poolCount = drainageData.flood_risk === 'High' ? 4 : (drainageData.flood_risk === 'Medium' ? 2 : 1);
        for (let i = 0; i < poolCount; i++) {
            const poolX = centerX + (Math.random() - 0.5) * width * 0.6;
            const poolY = centerY + (Math.random() - 0.5) * height * 0.6;
            const poolSize = 15 + Math.random() * 20;
            
            ctx.beginPath();
            ctx.ellipse(poolX, poolY, poolSize, poolSize * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add flow direction arrows
        for (let i = 0; i < 5; i++) {
            const arrowX = centerX + (Math.random() - 0.5) * width * 0.7;
            const arrowY = centerY + (Math.random() - 0.5) * height * 0.7;
            
            // Calculate arrow direction based on terrain slope
            const slopeAngle = Math.atan2(drainageData.slope_y || Math.random() - 0.5, drainageData.slope_x || Math.random() - 0.5);
            const arrowLength = 20;
            
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            const endX = arrowX + Math.cos(slopeAngle) * arrowLength;
            const endY = arrowY + Math.sin(slopeAngle) * arrowLength;
            ctx.lineTo(endX, endY);
            
            // Draw arrow head
            const headLength = 8;
            const angle = Math.PI / 6;
            
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle - angle),
                endY - headLength * Math.sin(slopeAngle - angle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle + angle),
                endY - headLength * Math.sin(slopeAngle + angle)
            );
            
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },
    
    drawDrainagePattern(ctx, width, height) {
        // Determine flow direction angle
        let flowAngle = 0;
        switch(drainageData.flow_direction) {
            case 'North': flowAngle = Math.PI * 3 / 2; break;
            case 'Northeast': flowAngle = Math.PI * 7 / 4; break;
            case 'East': flowAngle = 0; break;
            case 'Southeast': flowAngle = Math.PI / 4; break;
            case 'South': flowAngle = Math.PI / 2; break;
            case 'Southwest': flowAngle = Math.PI * 3 / 4; break;
            case 'West': flowAngle = Math.PI; break;
            case 'Northwest': flowAngle = Math.PI * 5 / 4; break;
        }
        
        // Determine color intensity based on flood risk and slope gradient
        let colorIntensity = Math.min(1.0, drainageData.flood_risk * 0.8 + drainageData.slope_gradient * 0.2);
        
        // Create arrow style based on flow direction and risk
        const arrowStyle = {
            color: `rgba(0, 0, 255, ${colorIntensity})`,
            width: 2 + (colorIntensity * 3),
            length: 15 + (colorIntensity * 10)
        };
        
        // Draw main rivers/streams
        ctx.strokeStyle = `rgba(0, 102, 204, ${colorIntensity})`;
        ctx.lineWidth = 3;
        
        // Main river - direction based on flow direction
        const centerX = width / 2;
        const centerY = height / 2;
        const riverLength = Math.min(width, height) * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
            centerX - Math.cos(flowAngle) * riverLength / 2,
            centerY - Math.sin(flowAngle) * riverLength / 2
        );
        
        // Control points for bezier curve
        const cp1x = centerX - Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp1y = centerY - Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        const cp2x = centerX + Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp2y = centerY + Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        
        ctx.bezierCurveTo(
            cp1x, cp1y,
            cp2x, cp2y,
            centerX + Math.cos(flowAngle) * riverLength / 2,
            centerY + Math.sin(flowAngle) * riverLength / 2
        );
        ctx.stroke();
        
        // Tributaries
        const perpAngle = flowAngle + Math.PI / 2;
        this.drawTributary(ctx, centerX - Math.cos(flowAngle) * riverLength / 4, centerY - Math.sin(flowAngle) * riverLength / 4, 2, 40, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        this.drawTributary(ctx, centerX, centerY, 2, 30, Math.cos(perpAngle) * -0.3, Math.sin(perpAngle) * -0.3);
        this.drawTributary(ctx, centerX + Math.cos(flowAngle) * riverLength / 4, centerY + Math.sin(flowAngle) * riverLength / 4, 2, 25, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        
        // Draw pooling areas - more if flood risk is high
        ctx.fillStyle = `rgba(0, 102, 204, ${colorIntensity * 0.5})`;
        
        const poolCount = drainageData.flood_risk === 'High' ? 4 : (drainageData.flood_risk === 'Medium' ? 2 : 1);
        for (let i = 0; i < poolCount; i++) {
            const poolX = centerX + (Math.random() - 0.5) * width * 0.6;
            const poolY = centerY + (Math.random() - 0.5) * height * 0.6;
            const poolSize = 15 + Math.random() * 20;
            
            ctx.beginPath();
            ctx.ellipse(poolX, poolY, poolSize, poolSize * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add flow direction arrows
        for (let i = 0; i < 5; i++) {
            const arrowX = centerX + (Math.random() - 0.5) * width * 0.7;
            const arrowY = centerY + (Math.random() - 0.5) * height * 0.7;
            
            // Calculate arrow direction based on terrain slope
            const slopeAngle = Math.atan2(drainageData.slope_y || Math.random() - 0.5, drainageData.slope_x || Math.random() - 0.5);
            const arrowLength = 20;
            
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            const endX = arrowX + Math.cos(slopeAngle) * arrowLength;
            const endY = arrowY + Math.sin(slopeAngle) * arrowLength;
            ctx.lineTo(endX, endY);
            
            // Draw arrow head
            const headLength = 8;
            const angle = Math.PI / 6;
            
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle - angle),
                endY - headLength * Math.sin(slopeAngle - angle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle + angle),
                endY - headLength * Math.sin(slopeAngle + angle)
            );
            
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },
    
    drawDrainagePattern(ctx, width, height) {
        // Determine flow direction angle
        let flowAngle = 0;
        switch(drainageData.flow_direction) {
            case 'North': flowAngle = Math.PI * 3 / 2; break;
            case 'Northeast': flowAngle = Math.PI * 7 / 4; break;
            case 'East': flowAngle = 0; break;
            case 'Southeast': flowAngle = Math.PI / 4; break;
            case 'South': flowAngle = Math.PI / 2; break;
            case 'Southwest': flowAngle = Math.PI * 3 / 4; break;
            case 'West': flowAngle = Math.PI; break;
            case 'Northwest': flowAngle = Math.PI * 5 / 4; break;
        }
        
        // Determine color intensity based on flood risk and slope gradient
        let colorIntensity = Math.min(1.0, drainageData.flood_risk * 0.8 + drainageData.slope_gradient * 0.2);
        
        // Create arrow style based on flow direction and risk
        const arrowStyle = {
            color: `rgba(0, 0, 255, ${colorIntensity})`,
            width: 2 + (colorIntensity * 3),
            length: 15 + (colorIntensity * 10)
        };
        
        // Draw main rivers/streams
        ctx.strokeStyle = `rgba(0, 102, 204, ${colorIntensity})`;
        ctx.lineWidth = 3;
        
        // Main river - direction based on flow direction
        const centerX = width / 2;
        const centerY = height / 2;
        const riverLength = Math.min(width, height) * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
            centerX - Math.cos(flowAngle) * riverLength / 2,
            centerY - Math.sin(flowAngle) * riverLength / 2
        );
        
        // Control points for bezier curve
        const cp1x = centerX - Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp1y = centerY - Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        const cp2x = centerX + Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp2y = centerY + Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        
        ctx.bezierCurveTo(
            cp1x, cp1y,
            cp2x, cp2y,
            centerX + Math.cos(flowAngle) * riverLength / 2,
            centerY + Math.sin(flowAngle) * riverLength / 2
        );
        ctx.stroke();
        
        // Tributaries
        const perpAngle = flowAngle + Math.PI / 2;
        this.drawTributary(ctx, centerX - Math.cos(flowAngle) * riverLength / 4, centerY - Math.sin(flowAngle) * riverLength / 4, 2, 40, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        this.drawTributary(ctx, centerX, centerY, 2, 30, Math.cos(perpAngle) * -0.3, Math.sin(perpAngle) * -0.3);
        this.drawTributary(ctx, centerX + Math.cos(flowAngle) * riverLength / 4, centerY + Math.sin(flowAngle) * riverLength / 4, 2, 25, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        
        // Draw pooling areas - more if flood risk is high
        ctx.fillStyle = `rgba(0, 102, 204, ${colorIntensity * 0.5})`;
        
        const poolCount = drainageData.flood_risk === 'High' ? 4 : (drainageData.flood_risk === 'Medium' ? 2 : 1);
        for (let i = 0; i < poolCount; i++) {
            const poolX = centerX + (Math.random() - 0.5) * width * 0.6;
            const poolY = centerY + (Math.random() - 0.5) * height * 0.6;
            const poolSize = 15 + Math.random() * 20;
            
            ctx.beginPath();
            ctx.ellipse(poolX, poolY, poolSize, poolSize * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add flow direction arrows
        for (let i = 0; i < 5; i++) {
            const arrowX = centerX + (Math.random() - 0.5) * width * 0.7;
            const arrowY = centerY + (Math.random() - 0.5) * height * 0.7;
            
            // Calculate arrow direction based on terrain slope
            const slopeAngle = Math.atan2(drainageData.slope_y || Math.random() - 0.5, drainageData.slope_x || Math.random() - 0.5);
            const arrowLength = 20;
            
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            const endX = arrowX + Math.cos(slopeAngle) * arrowLength;
            const endY = arrowY + Math.sin(slopeAngle) * arrowLength;
            ctx.lineTo(endX, endY);
            
            // Draw arrow head
            const headLength = 8;
            const angle = Math.PI / 6;
            
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle - angle),
                endY - headLength * Math.sin(slopeAngle - angle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle + angle),
                endY - headLength * Math.sin(slopeAngle + angle)
            );
            
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },
    
    drawDrainagePattern(ctx, width, height) {
        // Determine flow direction angle
        let flowAngle = 0;
        switch(drainageData.flow_direction) {
            case 'North': flowAngle = Math.PI * 3 / 2; break;
            case 'Northeast': flowAngle = Math.PI * 7 / 4; break;
            case 'East': flowAngle = 0; break;
            case 'Southeast': flowAngle = Math.PI / 4; break;
            case 'South': flowAngle = Math.PI / 2; break;
            case 'Southwest': flowAngle = Math.PI * 3 / 4; break;
            case 'West': flowAngle = Math.PI; break;
            case 'Northwest': flowAngle = Math.PI * 5 / 4; break;
        }
        
        // Determine color intensity based on flood risk and slope gradient
        let colorIntensity = Math.min(1.0, drainageData.flood_risk * 0.8 + drainageData.slope_gradient * 0.2);
        
        // Create arrow style based on flow direction and risk
        const arrowStyle = {
            color: `rgba(0, 0, 255, ${colorIntensity})`,
            width: 2 + (colorIntensity * 3),
            length: 15 + (colorIntensity * 10)
        };
        
        // Draw main rivers/streams
        ctx.strokeStyle = `rgba(0, 102, 204, ${colorIntensity})`;
        ctx.lineWidth = 3;
        
        // Main river - direction based on flow direction
        const centerX = width / 2;
        const centerY = height / 2;
        const riverLength = Math.min(width, height) * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
            centerX - Math.cos(flowAngle) * riverLength / 2,
            centerY - Math.sin(flowAngle) * riverLength / 2
        );
        
        // Control points for bezier curve
        const cp1x = centerX - Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp1y = centerY - Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        const cp2x = centerX + Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp2y = centerY + Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        
        ctx.bezierCurveTo(
            cp1x, cp1y,
            cp2x, cp2y,
            centerX + Math.cos(flowAngle) * riverLength / 2,
            centerY + Math.sin(flowAngle) * riverLength / 2
        );
        ctx.stroke();
        
        // Tributaries
        const perpAngle = flowAngle + Math.PI / 2;
        this.drawTributary(ctx, centerX - Math.cos(flowAngle) * riverLength / 4, centerY - Math.sin(flowAngle) * riverLength / 4, 2, 40, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        this.drawTributary(ctx, centerX, centerY, 2, 30, Math.cos(perpAngle) * -0.3, Math.sin(perpAngle) * -0.3);
        this.drawTributary(ctx, centerX + Math.cos(flowAngle) * riverLength / 4, centerY + Math.sin(flowAngle) * riverLength / 4, 2, 25, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        
        // Draw pooling areas - more if flood risk is high
        ctx.fillStyle = `rgba(0, 102, 204, ${colorIntensity * 0.5})`;
        
        const poolCount = drainageData.flood_risk === 'High' ? 4 : (drainageData.flood_risk === 'Medium' ? 2 : 1);
        for (let i = 0; i < poolCount; i++) {
            const poolX = centerX + (Math.random() - 0.5) * width * 0.6;
            const poolY = centerY + (Math.random() - 0.5) * height * 0.6;
            const poolSize = 15 + Math.random() * 20;
            
            ctx.beginPath();
            ctx.ellipse(poolX, poolY, poolSize, poolSize * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add flow direction arrows
        for (let i = 0; i < 5; i++) {
            const arrowX = centerX + (Math.random() - 0.5) * width * 0.7;
            const arrowY = centerY + (Math.random() - 0.5) * height * 0.7;
            
            // Calculate arrow direction based on terrain slope
            const slopeAngle = Math.atan2(drainageData.slope_y || Math.random() - 0.5, drainageData.slope_x || Math.random() - 0.5);
            const arrowLength = 20;
            
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            const endX = arrowX + Math.cos(slopeAngle) * arrowLength;
            const endY = arrowY + Math.sin(slopeAngle) * arrowLength;
            ctx.lineTo(endX, endY);
            
            // Draw arrow head
            const headLength = 8;
            const angle = Math.PI / 6;
            
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle - angle),
                endY - headLength * Math.sin(slopeAngle - angle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle + angle),
                endY - headLength * Math.sin(slopeAngle + angle)
            );
            
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },
    
    drawDrainagePattern(ctx, width, height) {
        // Determine flow direction angle
        let flowAngle = 0;
        switch(drainageData.flow_direction) {
            case 'North': flowAngle = Math.PI * 3 / 2; break;
            case 'Northeast': flowAngle = Math.PI * 7 / 4; break;
            case 'East': flowAngle = 0; break;
            case 'Southeast': flowAngle = Math.PI / 4; break;
            case 'South': flowAngle = Math.PI / 2; break;
            case 'Southwest': flowAngle = Math.PI * 3 / 4; break;
            case 'West': flowAngle = Math.PI; break;
            case 'Northwest': flowAngle = Math.PI * 5 / 4; break;
        }
        
        // Determine color intensity based on flood risk and slope gradient
        let colorIntensity = Math.min(1.0, drainageData.flood_risk * 0.8 + drainageData.slope_gradient * 0.2);
        
        // Create arrow style based on flow direction and risk
        const arrowStyle = {
            color: `rgba(0, 0, 255, ${colorIntensity})`,
            width: 2 + (colorIntensity * 3),
            length: 15 + (colorIntensity * 10)
        };
        
        // Draw main rivers/streams
        ctx.strokeStyle = `rgba(0, 102, 204, ${colorIntensity})`;
        ctx.lineWidth = 3;
        
        // Main river - direction based on flow direction
        const centerX = width / 2;
        const centerY = height / 2;
        const riverLength = Math.min(width, height) * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
            centerX - Math.cos(flowAngle) * riverLength / 2,
            centerY - Math.sin(flowAngle) * riverLength / 2
        );
        
        // Control points for bezier curve
        const cp1x = centerX - Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp1y = centerY - Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        const cp2x = centerX + Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp2y = centerY + Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        
        ctx.bezierCurveTo(
            cp1x, cp1y,
            cp2x, cp2y,
            centerX + Math.cos(flowAngle) * riverLength / 2,
            centerY + Math.sin(flowAngle) * riverLength / 2
        );
        ctx.stroke();
        
        // Tributaries
        const perpAngle = flowAngle + Math.PI / 2;
        this.drawTributary(ctx, centerX - Math.cos(flowAngle) * riverLength / 4, centerY - Math.sin(flowAngle) * riverLength / 4, 2, 40, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        this.drawTributary(ctx, centerX, centerY, 2, 30, Math.cos(perpAngle) * -0.3, Math.sin(perpAngle) * -0.3);
        this.drawTributary(ctx, centerX + Math.cos(flowAngle) * riverLength / 4, centerY + Math.sin(flowAngle) * riverLength / 4, 2, 25, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        
        // Draw pooling areas - more if flood risk is high
        ctx.fillStyle = `rgba(0, 102, 204, ${colorIntensity * 0.5})`;
        
        const poolCount = drainageData.flood_risk === 'High' ? 4 : (drainageData.flood_risk === 'Medium' ? 2 : 1);
        for (let i = 0; i < poolCount; i++) {
            const poolX = centerX + (Math.random() - 0.5) * width * 0.6;
            const poolY = centerY + (Math.random() - 0.5) * height * 0.6;
            const poolSize = 15 + Math.random() * 20;
            
            ctx.beginPath();
            ctx.ellipse(poolX, poolY, poolSize, poolSize * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add flow direction arrows
        for (let i = 0; i < 5; i++) {
            const arrowX = centerX + (Math.random() - 0.5) * width * 0.7;
            const arrowY = centerY + (Math.random() - 0.5) * height * 0.7;
            
            // Calculate arrow direction based on terrain slope
            const slopeAngle = Math.atan2(drainageData.slope_y || Math.random() - 0.5, drainageData.slope_x || Math.random() - 0.5);
            const arrowLength = 20;
            
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            const endX = arrowX + Math.cos(slopeAngle) * arrowLength;
            const endY = arrowY + Math.sin(slopeAngle) * arrowLength;
            ctx.lineTo(endX, endY);
            
            // Draw arrow head
            const headLength = 8;
            const angle = Math.PI / 6;
            
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle - angle),
                endY - headLength * Math.sin(slopeAngle - angle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle + angle),
                endY - headLength * Math.sin(slopeAngle + angle)
            );
            
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },
    
    drawDrainagePattern(ctx, width, height) {
        // Determine flow direction angle
        let flowAngle = 0;
        switch(drainageData.flow_direction) {
            case 'North': flowAngle = Math.PI * 3 / 2; break;
            case 'Northeast': flowAngle = Math.PI * 7 / 4; break;
            case 'East': flowAngle = 0; break;
            case 'Southeast': flowAngle = Math.PI / 4; break;
            case 'South': flowAngle = Math.PI / 2; break;
            case 'Southwest': flowAngle = Math.PI * 3 / 4; break;
            case 'West': flowAngle = Math.PI; break;
            case 'Northwest': flowAngle = Math.PI * 5 / 4; break;
        }
        
        // Determine color intensity based on flood risk and slope gradient
        let colorIntensity = Math.min(1.0, drainageData.flood_risk * 0.8 + drainageData.slope_gradient * 0.2);
        
        // Create arrow style based on flow direction and risk
        const arrowStyle = {
            color: `rgba(0, 0, 255, ${colorIntensity})`,
            width: 2 + (colorIntensity * 3),
            length: 15 + (colorIntensity * 10)
        };
        
        // Draw main rivers/streams
        ctx.strokeStyle = `rgba(0, 102, 204, ${colorIntensity})`;
        ctx.lineWidth = 3;
        
        // Main river - direction based on flow direction
        const centerX = width / 2;
        const centerY = height / 2;
        const riverLength = Math.min(width, height) * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
            centerX - Math.cos(flowAngle) * riverLength / 2,
            centerY - Math.sin(flowAngle) * riverLength / 2
        );
        
        // Control points for bezier curve
        const cp1x = centerX - Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp1y = centerY - Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        const cp2x = centerX + Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp2y = centerY + Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        
        ctx.bezierCurveTo(
            cp1x, cp1y,
            cp2x, cp2y,
            centerX + Math.cos(flowAngle) * riverLength / 2,
            centerY + Math.sin(flowAngle) * riverLength / 2
        );
        ctx.stroke();
        
        // Tributaries
        const perpAngle = flowAngle + Math.PI / 2;
        this.drawTributary(ctx, centerX - Math.cos(flowAngle) * riverLength / 4, centerY - Math.sin(flowAngle) * riverLength / 4, 2, 40, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        this.drawTributary(ctx, centerX, centerY, 2, 30, Math.cos(perpAngle) * -0.3, Math.sin(perpAngle) * -0.3);
        this.drawTributary(ctx, centerX + Math.cos(flowAngle) * riverLength / 4, centerY + Math.sin(flowAngle) * riverLength / 4, 2, 25, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        
        // Draw pooling areas - more if flood risk is high
        ctx.fillStyle = `rgba(0, 102, 204, ${colorIntensity * 0.5})`;
        
        const poolCount = drainageData.flood_risk === 'High' ? 4 : (drainageData.flood_risk === 'Medium' ? 2 : 1);
        for (let i = 0; i < poolCount; i++) {
            const poolX = centerX + (Math.random() - 0.5) * width * 0.6;
            const poolY = centerY + (Math.random() - 0.5) * height * 0.6;
            const poolSize = 15 + Math.random() * 20;
            
            ctx.beginPath();
            ctx.ellipse(poolX, poolY, poolSize, poolSize * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add flow direction arrows
        for (let i = 0; i < 5; i++) {
            const arrowX = centerX + (Math.random() - 0.5) * width * 0.7;
            const arrowY = centerY + (Math.random() - 0.5) * height * 0.7;
            
            // Calculate arrow direction based on terrain slope
            const slopeAngle = Math.atan2(drainageData.slope_y || Math.random() - 0.5, drainageData.slope_x || Math.random() - 0.5);
            const arrowLength = 20;
            
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            const endX = arrowX + Math.cos(slopeAngle) * arrowLength;
            const endY = arrowY + Math.sin(slopeAngle) * arrowLength;
            ctx.lineTo(endX, endY);
            
            // Draw arrow head
            const headLength = 8;
            const angle = Math.PI / 6;
            
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle - angle),
                endY - headLength * Math.sin(slopeAngle - angle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle + angle),
                endY - headLength * Math.sin(slopeAngle + angle)
            );
            
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },
    
    drawDrainagePattern(ctx, width, height) {
        // Determine flow direction angle
        let flowAngle = 0;
        switch(drainageData.flow_direction) {
            case 'North': flowAngle = Math.PI * 3 / 2; break;
            case 'Northeast': flowAngle = Math.PI * 7 / 4; break;
            case 'East': flowAngle = 0; break;
            case 'Southeast': flowAngle = Math.PI / 4; break;
            case 'South': flowAngle = Math.PI / 2; break;
            case 'Southwest': flowAngle = Math.PI * 3 / 4; break;
            case 'West': flowAngle = Math.PI; break;
            case 'Northwest': flowAngle = Math.PI * 5 / 4; break;
        }
        
        // Determine color intensity based on flood risk and slope gradient
        let colorIntensity = Math.min(1.0, drainageData.flood_risk * 0.8 + drainageData.slope_gradient * 0.2);
        
        // Create arrow style based on flow direction and risk
        const arrowStyle = {
            color: `rgba(0, 0, 255, ${colorIntensity})`,
            width: 2 + (colorIntensity * 3),
            length: 15 + (colorIntensity * 10)
        };
        
        // Draw main rivers/streams
        ctx.strokeStyle = `rgba(0, 102, 204, ${colorIntensity})`;
        ctx.lineWidth = 3;
        
        // Main river - direction based on flow direction
        const centerX = width / 2;
        const centerY = height / 2;
        const riverLength = Math.min(width, height) * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
            centerX - Math.cos(flowAngle) * riverLength / 2,
            centerY - Math.sin(flowAngle) * riverLength / 2
        );
        
        // Control points for bezier curve
        const cp1x = centerX - Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp1y = centerY - Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        const cp2x = centerX + Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp2y = centerY + Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        
        ctx.bezierCurveTo(
            cp1x, cp1y,
            cp2x, cp2y,
            centerX + Math.cos(flowAngle) * riverLength / 2,
            centerY + Math.sin(flowAngle) * riverLength / 2
        );
        ctx.stroke();
        
        // Tributaries
        const perpAngle = flowAngle + Math.PI / 2;
        this.drawTributary(ctx, centerX - Math.cos(flowAngle) * riverLength / 4, centerY - Math.sin(flowAngle) * riverLength / 4, 2, 40, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        this.drawTributary(ctx, centerX, centerY, 2, 30, Math.cos(perpAngle) * -0.3, Math.sin(perpAngle) * -0.3);
        this.drawTributary(ctx, centerX + Math.cos(flowAngle) * riverLength / 4, centerY + Math.sin(flowAngle) * riverLength / 4, 2, 25, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        
        // Draw pooling areas - more if flood risk is high
        ctx.fillStyle = `rgba(0, 102, 204, ${colorIntensity * 0.5})`;
        
        const poolCount = drainageData.flood_risk === 'High' ? 4 : (drainageData.flood_risk === 'Medium' ? 2 : 1);
        for (let i = 0; i < poolCount; i++) {
            const poolX = centerX + (Math.random() - 0.5) * width * 0.6;
            const poolY = centerY + (Math.random() - 0.5) * height * 0.6;
            const poolSize = 15 + Math.random() * 20;
            
            ctx.beginPath();
            ctx.ellipse(poolX, poolY, poolSize, poolSize * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add flow direction arrows
        for (let i = 0; i < 5; i++) {
            const arrowX = centerX + (Math.random() - 0.5) * width * 0.7;
            const arrowY = centerY + (Math.random() - 0.5) * height * 0.7;
            
            // Calculate arrow direction based on terrain slope
            const slopeAngle = Math.atan2(drainageData.slope_y || Math.random() - 0.5, drainageData.slope_x || Math.random() - 0.5);
            const arrowLength = 20;
            
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            const endX = arrowX + Math.cos(slopeAngle) * arrowLength;
            const endY = arrowY + Math.sin(slopeAngle) * arrowLength;
            ctx.lineTo(endX, endY);
            
            // Draw arrow head
            const headLength = 8;
            const angle = Math.PI / 6;
            
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle - angle),
                endY - headLength * Math.sin(slopeAngle - angle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle + angle),
                endY - headLength * Math.sin(slopeAngle + angle)
            );
            
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },
    
    drawDrainagePattern(ctx, width, height) {
        // Determine flow direction angle
        let flowAngle = 0;
        switch(drainageData.flow_direction) {
            case 'North': flowAngle = Math.PI * 3 / 2; break;
            case 'Northeast': flowAngle = Math.PI * 7 / 4; break;
            case 'East': flowAngle = 0; break;
            case 'Southeast': flowAngle = Math.PI / 4; break;
            case 'South': flowAngle = Math.PI / 2; break;
            case 'Southwest': flowAngle = Math.PI * 3 / 4; break;
            case 'West': flowAngle = Math.PI; break;
            case 'Northwest': flowAngle = Math.PI * 5 / 4; break;
        }
        
        // Determine color intensity based on flood risk and slope gradient
        let colorIntensity = Math.min(1.0, drainageData.flood_risk * 0.8 + drainageData.slope_gradient * 0.2);
        
        // Create arrow style based on flow direction and risk
        const arrowStyle = {
            color: `rgba(0, 0, 255, ${colorIntensity})`,
            width: 2 + (colorIntensity * 3),
            length: 15 + (colorIntensity * 10)
        };
        
        // Draw main rivers/streams
        ctx.strokeStyle = `rgba(0, 102, 204, ${colorIntensity})`;
        ctx.lineWidth = 3;
        
        // Main river - direction based on flow direction
        const centerX = width / 2;
        const centerY = height / 2;
        const riverLength = Math.min(width, height) * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
            centerX - Math.cos(flowAngle) * riverLength / 2,
            centerY - Math.sin(flowAngle) * riverLength / 2
        );
        
        // Control points for bezier curve
        const cp1x = centerX - Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp1y = centerY - Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        const cp2x = centerX + Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp2y = centerY + Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        
        ctx.bezierCurveTo(
            cp1x, cp1y,
            cp2x, cp2y,
            centerX + Math.cos(flowAngle) * riverLength / 2,
            centerY + Math.sin(flowAngle) * riverLength / 2
        );
        ctx.stroke();
        
        // Tributaries
        const perpAngle = flowAngle + Math.PI / 2;
        this.drawTributary(ctx, centerX - Math.cos(flowAngle) * riverLength / 4, centerY - Math.sin(flowAngle) * riverLength / 4, 2, 40, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        this.drawTributary(ctx, centerX, centerY, 2, 30, Math.cos(perpAngle) * -0.3, Math.sin(perpAngle) * -0.3);
        this.drawTributary(ctx, centerX + Math.cos(flowAngle) * riverLength / 4, centerY + Math.sin(flowAngle) * riverLength / 4, 2, 25, Math.cos(perpAngle) * 0.3, Math.sin(perpAngle) * 0.3);
        
        // Draw pooling areas - more if flood risk is high
        ctx.fillStyle = `rgba(0, 102, 204, ${colorIntensity * 0.5})`;
        
        const poolCount = drainageData.flood_risk === 'High' ? 4 : (drainageData.flood_risk === 'Medium' ? 2 : 1);
        for (let i = 0; i < poolCount; i++) {
            const poolX = centerX + (Math.random() - 0.5) * width * 0.6;
            const poolY = centerY + (Math.random() - 0.5) * height * 0.6;
            const poolSize = 15 + Math.random() * 20;
            
            ctx.beginPath();
            ctx.ellipse(poolX, poolY, poolSize, poolSize * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add flow direction arrows
        for (let i = 0; i < 5; i++) {
            const arrowX = centerX + (Math.random() - 0.5) * width * 0.7;
            const arrowY = centerY + (Math.random() - 0.5) * height * 0.7;
            
            // Calculate arrow direction based on terrain slope
            const slopeAngle = Math.atan2(drainageData.slope_y || Math.random() - 0.5, drainageData.slope_x || Math.random() - 0.5);
            const arrowLength = 20;
            
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            const endX = arrowX + Math.cos(slopeAngle) * arrowLength;
            const endY = arrowY + Math.sin(slopeAngle) * arrowLength;
            ctx.lineTo(endX, endY);
            
            // Draw arrow head
            const headLength = 8;
            const angle = Math.PI / 6;
            
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle - angle),
                endY - headLength * Math.sin(slopeAngle - angle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(slopeAngle + angle),
                endY - headLength * Math.sin(slopeAngle + angle)
            );
            
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },
    
    drawDrainagePattern(ctx, width, height) {
        // Determine flow direction angle
        let flowAngle = 0;
        switch(drainageData.flow_direction) {
            case 'North': flowAngle = Math.PI * 3 / 2; break;
            case 'Northeast': flowAngle = Math.PI * 7 / 4; break;
            case 'East': flowAngle = 0; break;
            case 'Southeast': flowAngle = Math.PI / 4; break;
            case 'South': flowAngle = Math.PI / 2; break;
            case 'Southwest': flowAngle = Math.PI * 3 / 4; break;
            case 'West': flowAngle = Math.PI; break;
            case 'Northwest': flowAngle = Math.PI * 5 / 4; break;
        }
        
        // Determine color intensity based on flood risk
        let colorIntensity = 0.5; // Default medium intensity
        
        // Adjust intensity based on flood risk level
        if (drainageData.flood_risk === 'High') {
            colorIntensity = 0.9; // Higher intensity for high risk
        } else if (drainageData.flood_risk === 'Medium') {
            colorIntensity = 0.6; // Medium intensity for medium risk
        } else if (drainageData.flood_risk === 'Low') {
            colorIntensity = 0.3; // Lower intensity for low risk
        }
        
        // Create arrow style based on flow direction and risk
        const arrowStyle = {
            color: `rgba(0, 0, 255, ${colorIntensity})`,
            width: 2 + (colorIntensity * 3),
            length: 15 + (colorIntensity * 10)
        };
        
        // Draw main rivers/streams
        ctx.strokeStyle = `rgba(0, 102, 204, ${colorIntensity})`;
        ctx.lineWidth = 3;
        
        // Main river - direction based on flow direction
        const centerX = width / 2;
        const centerY = height / 2;
        const riverLength = Math.min(width, height) * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
            centerX - Math.cos(flowAngle) * riverLength / 2,
            centerY - Math.sin(flowAngle) * riverLength / 2
        );
        
        // Control points for bezier curve
        const cp1x = centerX - Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp1y = centerY - Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        const cp2x = centerX + Math.cos(flowAngle) * riverLength / 4 + Math.sin(flowAngle) * 30;
        const cp2y = centerY + Math.sin(flowAngle) * riverLength / 4 - Math.cos(flowAngle) * 30;
        
        ctx.bezierCurveTo(
            cp1x, cp1y,
            cp2x, cp2y,
            centerX + Math.cos(flowAngle) * riverLength / 2,
            centerY + Math.sin(flowAngle) * riverLength / 2
        );
        ctx.stroke();
    },
    
    drawTributary(ctx, x, y, width, length, dirX, dirY) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Create a curved tributary
        const endX = x + dirX * length;
        const endY = y + dirY * length;
        
        // Control point for curve
        const cpX = x + dirX * length * 0.5 + dirY * length * 0.3;
        const cpY = y + dirY * length * 0.5 - dirX * length * 0.3;
        
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.lineWidth = width;
        ctx.stroke();
    },
    
    createRiskZonesMap(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Create canvas for risk visualization
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Draw background
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Generate risk zones
        if (data) {
            this.drawRiskZones(ctx, canvas.width, canvas.height, data);
        } else {
            this.drawDefaultRiskZones(ctx, canvas.width, canvas.height);
        }
    },
    
    drawRiskZones(ctx, width, height, data) {
        // Extract risk data
        const floodRisk = data.drainage_analysis ? data.drainage_analysis.flood_risk : 'Medium';
        const erosionRisk = data.soil_stability ? data.soil_stability.erosion_risk : 'Medium';
        const landslideRisk = data.landslide_risk ? data.landslide_risk.susceptibility : 'Low';
        
        // Create risk zones
        this.drawRiskZone(ctx, width * 0.25, height * 0.5, 'Flood Risk', floodRisk, '#0066cc');
        this.drawRiskZone(ctx, width * 0.5, height * 0.5, 'Erosion Risk', erosionRisk, '#cc6600');
        this.drawRiskZone(ctx, width * 0.75, height * 0.5, 'Landslide Risk', landslideRisk, '#cc0000');
        
        // Add legend
        this.drawRiskLegend(ctx, width, height);
    },
    
    drawDefaultRiskZones(ctx, width, height) {
        // Create default risk zones
        this.drawRiskZone(ctx, width * 0.25, height * 0.5, 'Flood Risk', 'Medium', '#0066cc');
        this.drawRiskZone(ctx, width * 0.5, height * 0.5, 'Erosion Risk', 'Medium', '#cc6600');
        this.drawRiskZone(ctx, width * 0.75, height * 0.5, 'Landslide Risk', 'Low', '#cc0000');
        
        // Add legend
        this.drawRiskLegend(ctx, width, height);
    },
    
    drawRiskZone(ctx, x, y, riskType, riskLevel, color) {
        // Determine circle size based on risk level
        let radius = 40;
        let alpha = 0.3;
        
        if (riskLevel === 'High') {
            radius = 60;
            alpha = 0.7;
        } else if (riskLevel === 'Medium') {
            radius = 50;
            alpha = 0.5;
        }
        
        // Draw risk zone circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
        
        // Add border
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add risk label
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(riskType, x, y - 5);
        
        // Add risk level
        ctx.font = '12px Arial';
        ctx.fillText(riskLevel, x, y + 15);
    },
    
    drawRiskLegend(ctx, width, height) {
        const legendX = width * 0.1;
        const legendY = height * 0.85;
        const itemHeight = 20;
        
        // Draw legend background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(legendX - 10, legendY - 10, 150, 80);
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX - 10, legendY - 10, 150, 80);
        
        // Draw legend title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Risk Levels', legendX, legendY);
        
        // Draw legend items
        const levels = ['High', 'Medium', 'Low'];
        const colors = ['#ff0000', '#ff9900', '#ffcc00'];
        
        levels.forEach((level, i) => {
            const y = legendY + (i + 1) * itemHeight;
            
            // Draw color box
            ctx.fillStyle = colors[i];
            ctx.fillRect(legendX, y - 12, 12, 12);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.strokeRect(legendX, y - 12, 12, 12);
            
            // Draw text
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText(level, legendX + 20, y);
        });
    },
    
    create3DTerrainModel(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Add loading indicator
        const loadingElement = document.createElement('div');
        loadingElement.id = 'terrain-loading-status';
        loadingElement.className = 'flex items-center justify-center h-full flex-col';
        loadingElement.innerHTML = `
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div class="text-center text-lg">Loading Terrain Model...</div>
            <div class="text-center text-sm mt-2">Please wait while we process the terrain data</div>
        `;
        container.appendChild(loadingElement);
        
        // Create 3D scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, container.clientWidth / container.clientHeight, 0.1, 1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
        
        // Create terrain
        this.createTerrain(data);
        
        // Add elevation legend
        this.addElevationLegend(containerId);
        
        // Hide loading indicator
        loadingElement.style.display = 'none';
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.camera && this.renderer && container) {
                this.camera.aspect = container.clientWidth / container.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(container.clientWidth, container.clientHeight);
            }
        });
        
        // Start animation loop
        this.animate();
    },
    
    createTerrain(data) {
        // Remove existing terrain and related objects if any
        if (this.terrain) {
            this.scene.remove(this.terrain);
        }
        
        // Remove any existing water, markers, or other elements
        this.scene.children = this.scene.children.filter(child => 
            child instanceof THREE.Light || child instanceof THREE.Camera);
            
        // Add ambient and directional lights back if they were removed
        if (!this.scene.children.some(child => child instanceof THREE.AmbientLight)) {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
        }
        
        if (!this.scene.children.some(child => child instanceof THREE.DirectionalLight)) {
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 7.5);
            this.scene.add(directionalLight);
        }
        
        // Create geometry with higher resolution for better detail
        const geometry = new THREE.PlaneGeometry(10, 10, 100, 100);
        
        // Modify vertices to create terrain
        const vertices = geometry.attributes.position.array;
        const vertexColors = [];
        
        // Default terrain parameters
        let elevation = 1.0;
        let roughness = 1.0;
        let erosion = 0.5;
        let waterTableDepth = 7.9; // Default groundwater depth in meters
        
        // If we have data, use it to influence the terrain
        if (data) {
            if (data.elevation_analysis) {
                // Normalize elevation to a reasonable scale
                elevation = Math.min(3.0, data.elevation_analysis.elevation / 200);
                
                // Adjust roughness based on surface roughness
                if (data.elevation_analysis.surface_roughness === 'High') {
                    roughness = 2.0;
                } else if (data.elevation_analysis.surface_roughness === 'Low') {
                    roughness = 0.5;
                }
            }
            
            if (data.soil_stability && data.soil_stability.erosion_risk) {
                // Adjust erosion based on risk
                if (data.soil_stability.erosion_risk === 'High') {
                    erosion = 1.0;
                } else if (data.soil_stability.erosion_risk === 'Low') {
                    erosion = 0.2;
                }
            }
            
            // Get water table depth if available
            if (data.drainage_analysis && data.drainage_analysis.water_table_depth) {
                waterTableDepth = data.drainage_analysis.water_table_depth;
            }
        }
        
        // Track min and max heights for color mapping
        let minHeight = Infinity;
        let maxHeight = -Infinity;
        
        // First pass: calculate heights and find min/max
        const heights = [];
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Base height using improved noise function
            let height = this.improvedNoise(x * 0.1, z * 0.1) * elevation;
            
            // Add roughness
            height += this.improvedNoise(x * 0.5, z * 0.5) * roughness * 0.2;
            
            // Add erosion patterns
            if (this.improvedNoise(x * 0.3, z * 0.3) > 0.7) {
                height -= this.improvedNoise(x * 1.0, z * 1.0) * erosion * 0.5;
            }
            
            // Store height for later use
            heights.push(height);
            
            // Update min/max
            minHeight = Math.min(minHeight, height);
            maxHeight = Math.max(maxHeight, height);
            
            // Set the y-coordinate (height)
            vertices[i + 1] = height;
        }
        
        // Second pass: assign colors based on height
        let heightIndex = 0;
        for (let i = 0; i < vertices.length; i += 3) {
            const height = heights[heightIndex++];
            
            // Normalize height to 0-1 range
            const normalizedHeight = (height - minHeight) / (maxHeight - minHeight || 1);
            
            // Color based on elevation zones
            let color;
            if (normalizedHeight < 0.33) {
                // Low elevation - green
                color = new THREE.Color(0x2E7D32); // Dark green
            } else if (normalizedHeight < 0.66) {
                // Medium elevation - yellow/brown
                color = new THREE.Color(0xD4AC0D); // Gold
            } else {
                // High elevation - gray/white
                color = new THREE.Color(0xE0E0E0); // Light gray
            }
            
            // Add color to array (3 times for RGB)
            vertexColors.push(color.r, color.g, color.b);
        }
        
        // Update geometry
        geometry.computeVertexNormals();
        
        // Add colors to geometry
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
        
        // Create material with vertex colors
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.2,
            flatShading: true
        });
        
        // Create mesh
        this.terrain = new THREE.Mesh(geometry, material);
        
        // Rotate to horizontal
        this.terrain.rotation.x = -Math.PI / 2;
        
        // Center in scene
        this.terrain.position.set(0, -1, 0);
        
        // Add to scene
        this.scene.add(this.terrain);
        
        // Add water visualization
        this.addWater(data);
        
        // Add groundwater depth indicator
        this.addGroundwaterDepthIndicator(waterTableDepth);
        
        // Add risk zone indicators if available
        if (data && data.landslide_risk) {
            this.addRiskZoneIndicators(data);
        }
    },
    
    addWater(data) {
        // Determine water level based on flood risk
        let waterLevel = -0.9; // Default water level
        let waterOpacity = 0.5; // Default opacity
        
        if (data && data.drainage_analysis) {
            if (data.drainage_analysis.flood_risk === 'High') {
                waterLevel = -0.6;
                waterOpacity = 0.7;
            } else if (data.drainage_analysis.flood_risk === 'Medium') {
                waterLevel = -0.75;
                waterOpacity = 0.6;
            } else if (data.drainage_analysis.flood_risk === 'Low') {
                waterLevel = -0.9;
                waterOpacity = 0.4;
            }
        }
        
        // Create water plane
        const waterGeometry = new THREE.PlaneGeometry(12, 12, 20, 20);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x0077be,
            transparent: true,
            opacity: waterOpacity,
            roughness: 0.1,
            metalness: 0.8
        });
        
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = waterLevel;
        
        // Animate water
        const waterVertices = waterGeometry.attributes.position.array;
        const waterAnimation = () => {
            const time = Date.now() * 0.001;
            for (let i = 0; i < waterVertices.length; i += 3) {
                const x = waterVertices[i];
                const z = waterVertices[i + 2];
                waterVertices[i + 1] = Math.sin(x * 0.5 + time) * 0.05 + Math.sin(z * 0.5 + time) * 0.05;
            }
            waterGeometry.attributes.position.needsUpdate = true;
            requestAnimationFrame(waterAnimation);
        };
        
        // Start water animation
        waterAnimation();
        
        this.scene.add(water);
    },
    
    improvedNoise(x, y) {
        // Improved pseudo-random noise function with multiple octaves
        // In a production environment, you'd use a proper noise library like SimplexNoise
        let noise = 0;
        let amplitude = 1.0;
        let frequency = 1.0;
        let maxValue = 0;
        
        // Add multiple octaves of noise for more natural terrain
        for (let i = 0; i < 4; i++) {
            noise += amplitude * Math.sin(x * frequency * 10 + y * frequency * 5) * 0.5;
            noise += amplitude * Math.cos(x * frequency * 5 - y * frequency * 10) * 0.5;
            
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2.0;
        }
        
        // Normalize to -1 to 1 range
        return noise / maxValue;
    },
    
    addGroundwaterDepthIndicator(depth) {
        // Create a vertical indicator showing groundwater depth
        const indicatorGeometry = new THREE.BoxGeometry(0.1, depth * 0.3, 0.1);
        const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0x03a9f4 });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        
        // Position at the side of the terrain
        indicator.position.set(4, depth * 0.15 - 1, 0);
        
        // Add to scene
        this.scene.add(indicator);
        
        // Add depth label
        const textGeometry = new THREE.TextGeometry(`${depth}m`, {
            font: new THREE.Font(),
            size: 0.3,
            height: 0.05
        });
        
        // Since TextGeometry requires a font that needs to be loaded,
        // we'll create a simple plane with a label instead
        const labelGeometry = new THREE.PlaneGeometry(1, 0.5);
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 128, 64);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${depth}m`, 64, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });
        
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(4, depth * 0.3, 0);
        label.rotation.y = -Math.PI / 4;
        
        this.scene.add(label);
        
        // Add a title for the indicator
        const titleCanvas = document.createElement('canvas');
        titleCanvas.width = 256;
        titleCanvas.height = 64;
        const titleCtx = titleCanvas.getContext('2d');
        titleCtx.fillStyle = '#ffffff';
        titleCtx.fillRect(0, 0, 256, 64);
        titleCtx.fillStyle = '#000000';
        titleCtx.font = 'bold 20px Arial';
        titleCtx.textAlign = 'center';
        titleCtx.textBaseline = 'middle';
        titleCtx.fillText('Groundwater Depth', 128, 32);
        
        const titleTexture = new THREE.CanvasTexture(titleCanvas);
        const titleMaterial = new THREE.MeshBasicMaterial({
            map: titleTexture,
            transparent: true
        });
        
        const title = new THREE.Mesh(labelGeometry, titleMaterial);
        title.position.set(4, depth * 0.3 + 0.7, 0);
        title.rotation.y = -Math.PI / 4;
        
        this.scene.add(title);
    },
    
    addRiskZoneIndicators(data) {
        if (!data.landslide_risk) return;
        
        const susceptibility = data.landslide_risk.susceptibility || 'Medium';
        let color;
        
        switch (susceptibility) {
            case 'High':
                color = 0xff0000; // Red
                break;
            case 'Medium':
                color = 0xff9900; // Orange
                break;
            case 'Low':
                color = 0xffcc00; // Yellow
                break;
            default:
                color = 0xff9900; // Default to orange
        }
        
        // Add risk zone indicator on the terrain
        const riskGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
        const riskMaterial = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.7
        });
        
        const riskZone = new THREE.Mesh(riskGeometry, riskMaterial);
        riskZone.position.set(-2, 0, -2);
        riskZone.rotation.x = Math.PI / 2;
        
        this.scene.add(riskZone);
        
        // Add risk label
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 256;
        labelCanvas.height = 64;
        const ctx = labelCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Landslide: ${susceptibility}`, 128, 32);
        
        const texture = new THREE.CanvasTexture(labelCanvas);
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });
        
        const labelGeometry = new THREE.PlaneGeometry(1.5, 0.5);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(-2, 0.5, -2);
        label.rotation.x = -Math.PI / 2;
        
        this.scene.add(label);
    },
    
    addElevationLegend(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Check if legend already exists
        if (container.querySelector('.elevation-legend')) return;
        
        // Create legend container
        const legend = document.createElement('div');
        legend.className = 'elevation-legend';
        legend.style.position = 'absolute';
        legend.style.bottom = '10px';
        legend.style.right = '10px';
        legend.style.background = 'rgba(255, 255, 255, 0.8)';
        legend.style.padding = '10px';
        legend.style.borderRadius = '5px';
        legend.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.2)';
        legend.style.zIndex = '1000';
        
        // Add legend title
        const title = document.createElement('div');
        title.textContent = 'Elevation Zones';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '5px';
        legend.appendChild(title);
        
        // Add legend items
        const items = [
            { color: '#E0E0E0', label: 'High Elevation' },
            { color: '#D4AC0D', label: 'Medium Elevation' },
            { color: '#2E7D32', label: 'Low Elevation' }
        ];
        
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.display = 'flex';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.marginBottom = '5px';
            
            const colorBox = document.createElement('div');
            colorBox.style.width = '20px';
            colorBox.style.height = '20px';
            colorBox.style.backgroundColor = item.color;
            colorBox.style.marginRight = '5px';
            colorBox.style.border = '1px solid #333';
            
            const label = document.createElement('div');
            label.textContent = item.label;
            
            itemDiv.appendChild(colorBox);
            itemDiv.appendChild(label);
            legend.appendChild(itemDiv);
        });
        
        container.appendChild(legend);
    },
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate terrain if enabled
        if (this.isRotating && this.terrain) {
            this.terrain.rotation.z += this.rotationSpeed;
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    },
    
    update3DTerrainModel(containerId, data) {
        // Check if we already have a 3D scene
        if (this.scene && this.camera && this.renderer) {
            // Just update the terrain with new data
            this.createTerrain(data);
            
            // Update loading status
            const loadingElement = document.getElementById('terrain-loading-status');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            // Add elevation legend if it doesn't exist
            this.addElevationLegend(containerId);
        } else {
            // Create new 3D scene
            this.create3DTerrainModel(containerId, data);
        }
    }
};

// Initialize the terrain visualization module when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    TerrainVisualization.initialize();
});
