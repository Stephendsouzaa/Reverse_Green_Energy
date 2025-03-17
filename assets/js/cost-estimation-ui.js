// Cost Estimation UI Integration with Real-time Data

// Import the real-time data service
import costEstimationRealTimeService from './cost-estimation-realtime.js';

class CostEstimationUI {
    constructor() {
        this.map = null;
        this.selectedLocation = null;
        this.locationMarker = null;
        this.charts = {};
        this.dataService = costEstimationRealTimeService;
        this.isLoading = false;
    }

    /**
     * Initialize the UI components
     */
    async init() {
        // Initialize map
        this.initMap();
        
        // Initialize form handlers
        this.initFormHandlers();
        
        // Try to get user's location
        this.getUserLocation();
        
        // Initialize loading indicator
        this.initLoadingIndicator();
        
        console.log('Cost Estimation UI initialized');
    }

    /**
     * Initialize the map component
     */
    initMap() {
        // Initialize Leaflet map
        this.map = L.map('global-map').setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add click handler to map
        this.map.on('click', async (e) => {
            this.setSelectedLocation(e.latlng);
        });
    }

    /**
     * Initialize form handlers
     */
    initFormHandlers() {
        const form = document.getElementById('cost-estimation-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.selectedLocation) {
                this.showNotification('Please select a location on the map.', 'error');
                return;
            }

            await this.calculateAndDisplayResults();
        });

        // Add event listeners for form fields to enable real-time updates
        const systemTypeSelect = document.getElementById('system-type');
        const systemSizeInput = document.getElementById('system-size');
        const electricityRateInput = document.getElementById('electricity-rate');

        if (systemTypeSelect) {
            systemTypeSelect.addEventListener('change', () => {
                if (this.selectedLocation) {
                    this.calculateAndDisplayResults();
                }
            });
        }

        // Add input event listeners with debounce for numeric inputs
        if (systemSizeInput) {
            this.addDebouncedInputListener(systemSizeInput, () => {
                if (this.selectedLocation) {
                    this.calculateAndDisplayResults();
                }
            });
        }

        if (electricityRateInput) {
            this.addDebouncedInputListener(electricityRateInput, () => {
                if (this.selectedLocation) {
                    this.calculateAndDisplayResults();
                }
            });
        }
    }

    /**
     * Add debounced input listener to avoid excessive calculations
     * @param {HTMLElement} element - Input element
     * @param {Function} callback - Callback function
     */
    addDebouncedInputListener(element, callback) {
        let timeout;
        element.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                callback();
            }, 500); // 500ms debounce
        });
    }

    /**
     * Initialize loading indicator
     */
    initLoadingIndicator() {
        // Create loading indicator element if it doesn't exist
        if (!document.getElementById('loading-indicator')) {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loading-indicator';
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = `
                <div class="spinner"></div>
                <p>Loading real-time data...</p>
            `;
            document.body.appendChild(loadingIndicator);

            // Add CSS for loading indicator
            const style = document.createElement('style');
            style.textContent = `
                .loading-indicator {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 9999;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    color: white;
                }
                .loading-indicator.show {
                    display: flex;
                }
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: #4fd1c5;
                    animation: spin 1s ease-in-out infinite;
                    margin-bottom: 20px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show or hide loading indicator
     * @param {boolean} show - Whether to show or hide
     */
    showLoading(show) {
        this.isLoading = show;
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            if (show) {
                loadingIndicator.classList.add('show');
            } else {
                loadingIndicator.classList.remove('show');
            }
        }
    }

    /**
     * Show notification message
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        if (!document.getElementById('notification')) {
            const notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);

            // Add CSS for notification
            const style = document.createElement('style');
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: bold;
                    z-index: 9999;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: opacity 0.3s, transform 0.3s;
                    max-width: 300px;
                }
                .notification.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                .notification.success {
                    background-color: #4fd1c5;
                }
                .notification.error {
                    background-color: #f56565;
                }
                .notification.info {
                    background-color: #4299e1;
                }
            `;
            document.head.appendChild(style);
        }

        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    /**
     * Get user's location and center map
     */
    async getUserLocation() {
        try {
            this.showLoading(true);
            const location = await this.dataService.getUserLocation();
            
            // Center map on user's location
            this.map.setView([location.lat, location.lng], 6);
            
            // Set as selected location
            this.setSelectedLocation(location);
            
            this.showLoading(false);
            this.showNotification('Located you automatically!', 'success');
        } catch (error) {
            console.error('Error getting user location:', error);
            this.showLoading(false);
        }
    }

    /**
     * Set the selected location on the map
     * @param {Object} latlng - Latitude and longitude object
     */
    setSelectedLocation(latlng) {
        this.selectedLocation = latlng;
        
        // Update location display
        const locationDisplay = document.getElementById('selected-location');
        if (locationDisplay) {
            locationDisplay.textContent = `Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`;
        }
        
        // Update marker on map
        if (this.locationMarker) {
            this.map.removeLayer(this.locationMarker);
        }
        
        this.locationMarker = L.marker(latlng).addTo(this.map);
        this.locationMarker.bindPopup('Selected Location').openPopup();
    }

    /**
     * Calculate and display results based on form inputs and selected location
     */
    async calculateAndDisplayResults() {
        if (!this.selectedLocation) {
            this.showNotification('Please select a location on the map.', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // Get form values
            const systemType = document.getElementById('system-type').value;
            const systemSize = parseFloat(document.getElementById('system-size').value);
            const electricityRate = parseFloat(document.getElementById('electricity-rate').value);
            const financingMethod = document.getElementById('financing-method').value;
            
            // Fetch real-time data
            const locationInfo = await this.dataService.getLocationInfo(this.selectedLocation);
            const energyPricing = await this.dataService.getEnergyPricingData(locationInfo);
            const renewableData = await this.dataService.getRenewableEnergyData(this.selectedLocation);
            const carbonData = await this.dataService.getCarbonEmissionData(locationInfo.countryCode);
            
            // Calculate financial metrics
            const financialMetrics = this.dataService.calculateFinancialMetrics({
                systemType,
                systemSize,
                electricityRate,
                financingMethod,
                countryData: {
                    country: locationInfo.country,
                    ...energyPricing
                },
                renewableData: {
                    ...renewableData,
                    latitude: this.selectedLocation.lat
                }
            });
            
            // Display results
            this.displayResults({
                locationInfo,
                renewableData,
                financialMetrics,
                carbonData,
                systemType,
                systemSize
            });
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error calculating results:', error);
            this.showLoading(false);
            this.showNotification('Error calculating results. Please try again.', 'error');
        }
    }

    /**
     * Display results in the UI
     * @param {Object} data - Results data
     */
    displayResults(data) {
        const {
            locationInfo,
            renewableData,
            financialMetrics,
            carbonData,
            systemType,
            systemSize
        } = data;
        
        // Show results container
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) {
            resultsContainer.classList.remove('hidden');
        }
        
        // Update results content
        const resultsContent = document.getElementById('results-content');
        if (resultsContent) {
            resultsContent.innerHTML = `
                <div class="grid grid-cols-2 my-4">
                    <div>
                        <h4>System & Cost Details:</h4>
                        <p><strong>System Type:</strong> ${systemType.charAt(0).toUpperCase() + systemType.slice(1)}</p>
                        <p><strong>System Size:</strong> ${systemSize} kW</p>
                        <p><strong>Country:</strong> ${locationInfo.country}</p>
                        <p><strong>City:</strong> ${locationInfo.city || 'Unknown'}</p>
                        <p><strong>Installation Cost:</strong> $${Math.round(financialMetrics.installationCost).toLocaleString()}</p>
                        <p><strong>Net Installation Cost:</strong> $${Math.round(financialMetrics.netInstallationCost).toLocaleString()}</p>
                        <p><strong>Annual O&M Cost:</strong> $${Math.round(financialMetrics.annualOMCost).toLocaleString()}</p>
                        <p><strong>Incentives & Tax Benefits:</strong> $${Math.round(financialMetrics.incentives).toLocaleString()}</p>
                        <p><strong>Estimated Equipment Lifetime:</strong> 25 years</p>
                    </div>
                    <div>
                        <h4>Financial Analysis:</h4>
                        <p><strong>Annual Energy Production:</strong> ${Math.round(financialMetrics.annualProduction).toLocaleString()} kWh</p>
                        <p><strong>Annual Savings:</strong> $${Math.round(financialMetrics.annualSavings).toLocaleString()}</p>
                        <p><strong>Simple Payback Period:</strong> ${financialMetrics.simplePayback.toFixed(1)} years</p>
                        <p><strong>Return on Investment (ROI):</strong> ${financialMetrics.roi.toFixed(2)}%</p>
                        <p><strong>Levelized Cost of Energy (LCOE):</strong> $${financialMetrics.lcoe.toFixed(3)}/kWh</p>
                        <p><strong>25-Year Savings:</strong> $${Math.round(financialMetrics.lifetimeSavings).toLocaleString()}</p>
                        <p><strong>Carbon Offset:</strong> ${Math.round(financialMetrics.carbonOffset)} kg CO2/year</p>
                        <p><strong>Grid Emission Factor:</strong> ${carbonData.gridEmissionFactor.toFixed(2)} kg CO2/kWh</p>
                    </div>
                </div>
                <div class="my-4">
                    <h4>Location-Specific Data</h4>
                    <p><strong>Solar Irradiance:</strong> ${renewableData.solarIrradiance.toFixed(2)} kWh/m²/day</p>
                    <p><strong>Wind Speed:</strong> ${renewableData.windSpeed.toFixed(2)} m/s</p>
                    <p><strong>Temperature:</strong> ${renewableData.temperature.toFixed(1)}°C</p>
                    <p><strong>Cloud Cover:</strong> ${renewableData.cloudCover}%</p>
                </div>
                <div class="my-4">
                    <h4>Comparative Analysis</h4>
                    <canvas id="costComparisonChart" width="400" height="200"></canvas>
                </div>
                <div class="my-4">
                    <h4>Monthly Savings Projection</h4>
                    <canvas id="savingsProjectionChart" width="400" height="200"></canvas>
                </div>
            `;
            
            // Create charts
            this.createCharts(financialMetrics);
        }
    }

    /**
     * Create charts for data visualization
     * @param {Object} financialMetrics - Financial metrics data
     */
    createCharts(financialMetrics) {
        // Destroy existing charts to prevent duplicates
        if (this.charts.costComparison) {
            this.charts.costComparison.destroy();
        }
        if (this.charts.savingsProjection) {
            this.charts.savingsProjection.destroy();
        }
        
        // Create cost comparison chart
        const costCtx = document.getElementById('costComparisonChart');
        if (costCtx) {
            this.charts.costComparison = new Chart(costCtx, {
                type: 'bar',
                data: {
                    labels: financialMetrics.comparativeCosts.labels,
                    datasets: [{
                        label: 'Cost Comparison ($)',
                        data: financialMetrics.comparativeCosts.data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(255, 159, 64, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#e2e8f0'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `$${context.raw.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#e2e8f0',
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#e2e8f0'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        }
        
        // Create monthly savings projection chart
        const savingsCtx = document.getElementById('savingsProjectionChart');
        if (savingsCtx) {
            const monthlyData = financialMetrics.monthlySavings;
            this.charts.savingsProjection = new Chart(savingsCtx, {
                type: 'line',
                data: {
                    labels: monthlyData.map(item => item.month),
                    datasets: [{
                        label: 'Monthly Savings ($)',
                        data: monthlyData.map(item => item.savings),
                        backgroundColor: 'rgba(79, 209, 197, 0.2)',
                        borderColor: 'rgba(79, 209, 197, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#e2e8f0'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `$${context.raw.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#e2e8f0',
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#e2e8f0'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        }
    }
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const costEstimationUI = new CostEstimationUI();
    costEstimationUI.init();
});