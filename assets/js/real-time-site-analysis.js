// Real-time Site Analysis Handler
import siteAnalysis from './site-analysis-data.js';

class RealTimeSiteAnalysis {
    constructor() {
        this.currentLocation = null;
        this.updateInterval = 5000; // 5 seconds
        this.charts = {};
        this.initializeCharts();
    }

    async initializeCharts() {
        // Initialize Chart.js charts for various metrics
        this.charts.solar = new Chart(document.getElementById('solar-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Solar Irradiance (W/m²)',
                    data: [],
                    borderColor: '#f59e0b',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                animation: false
            }
        });

        this.charts.wind = new Chart(document.getElementById('wind-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Wind Speed (m/s)',
                    data: [],
                    borderColor: '#3b82f6',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                animation: false
            }
        });
    }

    async startAnalysis(latitude, longitude) {
        this.currentLocation = { latitude, longitude };
        await this.updateAnalysis();
        this.startRealTimeUpdates();
    }

    async updateAnalysis() {
        if (!this.currentLocation) return;

        const { latitude, longitude } = this.currentLocation;

        // Fetch all data concurrently
        await Promise.all([
            siteAnalysis.fetchTerrainData(latitude, longitude),
            siteAnalysis.fetchSolarData(latitude, longitude),
            siteAnalysis.fetchWindData(latitude, longitude),
            siteAnalysis.fetchEnvironmentalData(latitude, longitude)
        ]);

        // Update charts with new data
        this.updateCharts();

        // Generate and update recommendations
        this.updateRecommendations();
    }

    startRealTimeUpdates() {
        setInterval(() => this.updateAnalysis(), this.updateInterval);
    }

    updateCharts() {
        const timestamp = new Date().toLocaleTimeString();

        // Update solar chart
        this.charts.solar.data.labels.push(timestamp);
        this.charts.solar.data.datasets[0].data.push(siteAnalysis.solarData.irradiance);
        if (this.charts.solar.data.labels.length > 20) {
            this.charts.solar.data.labels.shift();
            this.charts.solar.data.datasets[0].data.shift();
        }
        this.charts.solar.update();

        // Update wind chart
        this.charts.wind.data.labels.push(timestamp);
        this.charts.wind.data.datasets[0].data.push(siteAnalysis.windData.speed);
        if (this.charts.wind.data.labels.length > 20) {
            this.charts.wind.data.labels.shift();
            this.charts.wind.data.datasets[0].data.shift();
        }
        this.charts.wind.update();
    }

    updateRecommendations() {
        const recommendations = [];

        // Terrain-based recommendations
        if (siteAnalysis.terrainData.slope > 15) {
            recommendations.push({
                type: 'warning',
                message: 'Steep slope detected. Consider terracing or alternative foundation designs.',
                priority: 'high'
            });
        }

        // Solar potential recommendations
        if (siteAnalysis.solarData.irradiance > 800) {
            recommendations.push({
                type: 'positive',
                message: 'Excellent solar potential. Recommended for solar panel installation.',
                priority: 'high'
            });
        } else if (siteAnalysis.solarData.irradiance > 600) {
            recommendations.push({
                type: 'info',
                message: 'Moderate solar potential. Consider optimizing panel placement.',
                priority: 'medium'
            });
        }

        // Wind potential recommendations
        if (siteAnalysis.windData.speed > 5) {
            recommendations.push({
                type: 'positive',
                message: 'Good wind conditions for turbine installation.',
                priority: 'high'
            });
        }

        // Environmental considerations
        if (siteAnalysis.environmentalData.protectedAreas < 1000) {
            recommendations.push({
                type: 'warning',
                message: 'Close proximity to protected areas. Additional environmental assessment required.',
                priority: 'high'
            });
        }

        // Update recommendations display
        const recommendationsList = document.getElementById('recommendations-list');
        recommendationsList.innerHTML = recommendations
            .sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority))
            .map(rec => `
                <li class="${this.getRecommendationClass(rec.type)}">
                    <span class="font-medium">${this.getRecommendationIcon(rec.type)}</span>
                    ${rec.message}
                </li>
            `)
            .join('');
    }

    getPriorityValue(priority) {
        const priorities = { high: 3, medium: 2, low: 1 };
        return priorities[priority] || 0;
    }

    getRecommendationClass(type) {
        const classes = {
            positive: 'text-green-700',
            warning: 'text-yellow-700',
            info: 'text-blue-700'
        };
        return classes[type] || 'text-gray-700';
    }

    getRecommendationIcon(type) {
        const icons = {
            positive: '✅',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || '•';
    }
}

// Initialize and export the real-time analysis handler
const realTimeSiteAnalysis = new RealTimeSiteAnalysis();
export default realTimeSiteAnalysis;