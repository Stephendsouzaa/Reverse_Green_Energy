// Site Selection Charts Handler

class SiteSelectionCharts {
    constructor() {
        this.charts = {};
        this.initializeCharts();
    }

    initializeCharts() {
        this.createSuitabilityChart();
        this.createEnvironmentalChart();
        this.createFinancialChart();
        this.createImplementationChart();
    }

    createSuitabilityChart() {
        const ctx = document.getElementById('suitability-chart')?.getContext('2d');
        if (!ctx) return;
        
        // Set canvas size explicitly
        ctx.canvas.width = 400;
        ctx.canvas.height = 480;

        this.charts.suitability = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Solar Potential', 'Land Suitability', 'Grid Infrastructure', 'Environmental Impact', 'Financial Viability'],
                datasets: [{
                    label: 'Site Suitability Factors',
                    data: [84, 81, 91, 85, 67],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 25,
                            font: {
                                size: 12
                            }
                        },
                        pointLabels: {
                            font: {
                                size: 12
                            }
                        },
                        angleLines: {
                            lineWidth: 1.5
                        },
                        grid: {
                            lineWidth: 1.5
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: {
                                size: 14
                            },
                            boxWidth: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Site Suitability Assessment',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
    }

    createEnvironmentalChart() {
        const ctx = document.getElementById('environmental-chart')?.getContext('2d');
        if (!ctx) return;
        
        // Set canvas size explicitly
        ctx.canvas.width = 400;
        ctx.canvas.height = 350;

        this.charts.environmental = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Carbon Offset', 'Land Use', 'Wildlife Impact', 'Water Resources'],
                datasets: [{
                    label: 'Environmental Impact Assessment',
                    data: [100, 85, 70, 80],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)'
                    ],
                    borderColor: [
                        'rgb(75, 192, 192)',
                        'rgb(255, 159, 64)',
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)'
                    ],
                    borderWidth: 1.5,
                    barThickness: 30
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Score',
                            font: {
                                size: 12
                            }
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            stepSize: 25
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: {
                                size: 14
                            },
                            boxWidth: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Environmental Impact Assessment',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
    }

    createFinancialChart() {
        const ctx = document.getElementById('financial-chart')?.getContext('2d');
        if (!ctx) return;
        
        // Set canvas size explicitly
        ctx.canvas.width = 500;
        ctx.canvas.height = 450;

        this.charts.financial = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
                datasets: [{
                    label: 'ROI Projection',
                    data: [67, 134, 201, 268, 335],
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    borderWidth: 2.5,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Return on Investment (%)',
                            font: {
                                size: 12
                            }
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            stepSize: 100
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Project Timeline',
                            font: {
                                size: 12
                            }
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: {
                                size: 14
                            },
                            boxWidth: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Financial ROI Projection',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
    }

    createImplementationChart() {
        const ctx = document.getElementById('implementation-chart')?.getContext('2d');
        if (!ctx) return;
        
        // Set canvas size explicitly
        ctx.canvas.width = 280;
        ctx.canvas.height = 250;

        this.charts.implementation = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Phase 1: Gradual Development', 'Phase 2: Grid Integration', 'Phase 3: Optimization'],
                datasets: [{
                    data: [40, 35, 25],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1.5
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                cutout: '50%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            },
                            boxWidth: 12,
                            padding: 8
                        }
                    },
                    title: {
                        display: true,
                        text: 'Implementation Strategy',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
    }

    updateCharts(data) {
        // Update suitability radar chart
        if (this.charts.suitability) {
            this.charts.suitability.data.datasets[0].data = [
                data.solarPotential,
                data.landSuitability,
                data.gridInfrastructure,
                data.environmentalImpact,
                data.financialViability
            ];
            this.charts.suitability.update();
        }

        // Update environmental impact chart
        if (this.charts.environmental) {
            this.charts.environmental.data.datasets[0].data = [
                data.environmentalData.carbonOffset,
                data.environmentalData.landUse,
                data.environmentalData.wildlifeImpact,
                data.environmentalData.waterResources
            ];
            this.charts.environmental.update();
        }

        // Update financial ROI projection chart
        if (this.charts.financial) {
            this.charts.financial.data.datasets[0].data = data.financialData.yearlyROI;
            this.charts.financial.update();
        }

        // Update implementation strategy chart
        if (this.charts.implementation) {
            this.charts.implementation.data.datasets[0].data = data.implementationData.phases;
            this.charts.implementation.update();
        }
    }
}

// Initialize charts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.siteCharts = new SiteSelectionCharts();
});