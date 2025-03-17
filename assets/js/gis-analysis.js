// GIS Analysis Module
const GISAnalysis = {
    // Generate terrain analysis data
    generateTerrainData() {
        return {
            elevation: (Math.random() * 1000).toFixed(1),
            slope: (Math.random() * 45).toFixed(1),
            surfaceRoughness: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
            soilType: ['Sandy', 'Clay', 'Loam'][Math.floor(Math.random() * 3)],
            foundationStrength: (Math.random() * 100).toFixed(1),
            erosionRisk: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
            flowDirection: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
            floodRisk: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
            waterTableDepth: (Math.random() * 10).toFixed(1),
            developmentPotential: ['excellent', 'good', 'moderate'][Math.floor(Math.random() * 3)]
        };
    },

    // Update the terrain analysis display
    updateTerrainAnalysis() {
        const data = this.generateTerrainData();
        
        // Update elevation analysis
        document.getElementById('elevation').textContent = `${data.elevation}m`;
        document.getElementById('slope').textContent = `${data.slope}°`;
        document.getElementById('surfaceRoughness').textContent = data.surfaceRoughness;

        // Update soil stability
        document.getElementById('soilType').textContent = data.soilType;
        document.getElementById('foundationStrength').textContent = `${data.foundationStrength}%`;
        document.getElementById('erosionRisk').textContent = data.erosionRisk;

        // Update drainage analysis
        document.getElementById('flowDirection').textContent = data.flowDirection;
        document.getElementById('floodRisk').textContent = data.floodRisk;
        document.getElementById('waterTableDepth').textContent = `${data.waterTableDepth}m`;

        // Update recommendations
        document.getElementById('developmentPotential').textContent = data.developmentPotential;
    },

    // Initialize the GIS analysis
    init() {
        // Initial update
        this.updateTerrainAnalysis();

        // Add event listeners for analysis type selection
        document.querySelectorAll('.analysis-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                document.querySelectorAll('.analysis-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                // Add selected class to clicked option
                option.classList.add('selected');
                // Update analysis data
                this.updateTerrainAnalysis();
            });
        });

        // Add refresh button functionality
        const refreshButton = document.getElementById('refresh-analysis');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.updateTerrainAnalysis();
            });
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    GISAnalysis.init();
});