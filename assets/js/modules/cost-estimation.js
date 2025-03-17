/**
 * Cost Estimation Module
 * Handles cost and savings estimation functionality
 */

/**
 * Calculate ROI (Return on Investment) in years
 * @param {number} initialCost - Initial investment cost
 * @param {number} savingsPerYear - Annual savings or revenue
 * @returns {number} ROI in years (payback period)
 */
function calculateROI(initialCost, savingsPerYear) {
    return initialCost / savingsPerYear;
}

/**
 * Calculate solar installation costs
 * @param {number} systemSize - System size in kW
 * @param {object} options - Additional options for calculation
 * @returns {object} Detailed cost breakdown
 */
function calculateSolarInstallationCosts(systemSize, options = {}) {
    const {
        panelEfficiency = 0.2, // 20% efficiency
        panelCostPerWatt = 0.70, // $0.70 per watt for panels
        inverterCostPerWatt = 0.25, // $0.25 per watt for inverters
        rackingCostPerWatt = 0.20, // $0.20 per watt for racking
        installationCostPerWatt = 0.50, // $0.50 per watt for installation labor
        otherCostsPerWatt = 0.35, // $0.35 per watt for other costs
        includeStorage = false,
        storageSize = 0, // kWh
        storageCostPerKwh = 500, // $500 per kWh
        region = 'default',
        incentiveRate = 0.26, // 26% federal tax credit (default)
        landCostPerAcre = 0, // Land cost if purchasing
        landArea = 0 // Acres needed
    } = options;
    
    // Convert system size to watts
    const systemSizeWatts = systemSize * 1000;
    
    // Calculate component costs
    const panelCost = systemSizeWatts * panelCostPerWatt;
    const inverterCost = systemSizeWatts * inverterCostPerWatt;
    const rackingCost = systemSizeWatts * rackingCostPerWatt;
    const installationCost = systemSizeWatts * installationCostPerWatt;
    const otherCosts = systemSizeWatts * otherCostsPerWatt;
    
    // Calculate storage costs if included
    const storageCost = includeStorage ? storageSize * storageCostPerKwh : 0;
    
    // Calculate land costs if applicable
    const landCost = landCostPerAcre * landArea;
    
    // Calculate subtotal before incentives
    const subtotal = panelCost + inverterCost + rackingCost + installationCost + otherCosts + storageCost + landCost;
    
    // Apply regional cost adjustments
    const regionalCostFactors = {
        'california': 1.15,
        'northeast': 1.10,
        'southwest': 0.95,
        'midwest': 0.90,
        'southeast': 0.92,
        'northwest': 1.05,
        'default': 1.0
    };
    
    const regionKey = region.toLowerCase();
    const regionalFactor = regionalCostFactors[regionKey] || regionalCostFactors['default'];
    const regionalAdjustedCost = subtotal * regionalFactor;
    
    // Calculate incentives
    const incentives = regionalAdjustedCost * incentiveRate;
    
    // Calculate total cost after incentives
    const totalCost = regionalAdjustedCost - incentives;
    
    // Calculate cost per watt
    const costPerWatt = totalCost / systemSizeWatts;
    
    return {
        systemSize: {
            kW: systemSize,
            watts: systemSizeWatts
        },
        componentCosts: {
            panels: Math.round(panelCost),
            inverters: Math.round(inverterCost),
            racking: Math.round(rackingCost),
            installation: Math.round(installationCost),
            other: Math.round(otherCosts),
            storage: Math.round(storageCost),
            land: Math.round(landCost)
        },
        subtotal: Math.round(subtotal),
        regionalAdjustment: {
            factor: regionalFactor,
            region: region,
            adjustedCost: Math.round(regionalAdjustedCost)
        },
        incentives: Math.round(incentives),
        totalCost: Math.round(totalCost),
        costPerWatt: parseFloat(costPerWatt.toFixed(2))
    };
}

/**
 * Calculate wind installation costs
 * @param {number} capacity - Capacity in kW
 * @param {object} options - Additional options for calculation
 * @returns {object} Detailed cost breakdown
 */
function calculateWindInstallationCosts(capacity, options = {}) {
    const {
        turbineType = 'onshore', // 'onshore' or 'offshore'
        turbineCount = 1,
        turbineCostPerKw = 1300, // $1300 per kW for turbine
        foundationCostPerKw = 200, // $200 per kW for foundation
        electricalCostPerKw = 150, // $150 per kW for electrical
        gridConnectionCostPerKw = 250, // $250 per kW for grid connection
        installationCostPerKw = 300, // $300 per kW for installation
        otherCostsPerKw = 200, // $200 per kW for other costs
        region = 'default',
        incentiveRate = 0.26, // 26% federal tax credit (default)
        landCostPerAcre = 0, // Land cost if purchasing
        landArea = 0 // Acres needed
    } = options;
    
    // Adjust costs based on turbine type
    const typeMultiplier = turbineType === 'offshore' ? 2.5 : 1.0;
    
    // Calculate component costs
    const turbineCost = capacity * turbineCostPerKw * typeMultiplier;
    const foundationCost = capacity * foundationCostPerKw * typeMultiplier;
    const electricalCost = capacity * electricalCostPerKw;
    const gridConnectionCost = capacity * gridConnectionCostPerKw;
    const installationCost = capacity * installationCostPerKw * typeMultiplier;
    const otherCosts = capacity * otherCostsPerKw;
    
    // Calculate land costs if applicable
    const landCost = landCostPerAcre * landArea;
    
    // Calculate subtotal before incentives
    const subtotal = turbineCost + foundationCost + electricalCost + gridConnectionCost + installationCost + otherCosts + landCost;
    
    // Apply regional cost adjustments
    const regionalCostFactors = {
        'california': 1.15,
        'northeast': 1.10,
        'southwest': 0.95,
        'midwest': 0.90,
        'southeast': 0.92,
        'northwest': 1.05,
        'default': 1.0
    };
    
    const regionKey = region.toLowerCase();
    const regionalFactor = regionalCostFactors[regionKey] || regionalCostFactors['default'];
    const regionalAdjustedCost = subtotal * regionalFactor;
    
    // Calculate incentives
    const incentives = regionalAdjustedCost * incentiveRate;
    
    // Calculate total cost after incentives
    const totalCost = regionalAdjustedCost - incentives;
    
    // Calculate cost per kW
    const costPerKw = totalCost / capacity;
    
    return {
        capacity: {
            kW: capacity,
            MW: capacity / 1000
        },
        turbineDetails: {
            type: turbineType,
            count: turbineCount,
            capacityEach: capacity / turbineCount
        },
        componentCosts: {
            turbines: Math.round(turbineCost),
            foundation: Math.round(foundationCost),
            electrical: Math.round(electricalCost),
            gridConnection: Math.round(gridConnectionCost),
            installation: Math.round(installationCost),
            other: Math.round(otherCosts),
            land: Math.round(landCost)
        },
        subtotal: Math.round(subtotal),
        regionalAdjustment: {
            factor: regionalFactor,
            region: region,
            adjustedCost: Math.round(regionalAdjustedCost)
        },
        incentives: Math.round(incentives),
        totalCost: Math.round(totalCost),
        costPerKw: Math.round(costPerKw)
    };
}

/**
 * Calculate energy savings
 * @param {number} annualEnergyProduction - Annual energy production in kWh
 * @param {number} electricityRate - Electricity rate in $/kWh
 * @returns {number} Annual savings in $
 */
function calculateEnergySavings(annualEnergyProduction, electricityRate = 0.12) {
    return annualEnergyProduction * electricityRate;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateROI,
        calculateSolarInstallationCosts,
        calculateWindInstallationCosts,
        calculateEnergySavings
    };
}
