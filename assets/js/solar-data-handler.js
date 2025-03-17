// Solar Data Handler Module
const SolarDataHandler = {
    async fetchSolarData(lat = null, lon = null) {
        try {
            // Get coordinates from input fields if not provided
            if (!lat || !lon) {
                lat = document.getElementById('latInput').value;
                lon = document.getElementById('lngInput').value;
            }

            if (!lat || !lon) {
                throw new Error('Please select a location first');
            }

            const response = await fetch(`/api/solar/solar-data?lat=${lat}&lon=${lon}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch solar data');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching solar data:', error);
            throw new Error(error.message || 'Unable to fetch solar data. Please try again later.');
        }
    },

    displaySolarData(map, data) {
        try {
            // Clear existing layers
            if (this.solarLayer) {
                map.removeLayer(this.solarLayer);
            }

            // Create markers for each solar data point
            const markers = data.map(point => {
                const marker = L.marker([point.latitude, point.longitude]);
                marker.bindPopup(`
                    <h3>${point.location}</h3>
                    <p>Solar Irradiance: ${point.solar_irradiance} kWh/m²/day</p>
                `);
                return marker;
            });

            // Create a marker cluster group
            this.solarLayer = L.markerClusterGroup();
            this.solarLayer.addLayers(markers);
            map.addLayer(this.solarLayer);

            // Fit map bounds to show all markers
            const bounds = L.featureGroup(markers).getBounds();
            map.fitBounds(bounds);

            return true;
        } catch (error) {
            console.error('Error displaying solar data:', error);
            throw new Error('Error displaying solar data on the map');
        }
    },

    async initializeSolarMap(mapId) {
        try {
            // Initialize map
            const map = L.map(mapId).setView([39.8283, -98.5795], 4);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add loading indicator
            const loadingDiv = document.getElementById('loading');
            loadingDiv.classList.remove('hidden');

            // Fetch and display solar data
            const solarData = await this.fetchSolarData();
            this.displaySolarData(map, solarData);

            // Hide loading indicator
            loadingDiv.classList.add('hidden');

            return map;
        } catch (error) {
            // Hide loading indicator
            document.getElementById('loading').classList.add('hidden');

            // Show error message
            const errorDiv = document.getElementById('error-message');
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');

            // Auto-hide error after 5 seconds
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);

            throw error;
        }
    }
};

export default SolarDataHandler;