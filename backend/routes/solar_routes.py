from flask import Blueprint, jsonify, request
import requests

solar_bp = Blueprint('solar', __name__)

# PVGIS API configuration
PVGIS_API_BASE = 'https://re.jrc.ec.europa.eu/api/v5/'

@solar_bp.route('/api/solar/solar-data', methods=['GET'])
def get_solar_data():
    try:
        # Get latitude and longitude from query parameters
        lat = request.args.get('lat')
        lon = request.args.get('lon')

        if not lat or not lon:
            return jsonify({
                'error': 'Latitude and longitude are required'
            }), 400

        # Construct PVGIS API URL
        url = f"{PVGIS_API_BASE}seriescalc?lat={lat}&lon={lon}&raddatabase=PVGIS-SARAH2&outputformat=json&pvcalculation=1&pvtechchoice=crystSi&mountingplace=free&loss=14&trackingtype=0&startyear=2020&endyear=2020"

        # Make request to PVGIS API
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()

        # Transform data for frontend
        monthly_data = data.get('outputs', {}).get('monthly', {}).get('fixed', [])
        
        if not monthly_data:
            return jsonify({
                'error': 'No solar data available for this location'
            }), 404

        # Format response data
        solar_data = [{
            'latitude': float(lat),
            'longitude': float(lon),
            'location': f'Location ({lat}, {lon})',
            'solar_irradiance': round(sum(month['H(i)_m'] for month in monthly_data) / len(monthly_data), 2)
        }]

        return jsonify(solar_data)

    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': f'Error fetching solar data: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'error': f'Unexpected error: {str(e)}'
        }), 500