/**
 * Main JavaScript file for Reverse Green Energy Project
 * Handles common functionality across all pages
 */

// Global application state
const appState = {
    currentUser: null,
    selectedLocation: null,
    projectSettings: {
        systemType: 'solar',
        systemSize: 1000, // kW
        region: 'california'
    },
    apiKeys: {
        mapbox: 'pk.sample.mapbox.key', // Replace with actual key in production
        openWeather: 'sample.openweather.key' // Replace with actual key in production
    }
};

/**
 * Initialize the application
 */
function initializeApp() {
    console.log("Reverse Green Energy Application Initialized");
    
    // Set up event listeners for common elements
    setupEventListeners();
    
    // Load user preferences from localStorage if available
    loadUserPreferences();
    
    // Check if API keys are configured
    validateApiConfiguration();
    
    // Initialize page-specific functionality
    initializeCurrentPage();
}

/**
 * Set up event listeners for common elements across all pages
 */
function setupEventListeners() {
    // Mobile menu toggle (if present)
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }
    
    // Theme toggle (if present)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Add event listener for form submissions to prevent default behavior
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        if (!form.hasAttribute('data-no-prevent')) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Form submission intercepted:', form.id);
                // Form-specific handling is done in the page-specific JS files
            });
        }
    });
}

/**
 * Load user preferences from localStorage
 */
function loadUserPreferences() {
    try {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
            const preferences = JSON.parse(savedPreferences);
            
            // Apply dark mode if saved
            if (preferences.darkMode) {
                document.documentElement.classList.add('dark-mode');
            }
            
            // Apply saved region if available
            if (preferences.region) {
                appState.projectSettings.region = preferences.region;
                
                // Update region select if it exists on the page
                const regionSelect = document.getElementById('region') || document.getElementById('region-select');
                if (regionSelect) {
                    regionSelect.value = preferences.region;
                }
            }
            
            console.log("User preferences loaded");
        }
    } catch (error) {
        console.error("Error loading user preferences:", error);
    }
}

/**
 * Save user preferences to localStorage
 */
function saveUserPreferences() {
    try {
        const preferences = {
            darkMode: document.documentElement.classList.contains('dark-mode'),
            region: appState.projectSettings.region,
            systemType: appState.projectSettings.systemType,
            lastVisit: new Date().toISOString()
        };
        
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        console.log("User preferences saved");
    } catch (error) {
        console.error("Error saving user preferences:", error);
    }
}

/**
 * Toggle mobile menu visibility
 */
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark-mode');
    saveUserPreferences();
}

/**
 * Validate API configuration
 */
function validateApiConfiguration() {
    // Check if API keys are properly configured
    if (appState.apiKeys.mapbox === 'pk.sample.mapbox.key') {
        console.warn("Mapbox API key not configured. Map functionality may be limited.");
    }
    
    if (appState.apiKeys.openWeather === 'sample.openweather.key') {
        console.warn("OpenWeather API key not configured. Weather data may be unavailable.");
    }
}

/**
 * Initialize page-specific functionality based on current page
 */
function initializeCurrentPage() {
    // Determine current page based on URL path
    const path = window.location.pathname;
    const page = path.split('/').pop();
    
    console.log(`Current page: ${page}`);
    
    // Add active class to current navigation item
    highlightCurrentNavItem(page);
    
    // Initialize page-specific functionality
    switch (page) {
        case '':
        case 'index.html':
            // Home page initialization
            break;
            
        case 'site-selection.html':
            // Site selection page initialization
            break;
            
        case 'energy-prediction.html':
            // Energy prediction page initialization
            break;
            
        case 'gis-mapping.html':
            // GIS mapping page initialization
            break;
            
        case 'cost-estimation.html':
            // Cost estimation page initialization
            break;
            
        case 'dashboard.html':
            // Dashboard page initialization
            break;
            
        default:
            console.log("Unknown page, no specific initialization");
    }
}

/**
 * Highlight the current navigation item
 * @param {string} currentPage - Current page filename
 */
function highlightCurrentNavItem(currentPage) {
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Remove existing active class
        link.classList.remove('bg-green-500');
        
        // Add active class to current page link
        if ((currentPage === '' || currentPage === 'index.html') && href === 'index.html') {
            link.classList.add('bg-green-500');
        } else if (href === currentPage) {
            link.classList.add('bg-green-500');
        }
    });
}

/**
 * Format number with commas for thousands
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted currency value
 */
function formatCurrency(value, decimals = 0) {
    return '$' + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Make an API request with error handling
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise} Promise resolving to JSON response
 */
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("API request error:", error);
        throw error;
    }
}

/**
 * Show a notification message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success', 'error', 'info')
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.color = 'white';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease-in-out';
        document.body.appendChild(notification);
    }
    
    // Set notification style based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#10B981'; // Green
            break;
        case 'error':
            notification.style.backgroundColor = '#EF4444'; // Red
            break;
        case 'info':
        default:
            notification.style.backgroundColor = '#3B82F6'; // Blue
    }
    
    // Set message and show notification
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Hide notification after duration
    setTimeout(() => {
        notification.style.opacity = '0';
    }, duration);
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);

// Export utility functions for use in other modules
if (typeof window !== 'undefined') {
    window.appUtils = {
        formatNumber,
        formatCurrency,
        apiRequest,
        showNotification
    };
}
