// Analysis Type Handler Module
const AnalysisTypeHandler = {
    currentAnalysisType: null,
    analysisTypes: {
        terrain: {
            title: 'Terrain Analysis',
            description: 'Analyze terrain features, slopes, and elevation impacts',
            layers: ['terrainLayer', 'slopeLayer']
        },
        viewshed: {
            title: 'Viewshed Analysis',
            description: 'Analyze visibility and visual impact from selected points',
            layers: ['terrainLayer']
        },
        environmental: {
            title: 'Environmental Impact',
            description: 'Assess environmental factors and protected areas',
            layers: ['protectedAreasLayer', 'landUseLayer']
        },
        optimized: {
            title: 'Optimized Site Selection',
            description: 'Find optimal locations based on multiple criteria',
            layers: ['solarLayer', 'windLayer', 'gridLayer']
        }
    },

    initialize() {
        this.setupAnalysisTypeSelection();
        this.setupEventListeners();
    },

    setupAnalysisTypeSelection() {
        const container = document.createElement('div');
        container.className = 'analysis-type-selection bg-white p-4 rounded shadow mb-4';
        container.innerHTML = `
            <h3 class="font-bold mb-2">Select Analysis Type</h3>
            <div class="grid grid-cols-2 gap-2">
                ${Object.entries(this.analysisTypes).map(([key, type]) => `
                    <button class="analysis-type-btn p-3 bg-gray-100 rounded hover:bg-gray-200 text-left" data-type="${key}">
                        <h4 class="font-semibold">${type.title}</h4>
                        <p class="text-sm text-gray-600">${type.description}</p>
                    </button>
                `).join('')}
            </div>
        `;

        // Insert before the map container
        const mapContainer = document.getElementById('map').parentElement;
        mapContainer.parentElement.insertBefore(container, mapContainer);
    },

    setupEventListeners() {
        document.querySelectorAll('.analysis-type-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectAnalysisType(btn.dataset.type));
        });
    },

    selectAnalysisType(type) {
        this.currentAnalysisType = type;
        
        // Update UI to show selected type
        document.querySelectorAll('.analysis-type-btn').forEach(btn => {
            btn.classList.toggle('bg-green-100', btn.dataset.type === type);
            btn.classList.toggle('bg-gray-100', btn.dataset.type !== type);
        });

        // Enable relevant layers
        this.toggleAnalysisLayers(type);

        // Show relevant analysis panels
        this.updateAnalysisPanels(type);
    },

    toggleAnalysisLayers(type) {
        // Disable all layers first
        const allLayers = new Set(
            Object.values(this.analysisTypes)
                .flatMap(type => type.layers)
        );

        allLayers.forEach(layerId => {
            const checkbox = document.getElementById(layerId);
            if (checkbox) {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        // Enable layers for selected analysis type
        const selectedLayers = this.analysisTypes[type].layers;
        selectedLayers.forEach(layerId => {
            const checkbox = document.getElementById(layerId);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    },

    updateAnalysisPanels(type) {
        const analysisResults = document.getElementById('analysisResults');
        if (!analysisResults) return;

        // Show/hide relevant result panels based on analysis type
        const panels = {
            terrain: ['terrainAnalysis'],
            viewshed: ['viewshedAnalysis'],
            environmental: ['environmentalImpact'],
            optimized: ['solarAnalysis', 'windAnalysis', 'gridConnection']
        };

        // Hide all panels first
        const allPanels = new Set(Object.values(panels).flat());
        allPanels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) panel.style.display = 'none';
        });

        // Show relevant panels
        const selectedPanels = panels[type] || [];
        selectedPanels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) panel.style.display = 'block';
        });

        analysisResults.classList.remove('hidden');
    }
};

export default AnalysisTypeHandler;