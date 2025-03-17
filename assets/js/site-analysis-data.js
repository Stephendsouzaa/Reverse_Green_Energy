// Site Analysis Data Handler

class SiteAnalysisData {
    constructor() {
        this.charts = {};
        this.initializeCharts();
    }

    initializeCharts() {
        // Initialize all charts with Chart.js
        const chartConfigs = {
            solar: { type: 'line', label: 'Solar Irradiance' },
            temp: { type: 'line', label: 'Temperature' },
            wind: { type: 'line', label: 'Wind Speed' },
            cost: { type: 'doughnut', label: 'Cost Breakdown' },
            roi: { type: 'bar', label: 'ROI Projection' },
            grid: { type: 'radar', label: 'Grid Analysis' }
        };

        for (const [key, config] of Object.entries(chartConfigs)) {
            const ctx = document.getElementById(`${key}-chart`)?.getContext('2d');
            if (ctx) {
                this.charts[key] = new Chart(ctx, {
                    type: config.type,
                    data: { labels: [], datasets: [] },
                    options: { responsive: true }
                });
            }
        }
    }

    async fetchNASAPowerData(lat, lon) {
        const params = 'ALLSKY_SFC_SW_DWN,T2M,WS10M';
        const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=RE&longitude=${lon}&latitude=${lat}&start=20230101&end=20231231&format=JSON`;
        
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Error fetching NASA POWER data:', error);
            return null;
        }
    }

    async fetchOpenMeteoData(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,windspeed_10m,direct_radiation&forecast_days=7`;
        
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Error fetching OpenMeteo data:', error);
            return null;
        }
    }

    async fetchEnvironmentalData(lat, lon) {
        const bbox = `${lat - 0.1},${lon - 0.1},${lat + 0.1},${lon + 0.1}`;
        const query = `[out:json][timeout:25];(way[\"natural\"](${bbox});way[\"landuse\"](${bbox}););out body;>;out skel qt;`;
        
        try {
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching environmental data:', error);
            return null;
        }
    }

    calculateFinancialMetrics(solarData, siteType) {
        const baseCosts = {
            solar: 1000000,
            'data-center': 5000000,
            hybrid: 6000000
        };

        const installationCost = baseCosts[siteType] || baseCosts.solar;
        const annualRevenue = this.calculateAnnualRevenue(solarData, siteType);
        const roi = this.calculateROI(installationCost, annualRevenue);

        return { installationCost, annualRevenue, roi };
    }

    calculateAnnualRevenue(solarData, siteType) {
        const baseRevenue = 200000; // Base annual revenue
        const solarMultiplier = solarData ? this.calculateSolarMultiplier(solarData) : 1;
        return baseRevenue * solarMultiplier;
    }

    calculateROI(cost, revenue) {
        const period = cost / revenue;
        const rate = (revenue / cost) * 100;
        return { period, rate };
    }

    calculateSolarMultiplier(solarData) {
        // Calculate multiplier based on solar irradiance data
        const avgIrradiance = Object.values(solarData).reduce((a, b) => a + b, 0) / Object.values(solarData).length;
        return avgIrradiance / 1000; // Normalize to 0-1 range
    }

    async analyzeSite(lat, lon, siteType) {
        try {
            // Fetch all data in parallel
            const [nasaData, meteoData, envData] = await Promise.all([
                this.fetchNASAPowerData(lat, lon),
                this.fetchOpenMeteoData(lat, lon),
                this.fetchEnvironmentalData(lat, lon)
            ]);

            // Process weather data
            this.updateWeatherAnalysis(nasaData, meteoData);

            // Process financial data
            const financialMetrics = this.calculateFinancialMetrics(nasaData?.properties?.parameter?.ALLSKY_SFC_SW_DWN, siteType);
            this.updateFinancialAnalysis(financialMetrics);

            // Process environmental data
            this.updateEnvironmentalAnalysis(envData);

            // Update other sections
            this.updateGridAnalysis(lat, lon);
            this.updateConstructionPlanning(siteType);
            this.updateCommunityImpact(siteType);
            this.updatePerformanceMetrics(nasaData, siteType);

            return true;
        } catch (error) {
            console.error('Error in site analysis:', error);
            return false;
        }
    }

    updateWeatherAnalysis(nasaData, meteoData) {
        if (!nasaData?.properties?.parameter) return;
    
        const params = nasaData.properties.parameter;
        
        // Update display values with more detailed information
        document.getElementById('solar-irradiance').textContent = 
            `${this.calculateAverage(params.ALLSKY_SFC_SW_DWN).toFixed(2)} kWh/m²/day (${Math.round(this.calculateSolarPotential(params.ALLSKY_SFC_SW_DWN))}% potential)`;
        document.getElementById('temperature').textContent = 
            `${this.calculateAverage(params.T2M).toFixed(1)}°C`;
        document.getElementById('wind-speed').textContent = 
            `${this.calculateAverage(params.WS10M).toFixed(1)} m/s`;
        
        // Add weather analysis summary
        document.getElementById('weather-analysis').textContent = this.generateWeatherAnalysisSummary(params);
    
        // Update weather charts with enhanced visualization
        this.updateWeatherCharts(params);
    }

    calculateSolarPotential(solarData) {
        const avgIrradiance = this.calculateAverage(solarData);
        const maxPotential = 7.0; // Maximum expected solar irradiance
        return Math.min(Math.round((avgIrradiance / maxPotential) * 100), 100);
    }

    generateWeatherAnalysisSummary(params) {
        const avgTemp = this.calculateAverage(params.T2M);
        const avgWind = this.calculateAverage(params.WS10M);
        const avgSolar = this.calculateAverage(params.ALLSKY_SFC_SW_DWN);

        let summary = [];

        if (avgSolar > 5.5) summary.push('Excellent solar conditions');
        else if (avgSolar > 4.0) summary.push('Good solar conditions');
        else summary.push('Moderate solar conditions');

        if (avgTemp > 30) summary.push('High temperature may affect efficiency');
        else if (avgTemp < 10) summary.push('Low temperature is optimal for panel efficiency');
        else summary.push('Temperature conditions are favorable');

        if (avgWind > 6) summary.push('Strong wind conditions require robust mounting');
        else if (avgWind > 3) summary.push('Moderate wind conditions are suitable');
        else summary.push('Low wind conditions');

        return summary.join('. ') + '.';
    }

    updateWeatherCharts(params) {
        const dates = Object.keys(params.ALLSKY_SFC_SW_DWN);
        
        // Update solar chart
        this.updateChart('solar', {
            labels: dates,
            data: Object.values(params.ALLSKY_SFC_SW_DWN),
            label: 'Solar Irradiance (kWh/m²/day)'
        });

        // Update temperature chart
        this.updateChart('temp', {
            labels: dates,
            data: Object.values(params.T2M),
            label: 'Temperature (°C)'
        });

        // Update wind chart
        this.updateChart('wind', {
            labels: dates,
            data: Object.values(params.WS10M),
            label: 'Wind Speed (m/s)'
        });
    }

    updateChart(chartKey, { labels, data, label }) {
        if (!this.charts[chartKey]) return;

        this.charts[chartKey].data = {
            labels,
            datasets: [{
                label,
                data,
                borderColor: this.getChartColor(chartKey),
                tension: 0.1
            }]
        };
        this.charts[chartKey].update();
    }

    getChartColor(chartKey) {
        const colors = {
            solar: 'rgb(255, 99, 132)',
            temp: 'rgb(255, 159, 64)',
            wind: 'rgb(75, 192, 192)',
            cost: 'rgb(54, 162, 235)',
            roi: 'rgb(153, 102, 255)',
            grid: 'rgb(201, 203, 207)'
        };
        return colors[chartKey] || 'rgb(0, 0, 0)';
    }

    calculateAverage(data) {
        const values = Object.values(data);
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    updateFinancialAnalysis(metrics) {
        document.getElementById('installation-cost').textContent = 
            `Installation Cost: $${(metrics.installationCost / 1000000).toFixed(2)}M`;
        document.getElementById('roi-period').textContent = 
            `ROI Period: ${metrics.roi.period.toFixed(1)} years`;

        // Update financial charts
        this.updateFinancialCharts(metrics);
    }

    updateFinancialCharts(metrics) {
        // Update cost breakdown chart
        this.charts.cost.data = {
            labels: ['Equipment', 'Installation', 'Infrastructure', 'Other'],
            datasets: [{
                data: [
                    metrics.installationCost * 0.6,
                    metrics.installationCost * 0.2,
                    metrics.installationCost * 0.15,
                    metrics.installationCost * 0.05
                ],
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)'
                ]
            }]
        };
        this.charts.cost.update();

        // Update ROI chart
        this.charts.roi.data = {
            labels: ['Year 1', 'Year 5', 'Year 10', 'Year 20'],
            datasets: [{
                label: 'Cumulative Return (%)',
                data: [
                    metrics.roi.rate,
                    metrics.roi.rate * 5,
                    metrics.roi.rate * 10,
                    metrics.roi.rate * 20
                ],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1
            }]
        };
        this.charts.roi.update();
    }

    updateEnvironmentalAnalysis(envData) {
        if (!envData) return;
    
        const protectedAreas = this.analyzeProtectedAreas(envData);
        const landUse = this.analyzeLandUse(envData);
    
        // Update environmental impact display with more comprehensive data
        document.getElementById('protected-areas').textContent = protectedAreas.impact;
        document.getElementById('land-use-impact').textContent = `${landUse.impact}%`;
        document.getElementById('carbon-offset').textContent = 
            `${this.calculateCarbonOffset(protectedAreas, landUse)} tons/year`;
        document.getElementById('wildlife-impact').textContent = 
            this.calculateWildlifeImpact(envData);
        document.getElementById('water-resources').textContent = 
            this.analyzeWaterResources(envData);
    }

    calculateWildlifeImpact(envData) {
        const wildlifeAreas = envData.elements.filter(e => 
            e.tags && e.tags.natural === 'wildlife_corridor'
        ).length;
        return wildlifeAreas > 3 ? 'High' : wildlifeAreas > 1 ? 'Medium' : 'Low';
    }

    analyzeWaterResources(envData) {
        const waterBodies = envData.elements.filter(e => 
            e.tags && (e.tags.natural === 'water' || e.tags.water)
        ).length;
        return waterBodies > 5 ? 'Abundant' : waterBodies > 2 ? 'Adequate' : 'Limited';
    }

    analyzeProtectedAreas(envData) {
        // Analyze protected areas from OpenStreetMap data
        const protectedCount = envData.elements.filter(e => 
            e.tags && (e.tags.natural || e.tags.landuse === 'conservation')
        ).length;

        return {
            count: protectedCount,
            impact: protectedCount > 5 ? 'High' : protectedCount > 2 ? 'Medium' : 'Low'
        };
    }

    analyzeLandUse(envData) {
        // Analyze land use from OpenStreetMap data
        const totalElements = envData.elements.length;
        const developedLand = envData.elements.filter(e => 
            e.tags && ['industrial', 'residential', 'commercial'].includes(e.tags.landuse)
        ).length;

        return {
            developed: developedLand,
            impact: Math.round((developedLand / totalElements) * 100)
        };
    }

    calculateCarbonOffset(protectedAreas, landUse) {
        // Simple carbon offset calculation
        const baseOffset = 1000; // Base offset in tons/year
        const protectedMultiplier = protectedAreas.impact === 'Low' ? 1.2 : 
                                  protectedAreas.impact === 'Medium' ? 1 : 0.8;
        const landUseMultiplier = (100 - landUse.impact) / 100;

        return Math.round(baseOffset * protectedMultiplier * landUseMultiplier);
    }

    updateGridAnalysis(lat, lon) {
        // Simulate grid analysis with random data
        const gridCapacity = Math.random() * 100;
        const connectionPoints = Math.floor(Math.random() * 5) + 1;
        const reliability = Math.random();

        document.getElementById('grid-capacity').textContent = `${gridCapacity.toFixed(1)} MW`;
        document.getElementById('connection-points').textContent = `${connectionPoints} points`;
        document.getElementById('infrastructure-quality').textContent = 
            reliability > 0.8 ? 'Excellent' : reliability > 0.6 ? 'Good' : 'Fair';

        // Update grid chart
        this.updateGridChart(gridCapacity, connectionPoints, reliability);
    }

    updateGridChart(capacity, points, reliability) {
        this.charts.grid.data = {
            labels: ['Grid Capacity', 'Connection Points', 'Reliability'],
            datasets: [{
                label: 'Grid Analysis',
                data: [capacity, points * 20, reliability * 100],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)'
            }]
        };
        this.charts.grid.update();
    }

    updateConstructionPlanning(siteType) {
        const timeline = this.generateConstructionTimeline(siteType);
        document.getElementById('construction-timeline').innerHTML = timeline;
    }

    generateConstructionTimeline(siteType) {
        const phases = {
            solar: [
                { phase: 'Site Preparation', duration: '2-3 months' },
                { phase: 'Foundation Work', duration: '1-2 months' },
                { phase: 'Panel Installation', duration: '3-4 months' },
                { phase: 'Electrical Systems', duration: '2-3 months' },
                { phase: 'Grid Connection', duration: '1-2 months' },
                { phase: 'Testing & Commissioning', duration: '1 month' }
            ],
            'data-center': [
                { phase: 'Site Preparation', duration: '3-4 months' },
                { phase: 'Foundation Work', duration: '2-3 months' },
                { phase: 'Building Construction', duration: '6-8 months' },
                { phase: 'Infrastructure Setup', duration: '4-5 months' },
                { phase: 'Power Systems', duration: '2-3 months' },
                { phase: 'Cooling Systems', duration: '2-3 months' },
                { phase: 'Testing & Commissioning', duration: '2 months' }
            ],
            hybrid: [
                { phase: 'Site Preparation', duration: '3-4 months' },
                { phase: 'Foundation Work', duration: '2-3 months' },
                { phase: 'Solar Installation', duration: '3-4 months' },
                { phase: 'Data Center Construction', duration: '6-8 months' },
                { phase: 'Power Integration', duration: '2-3 months' },
                { phase: 'Cooling Systems', duration: '2-3 months' },
                { phase: 'Grid Connection', duration: '1-2 months' },
                { phase: 'Testing & Commissioning', duration: '2 months' }
            ]
        };

        const selectedPhases = phases[siteType] || phases.solar;
        let timeline = '<div class="construction-timeline">';
        
        selectedPhases.forEach((phase, index) => {
            timeline += `
                <div class="timeline-item ${index % 2 === 0 ? 'even' : 'odd'}">
                    <div class="phase">${phase.phase}</div>
                    <div class="duration">${phase.duration}</div>
                </div>
            `;
        });

        timeline += '</div>';
        return timeline;
    }

    updateCommunityImpact(siteType) {
        // Calculate community impact metrics
        const jobsCreated = siteType === 'data-center' ? 50 : siteType === 'hybrid' ? 75 : 25;
        const localRevenue = siteType === 'data-center' ? 2000000 : siteType === 'hybrid' ? 2500000 : 1000000;
        const skillDevelopment = siteType === 'data-center' ? 'High' : siteType === 'hybrid' ? 'Very High' : 'Moderate';

        // Update DOM elements
        document.getElementById('jobs-created').textContent = `${jobsCreated} jobs`;
        document.getElementById('local-revenue').textContent = `$${(localRevenue / 1000000).toFixed(1)}M annually`;
        document.getElementById('skill-development').textContent = skillDevelopment;
    }

    updatePerformanceMetrics(nasaData, siteType) {
        if (!nasaData?.properties?.parameter) return;

        const params = nasaData.properties.parameter;
        const avgSolarIrradiance = this.calculateAverage(params.ALLSKY_SFC_SW_DWN);
        const efficiency = siteType === 'hybrid' ? 0.22 : 0.18; // Higher efficiency for hybrid systems

        // Calculate performance metrics
        const annualEnergy = avgSolarIrradiance * 365 * efficiency * 1000; // kWh/year
        const carbonReduction = annualEnergy * 0.7; // kg CO2/year (assuming 0.7 kg CO2/kWh grid offset)
        const reliability = siteType === 'data-center' ? 0.995 : 0.98;

        // Update DOM elements
        document.getElementById('annual-energy').textContent = `${Math.round(annualEnergy).toLocaleString()} kWh/year`;
        document.getElementById('carbon-reduction').textContent = `${Math.round(carbonReduction).toLocaleString()} kg CO2/year`;
        document.getElementById('system-reliability').textContent = `${(reliability * 100).toFixed(1)}%`;
    }
}
    