from flask import Blueprint, jsonify
from database.locations_data import get_locations

site_selection_bp = Blueprint('site_selection', __name__)

@site_selection_bp.route('/', methods=['GET'])
def fetch_sites():
    locations = list(get_locations())
    return jsonify(locations)