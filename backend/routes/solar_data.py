from flask import Blueprint, jsonify
import json
import os
from pathlib import Path

solar_data_bp = Blueprint('solar_data', __name__)

@solar_data_bp.route('/solar-data', methods=['GET'])
def get_solar_data():
    try:
        # Get the project root directory
        project_root = Path(__file__).parent.parent.parent
        data_file = project_root / 'datasets' / 'solar-irradiance.json'

        # Check if file exists
        if not data_file.exists():
            return jsonify({
                'error': 'Solar data file not found',
                'message': 'The solar irradiance data is currently unavailable'
            }), 404

        # Read and parse the JSON file
        with open(data_file, 'r') as f:
            solar_data = json.load(f)

        return jsonify({
            'success': True,
            'data': solar_data
        }), 200

    except json.JSONDecodeError:
        return jsonify({
            'error': 'Invalid data format',
            'message': 'The solar data file is corrupted or malformed'
        }), 500
    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': f'An unexpected error occurred: {str(e)}'
        }), 500