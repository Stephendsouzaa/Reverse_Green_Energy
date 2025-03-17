# Reverse Green Energy Project

A comprehensive web application for optimal location prediction of solar farms and data centers using AI-powered analysis, geospatial data, and renewable energy insights.

## Quick Start

1. Clone and navigate to the project:
   ```bash
   git clone [repository-url]
   cd Reverse-Green-Energy-Project
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   pip install -r backend/requirements.txt
   ```

3. Run the application:
   ```bash
   # Start MongoDB service first
   mongod --dbpath /path/to/data/db

   # Run the backend server
   cd Reverse-Green-Energy-Project
   python backend/app.py
   ```

## Technologies Used

### Frontend
- **React + Vite**: Modern web framework for building user interfaces
- **TailwindCSS**: Utility-first CSS framework for styling
- **Chart.js**: JavaScript charting library for data visualization
- **Leaflet.js**: Interactive maps and geospatial features
- **Context API**: State management solution

### Backend
- **Python Flask**: Lightweight WSGI web application framework
- **MongoDB**: NoSQL database for flexible data storage
- **NumPy/Pandas**: Data processing and analysis libraries
- **JWT**: Token-based authentication system

### External APIs
- **OpenWeatherMap API**: Real-time weather data and forecasts
- **NASA POWER Project API**: Solar radiation data
- **OpenStreetMap API**: Mapping and location data

## Features

### AI-Powered Site Selection
- **Solar Irradiance Analysis & Optimization**
  - High-resolution solar radiation mapping
  - Shading analysis and optimization
  - Annual/seasonal solar exposure prediction

- **Wind Speed & Weather Pattern Analysis**
  - Historical weather data analysis
  - Wind speed and direction modeling
  - Extreme weather risk assessment

- **Land Suitability & Terrain Assessment**
  - Topographical analysis
  - Soil composition evaluation
  - Land use and zoning compliance
  - Environmental sensitivity mapping

- **Grid Infrastructure Proximity**
  - Power grid connectivity analysis
  - Transmission line proximity
  - Substation capacity assessment
  - Infrastructure upgrade requirements

- **Environmental Impact Evaluation**
  - Wildlife habitat impact assessment
  - Carbon footprint analysis
  - Ecosystem preservation planning
  - Environmental compliance verification

### Energy Potential & Output Prediction
- **Advanced Machine Learning Models**
  - Deep learning for energy generation prediction
  - Pattern recognition for optimal performance
  - Adaptive learning from operational data

- **Real-time Energy Generation Forecasting**
  - Live weather data integration
  - Dynamic output adjustment
  - Predictive maintenance scheduling

- **Seasonal Performance Analysis**
  - Monthly/seasonal output variations
  - Weather impact modeling
  - Performance optimization strategies

- **ROI & Efficiency Calculations**
  - Detailed cost-benefit analysis
  - Investment return projections
  - Operational cost estimation
  - Efficiency optimization recommendations

### GIS & Mapping
- **Interactive 3D Map Visualization**
  - High-resolution terrain modeling
  - Dynamic view angle adjustment
  - Layer-based information display

- **Solar Radiation & Energy Heatmaps**
  - Annual solar exposure visualization
  - Seasonal variation mapping
  - Shadow impact analysis

- **Land Use & Zoning Analysis**
  - Current land use classification
  - Zoning regulation overlay
  - Future development planning

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Site Analysis Endpoints
- `GET /api/sites` - List all sites
- `POST /api/sites/analyze` - Analyze new site
- `GET /api/sites/{id}` - Get site details
- `PUT /api/sites/{id}` - Update site data

### Energy Prediction Endpoints
- `POST /api/predict/solar` - Solar energy prediction
- `POST /api/predict/wind` - Wind energy prediction
- `GET /api/predict/history` - Historical predictions

## Development Guidelines

### Code Style
- Follow PEP 8 for Python code
- Use ESLint for JavaScript/TypeScript
- Follow component-based architecture
- Implement proper error handling

### Testing
- Write unit tests for all components
- Implement integration tests
- Maintain minimum 80% code coverage
- Use pytest for backend testing
- Use Jest for frontend testing

### Version Control
- Follow Git Flow branching model
- Write descriptive commit messages
- Review code before merging
- Tag releases with semantic versioning

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

## Acknowledgments

- OpenWeatherMap API for weather data
- NASA POWER Project for solar radiation data
- OpenStreetMap for mapping data
- Contributors and maintainers