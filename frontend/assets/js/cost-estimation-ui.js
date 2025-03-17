// Initialize the map
let map = L.map('global-map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let selectedLocation = null;
let marker = null;

// Handle map clicks
map.on('click', function(e) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker(e.latlng).addTo(map);
    selectedLocation = e.latlng;
    document.getElementById('selected-location').textContent = 
        `Latitude: ${e.latlng.lat.toFixed(4)}, Longitude: ${e.latlng.lng.toFixed(4)}`;
});

// Handle form submission
document.getElementById('cost-estimation-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        // Validate location selection
        if (!selectedLocation) {
            throw new Error('Please select a location on the map first');
        }

        // Get form values
        const formData = {
            systemType: document.getElementById('system-type').value,
            systemSize: parseFloat(document.getElementById('system-size').value),
            electricityRate: parseFloat(document.getElementById('electricity-rate').value),
            financingMethod: document.getElementById('financing-method').value,
            location: {
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng
            }
        };

        // Validate form data
        if (isNaN(formData.systemSize) || formData.systemSize <= 0) {
            throw new Error('Please enter a valid system size');
        }
        if (isNaN(formData.electricityRate) || formData.electricityRate <= 0) {
            throw new Error('Please enter a valid electricity rate');
        }

        // Calculate costs and ROI
        const results = calculateCostsAndROI(formData);

        // Display results
        displayResults(results);

    } catch (error) {
        alert(error.message);
    }
});

// Calculate costs and ROI based on input parameters
function calculateCostsAndROI(data) {
    // Get location-specific data
    const locationFactors = getLocationSpecificFactors(data.location);

    // Base installation costs per kW (adjusted by location)
    const installationCosts = {
        solar: 1000 * locationFactors.costMultiplier,
        wind: 1200 * locationFactors.costMultiplier,
        hybrid: 1500 * locationFactors.costMultiplier
    };

    // Calculate total installation cost
    const baseInstallationCost = installationCosts[data.systemType] * data.systemSize;

    // Calculate annual energy production using location-specific capacity factors
    const capacityFactor = {
        solar: locationFactors.solarCapacityFactor,
        wind: locationFactors.windCapacityFactor,
        hybrid: (locationFactors.solarCapacityFactor + locationFactors.windCapacityFactor) / 2
    };

    const annualEnergyProduction = data.systemSize * capacityFactor[data.systemType] * 8760;

    // Calculate annual revenue (adjusted by location-specific electricity rates)
    const annualRevenue = annualEnergyProduction * (data.electricityRate * locationFactors.electricityRateMultiplier);

    // Calculate financing costs
    let financingCost = 0;
    let totalCost = baseInstallationCost;
    
    if (data.financingMethod === 'loan') {
        const interestRate = locationFactors.interestRate || 0.05;
        const loanTerm = 10;
        financingCost = baseInstallationCost * interestRate * loanTerm;
        totalCost += financingCost;
    }

    // Calculate simple payback period
    const paybackPeriod = totalCost / annualRevenue;

    // Calculate ROI
    const roi = ((annualRevenue * 20 - totalCost) / totalCost) * 100;

    return {
        installationCost: baseInstallationCost,
        financingCost: financingCost,
        totalCost: totalCost,
        annualEnergyProduction: annualEnergyProduction,
        annualRevenue: annualRevenue,
        paybackPeriod: paybackPeriod,
        roi: roi
    };
}

// Get location-specific factors based on latitude and longitude
function getLocationSpecificFactors(location) {
    // Determine solar potential based on latitude
    const latitude = Math.abs(location.latitude);
    let solarCapacityFactor = 0;
    
    if (latitude < 23.5) { // Tropical zone
        solarCapacityFactor = 0.25;
    } else if (latitude < 45) { // Temperate zone
        solarCapacityFactor = 0.20;
    } else { // Polar zone
        solarCapacityFactor = 0.15;
    }

    // Determine wind potential based on latitude and longitude
    const windCapacityFactor = getWindCapacityFactor(location);

    // Determine cost multiplier based on region
    const costMultiplier = getCostMultiplier(location);

    // Determine electricity rate multiplier based on region
    const electricityRateMultiplier = getElectricityRateMultiplier(location);

    // Get regional interest rate
    const interestRate = getRegionalInterestRate(location);

    return {
        solarCapacityFactor,
        windCapacityFactor,
        costMultiplier,
        electricityRateMultiplier,
        interestRate
    };
}

function getWindCapacityFactor(location) {
    const latitude = Math.abs(location.latitude);
    const longitude = location.longitude;

    // Higher wind potential in coastal areas and higher latitudes
    let windFactor = 0.35; // Base wind capacity factor

    // Adjust for latitude (higher latitudes generally have more wind)
    if (latitude > 45) {
        windFactor += 0.1;
    } else if (latitude > 30) {
        windFactor += 0.05;
    }

    return windFactor;
}

function getCostMultiplier(location) {
    const latitude = location.latitude;
    const longitude = location.longitude;

    // Define regions and their cost multipliers
    if (latitude > 30 && latitude < 50 && longitude > -130 && longitude < -60) {
        return 1.2; // North America
    } else if (latitude > 35 && latitude < 70 && longitude > -10 && longitude < 40) {
        return 1.3; // Europe
    } else if (latitude > -10 && latitude < 35 && longitude > 100 && longitude < 145) {
        return 0.8; // Southeast Asia
    }
    return 1.0; // Other regions
}

function getElectricityRateMultiplier(location) {
    const latitude = location.latitude;
    const longitude = location.longitude;

    // Define regions and their electricity rate multipliers
    if (latitude > 30 && latitude < 50 && longitude > -130 && longitude < -60) {
        return 1.0; // North America
    } else if (latitude > 35 && latitude < 70 && longitude > -10 && longitude < 40) {
        return 1.4; // Europe (higher electricity rates)
    } else if (latitude > -10 && latitude < 35 && longitude > 100 && longitude < 145) {
        return 0.7; // Southeast Asia (lower electricity rates)
    }
    return 1.0; // Other regions
}

function getRegionalInterestRate(location) {
    const latitude = location.latitude;
    const longitude = location.longitude;

    // Define regions and their typical interest rates
    if (latitude > 30 && latitude < 50 && longitude > -130 && longitude < -60) {
        return 0.05; // North America
    } else if (latitude > 35 && latitude < 70 && longitude > -10 && longitude < 40) {
        return 0.04; // Europe
    } else if (latitude > -10 && latitude < 35 && longitude > 100 && longitude < 145) {
        return 0.06; // Southeast Asia
    }
    return 0.05; // Other regions
}

// Display results in the UI
function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('results-content');

    resultsContent.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div class="p-4 border rounded">
                <h4>Installation Costs</h4>
                <p>Base Installation Cost: $${results.installationCost.toLocaleString()}</p>
                <p>Financing Cost: $${results.financingCost.toLocaleString()}</p>
                <p>Total Cost: $${results.totalCost.toLocaleString()}</p>
            </div>
            <div class="p-4 border rounded">
                <h4>Energy Production & Revenue</h4>
                <p>Annual Energy Production: ${Math.round(results.annualEnergyProduction).toLocaleString()} kWh</p>
                <p>Annual Revenue: $${Math.round(results.annualRevenue).toLocaleString()}</p>
            </div>
            <div class="p-4 border rounded">
                <h4>Financial Metrics</h4>
                <p>Payback Period: ${results.paybackPeriod.toFixed(1)} years</p>
                <p>20-Year ROI: ${results.roi.toFixed(1)}%</p>
            </div>
        </div>

       <div class="charts-wrapper">
    <div class="chart-container">
        <h4>System Performance Details</h4>
        <canvas id="performanceChart"></canvas>
    </div>

    <div class="chart-container">
        <h4>Seasonal Production Variation</h4>
        <canvas id="seasonalChart"></canvas>
    </div>

    <div class="chart-container">
        <h4>20-Year Financial Projection</h4>
        <canvas id="financialChart"></canvas>
    </div>
</div>

<style>
    .charts-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: space-between;
    }

    .chart-container {
        flex: 1;
        min-width: 300px;
        max-width: 32%;
        height: 200px;
        border: 1px solid #ddd;
        padding: 10px;
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
        background: #fff;
        text-align: center;
    }

    @media (max-width: 768px) {
        .chart-container {
            max-width: 100%;
        }
    }
</style>

    `;

    // Create performance doughnut chart
    new Chart(document.getElementById('performanceChart'), {
        type: 'doughnut',
        data: {
            labels: ['Energy Production', 'System Losses', 'Maintenance Downtime'],
            datasets: [{
                data: [85, 10, 5],
                backgroundColor: ['#4fd1c5', '#f6ad55', '#fc8181']
            }]
        },
        options: {
            responsive: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#e2e8f0', boxWidth: 12, padding: 8 }
                }
            }
        }
    });

    // Create seasonal variation line chart
    new Chart(document.getElementById('seasonalChart'), {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Monthly Production (kWh)',
                data: generateMonthlyData(results.annualEnergyProduction),
                borderColor: '#4fd1c5',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(79, 209, 197, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#e2e8f0', maxTicksLimit: 5 }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#e2e8f0' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0', boxWidth: 12, padding: 8 }
                }
            }
        }
    });

    // Create 20-year financial projection bar chart
    new Chart(document.getElementById('financialChart'), {
        type: 'bar',
        data: {
            labels: Array.from({length: 20}, (_, i) => `Year ${i + 1}`),
            datasets: [{
                label: 'Cumulative Cash Flow ($)',
                data: generateFinancialProjection(results),
                backgroundColor: '#4fd1c5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#e2e8f0', maxTicksLimit: 5 }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#e2e8f0', maxRotation: 45, minRotation: 45 }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0', boxWidth: 12, padding: 8 }
                }
            }
        }
    });

    resultsDiv.classList.remove('hidden');
}

// Helper function to generate monthly production data
function generateMonthlyData(annualProduction) {
    const seasonalFactors = [0.6, 0.7, 0.9, 1.1, 1.2, 1.3, 1.4, 1.3, 1.1, 0.9, 0.7, 0.6];
    const monthlyBase = annualProduction / 12;
    return seasonalFactors.map(factor => monthlyBase * factor);
}

// Helper function to generate financial projection data
function generateFinancialProjection(results) {
    const annualRevenue = results.annualRevenue;
    const totalCost = results.totalCost;
    return Array.from({length: 20}, (_, i) => {
        return -totalCost + (annualRevenue * (i + 1));
    });
}