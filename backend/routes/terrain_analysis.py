from flask import Blueprint, jsonify, request
import requests
import math
import random

terrain_analysis_bp = Blueprint('terrain_analysis', __name__)

@terrain_analysis_bp.route('/', methods=['GET', 'POST'])
def terrain_analysis():
    # Get coordinates from request
    if request.method == 'POST':
        data = request.json
        lat = data.get('latitude')
        lng = data.get('longitude')
    else:  # GET method
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
    
    if not lat or not lng:
        return jsonify({'error': 'Latitude and longitude are required'}), 400
    
    try:
        # Fetch real elevation data from OpenTopoData API
        elevation_data = fetch_elevation_data(lat, lng)
        
        # Generate soil data based on location
        soil_data = generate_soil_data(lat, lng)
        
        # Calculate slope and other terrain metrics
        elevation_values = generate_elevation_profile(elevation_data['elevation'], lat, lng)
        slopes = calculate_slopes(elevation_values)
        avg_slope = sum(slopes) / len(slopes) if slopes else 5.0
        max_slope = max(slopes) if slopes else avg_slope * 1.8
        
        # Determine terrain roughness
        roughness = calculate_roughness(elevation_values)
        
        # Determine flow direction
        flow_direction = determine_flow_direction(lat, lng, elevation_data['elevation'])
        
        # Calculate flood risk
        flood_risk = calculate_flood_risk(elevation_data['elevation'], avg_slope)
        
        # Calculate water table depth
        water_table_depth = calculate_water_table_depth(elevation_data['elevation'], lat, lng)
        
        # Prepare response data
        response_data = {
            'elevation': elevation_data['elevation'],
            'elevationValues': elevation_values,
            'avgSlope': avg_slope,
            'maxSlope': max_slope,
            'roughness': roughness,
            'soilType': soil_data['soilType'],
            'foundationStrength': soil_data['foundationStrength'],
            'erosionRisk': soil_data['erosionRisk'],
            'flowDirection': flow_direction,
            'floodRisk': flood_risk,
            'waterTableDepth': water_table_depth
        }
        
        return jsonify(response_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def fetch_elevation_data(lat, lng):
    """Fetch elevation data from OpenTopoData API"""
    try:
        response = requests.get(
            f"https://api.opentopodata.org/v1/aster30m?locations={lat},{lng}",
            headers={'Accept': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'elevation': data['results'][0]['elevation']
            }
        else:
            # If API call fails, generate a realistic elevation based on coordinates
            return generate_fallback_elevation(lat, lng)
    
    except Exception:
        # If API call fails, generate a realistic elevation based on coordinates
        return generate_fallback_elevation(lat, lng)

def generate_fallback_elevation(lat, lng):
    """Generate realistic elevation data when API call fails"""
    # Use coordinates to generate a realistic elevation
    # Higher latitudes tend to have more varied terrain
    base_elevation = 200 + (abs(lat) % 10) * 10 + (abs(lng) % 10) * 5
    
    # Add some variation based on the coordinates
    variation = math.sin(lat * lng) * 50
    
    return {
        'elevation': base_elevation + variation
    }

def generate_soil_data(lat, lng):
    """Generate soil data based on location"""
    # Use coordinates to seed the random generation for consistency
    lat_seed = lat or 0
    lng_seed = lng or 0
    seed_value = (lat_seed * 10 + lng_seed) % 100
    
    # Generate soil type based on location
    soil_types = ['Sandy Loam', 'Clay', 'Silt', 'Rocky', 'Loamy Sand', 'Silty Clay']
    soil_type_index = math.floor((abs(lat_seed) + abs(lng_seed)) % len(soil_types))
    soil_type = soil_types[soil_type_index]
    
    # Generate foundation strength based on soil type
    foundation_strength = 'Moderate'
    if soil_type in ['Rocky', 'Clay']:
        foundation_strength = 'High'
    elif soil_type == 'Sandy Loam':
        foundation_strength = 'Moderate'
    else:
        foundation_strength = 'Low'
    
    # Generate erosion risk based on soil type and random factor
    erosion_risk = 'Medium'
    erosion_factor = math.sin(seed_value) * 5 + 5  # 0-10 scale
    
    if soil_type in ['Silt', 'Loamy Sand']:
        erosion_risk = 'High' if erosion_factor > 7 else 'Medium'
    elif soil_type in ['Rocky', 'Clay']:
        erosion_risk = 'Low' if erosion_factor < 3 else 'Medium'
    else:
        if erosion_factor > 8:
            erosion_risk = 'High'
        elif erosion_factor < 4:
            erosion_risk = 'Low'
        else:
            erosion_risk = 'Medium'
    
    return {
        'soilType': soil_type,
        'foundationStrength': foundation_strength,
        'erosionRisk': erosion_risk,
        'composition': {
            'sand': 30 + (math.sin(seed_value) * 20),
            'silt': 30 + (math.cos(seed_value) * 15),
            'clay': 20 + (math.sin(seed_value * 2) * 10),
            'organic': 5 + (math.cos(seed_value * 2) * 5)
        }
    }

def generate_elevation_profile(base_elevation, lat, lng):
    """Generate an elevation profile based on a central elevation value"""
    points = 20
    elevation_values = []
    
    # Use coordinates to seed the random generation for consistency
    seed = (lat * 10 + lng) % 100
    
    for i in range(points):
        # Create a natural-looking terrain profile with variations
        normalized_position = i / (points - 1)  # 0 to 1
        distance_from_center = abs(normalized_position - 0.5) * 2  # 0 at center, 1 at edges
        
        # Primary variation - larger scale terrain features
        primary_variation = math.sin((normalized_position * 4) + seed/10) * 5
        
        # Secondary variation - medium scale features
        secondary_variation = math.sin((normalized_position * 8) + seed/5) * 2
        
        # Micro variation - small details
        micro_variation = (math.sin((normalized_position * 20) + seed) * 1) * (1 - distance_from_center)
        
        # Random noise - very small irregularities
        noise = (random.random() - 0.5) * 0.5
        
        # Combine all variations, with more weight to the center of the profile
        total_variation = primary_variation + secondary_variation + micro_variation + noise
        
        # Scale variation based on elevation (higher elevations have more variation)
        scale_factor = max(1, math.log10(base_elevation) * 0.3)
        
        elevation_values.append(base_elevation + total_variation * scale_factor)
    
    return elevation_values

def calculate_slopes(elevation_values):
    """Calculate slope values from an elevation profile"""
    if not elevation_values or len(elevation_values) < 2:
        return [5]  # Default slope if not enough data
    
    slopes = []
    horizontal_distance = 100  # Assume 100m between points
    
    for i in range(1, len(elevation_values)):
        elevation_change = abs(elevation_values[i] - elevation_values[i-1])
        slope_percent = (elevation_change / horizontal_distance) * 100
        slope_degrees = math.atan(slope_percent/100) * (180/math.pi)
        slopes.append(slope_degrees)
    
    return slopes

def calculate_roughness(elevation_values):
    """Calculate terrain roughness from elevation values"""
    if not elevation_values or len(elevation_values) < 3:
        return 'Medium'  # Default if not enough data
    
    # Calculate standard deviation of elevation changes
    changes = []
    for i in range(1, len(elevation_values)):
        changes.append(abs(elevation_values[i] - elevation_values[i-1]))
    
    avg_change = sum(changes) / len(changes)
    variance = sum((val - avg_change) ** 2 for val in changes) / len(changes)
    std_dev = math.sqrt(variance)
    
    # Classify roughness based on standard deviation
    if std_dev < 1.5:
        return 'Low'
    elif std_dev < 4:
        return 'Medium'
    else:
        return 'High'

def determine_flow_direction(lat, lng, elevation):
    """Determine flow direction based on location and elevation"""
    # In a real application, this would analyze a DEM (Digital Elevation Model)
    # For now, we'll generate a realistic direction based on coordinates
    
    directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest']
    
    # Use coordinates and elevation to seed the direction
    direction_seed = (lat * lng * elevation) % 8
    direction_index = abs(math.floor(direction_seed))
    
    return directions[direction_index]

def calculate_flood_risk(elevation, slope):
    """Calculate flood risk based on elevation and slope"""
    # Lower elevations and flatter slopes have higher flood risk
    if elevation < 10 and slope < 2:
        return 'High'
    elif elevation < 50 and slope < 5:
        return 'Medium'
    elif elevation < 100 and slope < 3:
        return 'Medium'
    elif elevation > 200 or slope > 10:
        return 'Low'
    else:
        return 'Medium'

def calculate_water_table_depth(elevation, lat, lng):
    """Calculate water table depth based on elevation and location"""
    # In a real application, this would come from groundwater data
    # For now, we'll generate a realistic value based on elevation and location
    
    # Base depth increases with elevation
    base_depth = 3 + (elevation / 50)
    
    # Add variation based on location
    lat_variation = math.sin(lat) * 2
    lng_variation = math.cos(lng) * 2
    
    return max(1, base_depth + lat_variation + lng_variation)