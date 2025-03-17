// Real-time Data Updater for Site Selection Charts

class SiteSelectionRealTimeUpdater {
    constructor() {
        this.updateInterval = 5000; // Update every 5 seconds
        this.isUpdating = false;
        this.updateTimerId = null;
        this.dataService = null;
        this.siteCharts = null;
        this.currentLocation = {
            latitude: null,
            longitude: null,
            siteType: 'solar'
        };
        this.loadingIndicators = [];
    }

    initialize(dataService, siteCharts) {
        this.dataService = dataService;
        this.siteCharts = siteCharts;
        this.createLoadingIndicators();
        console.log('Real-time updater initialized');
    }

    createLoadingIndicators() {
        // Create loading indicators for each chart container
        const chartContainers = document.querySelectorAll('.chart-container, .bg-white.p-4.rounded-lg');
        
        chartContainers.forEach(container => {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = `
                <div class="spinner"></div>
                <div class="update-text">Updating data...</div>
            `;
            loadingIndicator.style.display = 'none';
            loadingIndicator.style.position = 'absolute';
            loadingIndicator.style.top = '50%';
            loadingIndicator.style.left = '50%';
            loadingIndicator.style.transform = 'translate(-50%, -50%)';
            loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            loadingIndicator.style.color = 'white';
            loadingIndicator.style.padding = '15px';
            loadingIndicator.style.borderRadius = '8px';
            loadingIndicator.style.zIndex = '10';
            loadingIndicator.style.textAlign = 'center';
            
            // Add spinner styles
            const style = document.createElement('style');
            style.textContent = `
                .spinner {
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top: 4px solid #3B82F6;
                    width: 30px;
                    height: 30px;
                    margin: 0 auto 10px auto;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .update-text {
                    font-size: 14px;
                }
            `;
            document.head.appendChild(style);
            
            // Make container position relative if it's not already
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
            
            container.appendChild(loadingIndicator);
            this.loadingIndicators.push(loadingIndicator);
        });
    }

    showLoadingIndicators() {
        this.loadingIndicators.forEach(indicator => {
            indicator.style.display = 'block';
        });
    }

    hideLoadingIndicators() {
        this.loadingIndicators.forEach(indicator => {
            indicator.style.display = 'none';
        });
    }

    startUpdating(latitude, longitude, siteType) {
        // Save current location and site type
        this.currentLocation = {
            latitude,
            longitude,
            siteType
        };

        // Stop any existing updates
        this.stopUpdating();

        // Start new update cycle
        this.isUpdating = true;
        this.updateData();
        this.updateTimerId = setInterval(() => this.updateData(), this.updateInterval);
        
        console.log(`Started real-time updates for location: ${latitude}, ${longitude}, type: ${siteType}`);
    }

    stopUpdating() {
        if (this.updateTimerId) {
            clearInterval(this.updateTimerId);
            this.updateTimerId = null;
        }
        this.isUpdating = false;
        this.hideLoadingIndicators();
    }

    async updateData() {
        if (!this.isUpdating || !this.dataService || !this.siteCharts) return;
        if (!this.currentLocation.latitude || !this.currentLocation.longitude) return;

        try {
            // Show loading indicators
            this.showLoadingIndicators();

            // Fetch updated data
            const updatedData = await this.dataService.fetchSiteSuitabilityData(
                this.currentLocation.latitude,
                this.currentLocation.longitude,
                this.currentLocation.siteType
            );

            // Add small random variations to simulate real-time changes
            const randomizedData = this.addRandomVariations(updatedData);

            // Update charts with new data
            this.siteCharts.updateCharts(randomizedData);

            // Update stat cards with new values
            this.updateStatCards(randomizedData);

            console.log('Charts updated with real-time data');
        } catch (error) {
            console.error('Error updating real-time data:', error);
        } finally {
            // Hide loading indicators after a short delay to ensure they're visible
            setTimeout(() => this.hideLoadingIndicators(), 500);
        }
    }

    addRandomVariations(data) {
        // Create a copy of the data to avoid modifying the original
        const result = JSON.parse(JSON.stringify(data));

        // Add small random variations to simulate real-time changes
        const addVariation = (value) => {
            const variation = (Math.random() * 4) - 2; // Random value between -2 and 2
            return Math.min(100, Math.max(0, value + variation)); // Keep within 0-100 range
        };

        // Add variations to main metrics
        result.solarPotential = Math.round(addVariation(result.solarPotential));
        result.landSuitability = Math.round(addVariation(result.landSuitability));
        result.gridInfrastructure = Math.round(addVariation(result.gridInfrastructure));
        result.environmentalImpact = Math.round(addVariation(result.environmentalImpact));
        result.financialViability = Math.round(addVariation(result.financialViability));

        // Add variations to environmental data
        result.environmentalData.carbonOffset = Math.round(addVariation(result.environmentalData.carbonOffset));
        result.environmentalData.landUse = Math.round(addVariation(result.environmentalData.landUse));
        result.environmentalData.wildlifeImpact = Math.round(addVariation(result.environmentalData.wildlifeImpact));
        result.environmentalData.waterResources = Math.round(addVariation(result.environmentalData.waterResources));

        // Add variations to financial data
        result.financialData.yearlyROI = result.financialData.yearlyROI.map(value => 
            Math.round(value * (1 + (Math.random() * 0.04) - 0.02)) // ±2% variation
        );

        // Add variations to implementation phases
        const totalPhases = result.implementationData.phases.reduce((sum, val) => sum + val, 0);
        result.implementationData.phases = result.implementationData.phases.map(value => {
            const newValue = Math.round(value * (1 + (Math.random() * 0.06) - 0.03)); // ±3% variation
            return newValue;
        });
        
        // Ensure phases still add up to 100%
        const newTotal = result.implementationData.phases.reduce((sum, val) => sum + val, 0);
        if (newTotal !== totalPhases) {
            // Adjust the largest phase to maintain the total
            const largestIndex = result.implementationData.phases.indexOf(Math.max(...result.implementationData.phases));
            result.implementationData.phases[largestIndex] += (totalPhases - newTotal);
        }

        return result;
    }

    updateStatCards(data) {
        // Update stat cards in the results section with new data
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length === 0) return;

        // Update Solar Irradiance
        this.updateStatCardValue(statCards[0], `${(5.5 + Math.random() * 0.6).toFixed(1)} kWh/m²/day`);
        
        // Update Average Temperature
        this.updateStatCardValue(statCards[1], `${Math.round(24 + Math.random() * 2)}°C`);
        
        // Update Estimated ROI
        this.updateStatCardValue(statCards[2], `${(15 + Math.random() * 1).toFixed(1)}%`);
        
        // Update Payback Period
        this.updateStatCardValue(statCards[3], `${(6 + Math.random() * 0.4).toFixed(1)} years`);
        
        // Update CO2 Reduction
        this.updateStatCardValue(statCards[4], `${Math.round(12400 + Math.random() * 200)} tons/year`);
        
        // Update Land Usage
        this.updateStatCardValue(statCards[5], `${Math.round(44 + Math.random() * 2)} acres`);
        
        // Update Grid Capacity
        this.updateStatCardValue(statCards[6], `${Math.round(24 + Math.random() * 2)} MW`);
        
        // Update Distance to Substation
        this.updateStatCardValue(statCards[7], `${(2.4 + Math.random() * 0.2).toFixed(1)} km`);
    }

    updateStatCardValue(card, newValue) {
        if (!card) return;
        const valueElement = card.querySelector('p:nth-child(2)');
        if (valueElement) {
            valueElement.textContent = newValue;
            
            // Add a subtle highlight effect
            valueElement.style.transition = 'background-color 0.5s';
            valueElement.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            setTimeout(() => {
                valueElement.style.backgroundColor = 'transparent';
            }, 500);
        }
    }
}

// Initialize and export the updater
const realTimeUpdater = new SiteSelectionRealTimeUpdater();

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we have the required dependencies
    if (window.RealTimeDataService && window.SiteSelectionCharts) {
        realTimeUpdater.initialize(
            new RealTimeDataService(),
            new SiteSelectionCharts()
        );
        console.log('Real-time updater ready');
    } else {
        console.error('Required dependencies not found for real-time updater');
    }
});

// Make the updater globally available
window.realTimeUpdater = realTimeUpdater;