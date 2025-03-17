// theme-switcher.js - Theme switching functionality for Reverse Green Energy Project

document.addEventListener('DOMContentLoaded', function() {
    // Create theme switcher element
    createThemeSwitcher();
    
    // Initialize theme from localStorage or default to dark
    initializeTheme();
    
    // Set up event listeners
    setupEventListeners();
});

function createThemeSwitcher() {
    const themeSwitcher = document.createElement('div');
    themeSwitcher.className = 'theme-switcher';
    themeSwitcher.innerHTML = `
        <div class="theme-switcher-toggle">
            <i class="fas fa-palette"></i>
        </div>
        <div class="theme-options">
            <div class="theme-option" data-theme="dark" title="Midnight Theme"></div>
            <div class="theme-option" data-theme="light" title="Light Theme"></div>
            <div class="theme-option" data-theme="ocean" title="Ocean Theme"></div>
            <div class="theme-option" data-theme="forest" title="Forest Theme"></div>
            <div class="theme-option" data-theme="desert" title="Desert Theme"></div>
        </div>
    `;
    document.body.appendChild(themeSwitcher);
}

function initializeTheme() {
    // Get saved theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('rge-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Mark the active theme in the switcher
    const activeThemeOption = document.querySelector(`.theme-option[data-theme="${savedTheme}"]`);
    if (activeThemeOption) {
        activeThemeOption.classList.add('active');
    }
}

function setupEventListeners() {
    // Toggle theme options visibility
    const themeToggle = document.querySelector('.theme-switcher-toggle');
    const themeOptions = document.querySelector('.theme-options');
    
    themeToggle.addEventListener('click', function() {
        themeOptions.classList.toggle('active');
    });
    
    // Theme selection
    const themeOptionElements = document.querySelectorAll('.theme-option');
    themeOptionElements.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            
            // Update active class
            document.querySelectorAll('.theme-option').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            
            // Apply theme
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('rge-theme', theme);
            
            // Update Three.js background if it exists
            if (typeof updateBackgroundColors === 'function') {
                updateBackgroundColors(theme);
            }
        });
    });
    
    // Close theme options when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.theme-switcher')) {
            themeOptions.classList.remove('active');
        }
    });
}

// Function to be called from three-background.js to update colors based on theme
function updateBackgroundColors(theme) {
    let colors = {
        nebula: 0x00C8FF,  // Default neon blue
        galaxy: 0x22C55E,  // Default eco green
        stars: 0xFFFFFF    // Default white
    };
    
    switch(theme) {
        case 'light':
            colors.nebula = 0x60A5FA;  // Lighter blue
            colors.galaxy = 0x34D399;  // Lighter green
            break;
        case 'ocean':
            colors.nebula = 0x0EA5E9;  // Ocean blue
            colors.galaxy = 0x0891B2;  // Teal
            break;
        case 'forest':
            colors.nebula = 0x16A34A;  // Forest green
            colors.galaxy = 0x65A30D;  // Lime green
            break;
        case 'desert':
            colors.nebula = 0xEA580C;  // Orange
            colors.galaxy = 0xF59E0B;  // Amber
            break;
    }
    
    // This function would be implemented in three-background.js
    if (window.updateThreeBackground) {
        window.updateThreeBackground(colors);
    }
}