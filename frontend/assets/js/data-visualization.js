/**
 * data-visualization.js
 * Advanced data visualization components for Reverse Green Energy Project
 * Creates interactive charts and real-time data displays
 */

// Initialize all data visualization components
function initDataVisualizations() {
    // Initialize energy production charts
    initEnergyProductionChart();
    
    // Initialize site comparison chart
    initSiteComparisonChart();
    
    // Initialize real-time energy counters
    initEnergyCounters();
    
    // Initialize ROI calculator
    initROICalculator();
}

// Create energy production chart
function initEnergyProductionChart() {
    const ctx = document.getElementById('energy-production-chart');
    
    if (!ctx) return;
    
    // Sample data for demonstration
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const solarData = [120, 150, 180, 210, 240, 270, 280, 260, 220, 190, 150, 130];
    const windData = [250, 230, 180, 160, 140, 120, 110, 130, 170, 210, 240, 260];
    
    // Create gradient for solar data
    const solarGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    solarGradient.addColorStop(0, 'rgba(252, 211, 77, 0.8)');
    solarGradient.addColorStop(1, 'rgba(252, 211, 77, 0)');
    
    // Create gradient for wind data
    const windGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    windGradient.addColorStop(0, 'rgba(147, 197, 253, 0.8)');
    windGradient.addColorStop(1, 'rgba(147, 197, 253, 0)');
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Solar Energy (MWh)',
                    data: solarData,
                    borderColor: '#FFD700',
                    backgroundColor: solarGradient,
                    borderWidth: 2,
                    pointBackgroundColor: '#FFD700',
                    pointBorderColor: '#FFFFFF',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Wind Energy (MWh)',
                    data: windData,
                    borderColor: '#00C8FF',
                    backgroundColor: windGradient,
                    borderWidth: 2,
                    pointBackgroundColor: '#00C8FF',
                    pointBorderColor: '#FFFFFF',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            family: 'Inter',
                            size: 12
                        },
                        boxWidth: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#FFFFFF',
                    bodyColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        family: 'Inter',
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: 'Inter',
                        size: 13
                    },
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} MWh`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
    
    // Add hover animation
    ctx.addEventListener('mousemove', () => {
        chart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
        chart.update();
    });
    
    ctx.addEventListener('mouseleave', () => {
        chart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.05)';
        chart.update();
    });
}

// Create site comparison chart
function initSiteComparisonChart() {
    const ctx = document.getElementById('site-comparison-chart');
    
    if (!ctx) return;
    
    // Sample data for demonstration
    const sites = ['California', 'Texas', 'Arizona', 'Nevada', 'New Mexico'];
    const solarPotential = [95, 88, 92, 90, 85];
    const windPotential = [65, 92, 45, 55, 70];
    const landCost = [90, 40, 55, 50, 45];
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: sites,
            datasets: [
                {
                    label: 'Solar Potential',
                    data: solarPotential,
                    backgroundColor: 'rgba(252, 211, 77, 0.2)',
                    borderColor: '#FFD700',
                    pointBackgroundColor: '#FFD700',
                    pointBorderColor: '#FFFFFF',
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#FFD700',
                    borderWidth: 2
                },
                {
                    label: 'Wind Potential',
                    data: windPotential,
                    backgroundColor: 'rgba(0, 200, 255, 0.2)',
                    borderColor: '#00C8FF',
                    pointBackgroundColor: '#00C8FF',
                    pointBorderColor: '#FFFFFF',
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#00C8FF',
                    borderWidth: 2
                },
                {
                    label: 'Land Cost (Inverse)',
                    data: landCost,
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    borderColor: '#22C55E',
                    pointBackgroundColor: '#22C55E',
                    pointBorderColor: '#FFFFFF',
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#22C55E',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#FFFFFF',
                    bodyColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    },
                    ticks: {
                        backdropColor: 'transparent',
                        color: 'rgba(255, 255, 255, 0.5)'
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Initialize energy counters with animated counting
function initEnergyCounters() {
    // Get counter elements
    const solarCounter = document.getElementById('solar-counter');
    const windCounter = document.getElementById('wind-counter');
    const co2Counter = document.getElementById('co2-counter');
    const treesCounter = document.getElementById('trees-counter');
    
    if (!solarCounter || !windCounter || !co2Counter || !treesCounter) return;
    
    // Set target values
    const solarTarget = 12500;
    const windTarget = 8750;
    const co2Target = 1250;
    const treesTarget = 5800;
    
    // Create intersection observer to trigger animations when counters are visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Start counter animations with staggered delays
                setTimeout(() => animateCounter(solarCounter, solarTarget, 2000), 0);
                setTimeout(() => animateCounter(windCounter, windTarget, 2000), 300);
                setTimeout(() => animateCounter(co2Counter, co2Target, 2000), 600);
                setTimeout(() => animateCounter(treesCounter, treesTarget, 2000), 900);
                
                // Unobserve after triggering
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    // Observe the first counter to trigger all animations
    observer.observe(solarCounter.parentElement);
}

// Animate counter from 0 to target value
function animateCounter(element, targetValue, duration) {
    const startValue = 0;
    const increment = targetValue / (duration / 16); // 60fps
    let currentValue = startValue;
    let startTime = null;
    
    function updateCounter(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        currentValue = Math.min(startValue + (increment * elapsed / 16), targetValue);
        element.textContent = Math.floor(currentValue).toLocaleString();
        
        if (currentValue < targetValue) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Initialize ROI calculator
function initROICalculator() {
    const calculator = document.getElementById('roi-calculator');
    
    if (!calculator) return;
    
    // Get form elements
    const investmentInput = document.getElementById('investment-amount');
    const energyTypeSelect = document.getElementById('energy-type');
    const locationSelect = document.getElementById('location');
    const calculateButton = document.getElementById('calculate-roi');
    const resultElement = document.getElementById('roi-result');
    const paybackElement = document.getElementById('payback-period');
    
    if (!investmentInput || !energyTypeSelect || !locationSelect || !calculateButton || !resultElement || !paybackElement) return;
    
    // Sample ROI data for demonstration
    const roiData = {
        solar: {
            california: { roi: 18.5, payback: 5.2 },
            texas: { roi: 16.8, payback: 5.8 },
            arizona: { roi: 19.2, payback: 5.0 },
            nevada: { roi: 18.0, payback: 5.4 },
            newMexico: { roi: 17.5, payback: 5.6 }
        },
        wind: {
            california: { roi: 15.2, payback: 6.4 },
            texas: { roi: 19.5, payback: 5.0 },
            arizona: { roi: 12.8, payback: 7.5 },
            nevada: { roi: 14.0, payback: 6.8 },
            newMexico: { roi: 16.2, payback: 6.0 }
        },
        hybrid: {
            california: { roi: 20.1, payback: 4.8 },
            texas: { roi: 21.5, payback: 4.5 },
            arizona: { roi: 18.5, payback: 5.2 },
            nevada: { roi: 17.8, payback: 5.5 },
            newMexico: { roi: 19.0, payback: 5.1 }
        }
    };
    
    // Add event listener to calculate button
    calculateButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Get input values
        const investment = parseFloat(investmentInput.value);
        const energyType = energyTypeSelect.value;
        const location = locationSelect.value;
        
        // Validate input
        if (isNaN(investment) || investment <= 0) {
            resultElement.innerHTML = '<span class="text-red-500">Please enter a valid investment amount</span>';
            paybackElement.textContent = '-';
            return;
        }
        
        // Get ROI data for selected energy type and location
        const locationKey = location.toLowerCase().replace(' ', '');
        const roiInfo = roiData[energyType][locationKey];
        
        // Calculate annual return
        const annualReturn = (investment * roiInfo.roi / 100).toFixed(2);
        
        // Update result elements with animation
        animateROIResult(resultElement, annualReturn, 1500);
        animateROIResult(paybackElement, roiInfo.payback, 1500, 'years');
        
        // Create or update chart
        updateROIChart(investment, annualReturn, roiInfo.payback);
    });
    
    // Add input validation
    investmentInput.addEventListener('input', () => {
        const value = parseFloat(investmentInput.value);
        if (isNaN(value) || value <= 0) {
            investmentInput.classList.add('border-red-500');
        } else {
            investmentInput.classList.remove('border-red-500');
        }
    });
}

// Animate ROI result with counting effect
function animateROIResult(element, targetValue, duration, unit = '') {
    const startValue = 0;
    const increment = targetValue / (duration / 16); // 60fps
    let currentValue = startValue;
    let startTime = null;
    
    function updateValue(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        currentValue = Math.min(startValue + (increment * elapsed / 16), targetValue);
        element.textContent = currentValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + (unit ? ' ' + unit : '');
        
        if (currentValue < targetValue) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

// Update or create ROI chart
function updateROIChart(investment, annualReturn, paybackPeriod) {
    const chartContainer = document.getElementById('roi-chart-container');
    if (!chartContainer) return;
    
    // Clear previous chart if exists
    chartContainer.innerHTML = '<canvas id="roi-chart"></canvas>';
    const ctx = document.getElementById('roi-chart');
    
    // Calculate cumulative returns over 20 years
    const years = Array.from({length: 20}, (_, i) => i + 1);
    const cumulativeReturns = years.map(year => {
        return year <= paybackPeriod ? 
            investment * (year / paybackPeriod) : 
            investment + (annualReturn * (year - paybackPeriod));
    });
    
    // Create gradient
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
    
    // Create chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Cumulative Return ($)',
                data: cumulativeReturns,
                borderColor: '#22C55E',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#22C55E',
                pointBorderColor: '#FFFFFF',
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#FFFFFF',
                    bodyColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Return: $${context.raw.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}`;
                        },
                        title: function(context) {
                            return `Year ${context[0].label}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Years',
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Return ($)',
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
    
    // Add payback period marker
    const paybackMarker = document.createElement('div');
    paybackMarker.className = 'payback-marker';
    paybackMarker.style.left = `${(paybackPeriod / 20) * 100}%`;
    paybackMarker.innerHTML = `<span>Payback<br>${paybackPeriod} years</span>`;
    chartContainer.appendChild(paybackMarker);
}

// Initialize all visualizations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initDataVisualizations();
});
       