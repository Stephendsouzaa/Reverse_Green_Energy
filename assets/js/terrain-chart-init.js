/**
 * Terrain Chart Initialization
 * This script ensures that all terrain analysis charts are properly initialized
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Terrain chart initialization script loaded');
    
    // Function to initialize all terrain analysis charts
    function initializeTerrainCharts() {
        console.log('Initializing terrain charts');
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded. Please check the script inclusion.');
            return;
        }
        
        // List of chart canvas IDs to initialize
        const chartCanvasIds = [
            'elevationProfileChart',
            'soilCompositionChart',
            'drainagePatternChart',
            'riskAssessmentChart'
        ];
        
        // Check if each canvas exists and initialize if not already initialized
        chartCanvasIds.forEach(id => {
            const canvas = document.getElementById(id);
            if (!canvas) {
                console.warn(`Canvas element with ID '${id}' not found`);
                return;
            }
            
            console.log(`Initializing chart: ${id}`);
            
            // Check if chart is already initialized
            if (Chart.getChart(id)) {
                console.log(`Chart ${id} is already initialized`);
                return;
            }
            
            // Initialize chart based on its type
            switch(id) {
                case 'elevationProfileChart':
                    // Get actual elevation from UI if available
                    let actualElevation = 244.6; // Default value
                    const elevationElement = document.getElementById('elevation');
                    if (elevationElement && elevationElement.textContent) {
                        const elevationMatch = elevationElement.textContent.match(/([\d.]+)m/);
                        if (elevationMatch) {
                            actualElevation = parseFloat(elevationMatch[1]);
                        }
                    }
                    
                    // Generate dynamic elevation profile based on actual elevation
                    const elevationProfile = generateDynamicElevationProfile(actualElevation);
                    
                    // Generate distance labels based on the number of points
                    const distanceLabels = Array.from({length: elevationProfile.length}, (_, i) => 
                        `${Math.round(i * (500 / (elevationProfile.length - 1)))}m`);
                    
                    new Chart(canvas.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: distanceLabels,
                            datasets: [{
                                label: 'Elevation Profile',
                                data: elevationProfile,
                                borderColor: '#4299e1',
                                fill: true,
                                backgroundColor: 'rgba(66, 153, 225, 0.2)',
                                tension: 0.4
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: `Terrain Elevation Profile (Base: ${actualElevation.toFixed(1)}m)`,
                                    color: '#2d3748'
                                }
                            },
                            scales: {
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Elevation (m)'
                                    },
                                    // Set a more appropriate y-axis range based on the data
                                    min: Math.min(...elevationProfile) - 5,
                                    max: Math.max(...elevationProfile) + 5
                                }
                            }
                        }
                    });
                    break;
                    
                case 'soilCompositionChart':
                    new Chart(canvas.getContext('2d'), {
                        type: 'pie',
                        data: {
                            labels: ['Sand', 'Silt', 'Clay', 'Organic Matter'],
                            datasets: [{
                                data: [45, 30, 15, 10],
                                backgroundColor: [
                                    '#fbd38d',
                                    '#9f7aea',
                                    '#f56565',
                                    '#48bb78'
                                ]
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Soil Composition',
                                    color: '#2d3748'
                                }
                            }
                        }
                    });
                    break;
                    
                case 'drainagePatternChart':
                    new Chart(canvas.getContext('2d'), {
                        type: 'radar',
                        data: {
                            labels: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
                            datasets: [{
                                label: 'Flow Direction',
                                data: [5, 7, 9, 6, 4, 8, 7, 5],
                                borderColor: '#60A5FA',
                                backgroundColor: 'rgba(96, 165, 250, 0.2)'
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Drainage Pattern',
                                    color: '#2d3748'
                                },
                                legend: {
                                    display: false
                                }
                            }
                        }
                    });
                    break;
                    
                case 'riskAssessmentChart':
                    new Chart(canvas.getContext('2d'), {
                        type: 'bar',
                        data: {
                            labels: ['Erosion', 'Flooding', 'Landslide', 'Seismic'],
                            datasets: [{
                                label: 'Risk Level',
                                data: [35, 45, 25, 60],
                                backgroundColor: [
                                    'rgba(246, 173, 85, 0.7)',
                                    'rgba(245, 101, 101, 0.7)',
                                    'rgba(66, 153, 225, 0.7)',
                                    'rgba(72, 187, 120, 0.7)'
                                ]
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 100,
                                    title: {
                                        display: true,
                                        text: 'Risk Level (%)'
                                    }
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Risk Assessment',
                                    color: '#2d3748'
                                }
                            }
                        }
                    });
                    break;
            }
        });
    }
    
    // Helper function to generate dynamic elevation profile based on real elevation data
    function generateDynamicElevationProfile(baseElevation) {
        // Number of points to generate in the elevation profile
        const numPoints = 6;
        
        // If we have a valid base elevation, use it to generate a realistic profile
        if (typeof baseElevation === 'number') {
            // Create an array to hold our elevation points
            const elevationPoints = [];
            
            // Generate elevation points with realistic variations
            for (let i = 0; i < numPoints; i++) {
                // Calculate how far this point is from the center (0 to 1 scale)
                const distanceFromCenter = Math.abs((i / (numPoints - 1)) - 0.5) * 2;
                
                // Create terrain features with natural variations
                // Use sine waves with different frequencies to create natural-looking terrain
                const terrainFeature = Math.sin(i * 1.5) * 3 * (1 - distanceFromCenter);
                
                // Add small random variations (±1.5m) for realistic micro-terrain
                const microTerrain = (Math.random() - 0.5) * 3;
                
                // Calculate the elevation at this point
                const pointElevation = baseElevation + terrainFeature + microTerrain;
                
                // Round to 1 decimal place for clean display
                elevationPoints.push(parseFloat(pointElevation.toFixed(1)));
            }
            
            return elevationPoints;
        }
        
        // Fallback if no valid base elevation is provided
        return [baseElevation-2, baseElevation-1, baseElevation, baseElevation+1, baseElevation+2, baseElevation+1];
    }
    
    // Call the initialization function
    initializeTerrainCharts();
    
    // Also initialize charts when the terrain tab is clicked
    const terrainTab = document.querySelector('[data-tab="terrain"]');
    if (terrainTab) {
        terrainTab.addEventListener('click', function() {
            // Small delay to ensure DOM is ready
            setTimeout(initializeTerrainCharts, 100);
        });
    }
});