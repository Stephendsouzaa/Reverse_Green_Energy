from flask import Blueprint, request, jsonify
from models.cost_savings import estimate_savings

cost_estimation_bp = Blueprint('cost_estimation', __name__)

@cost_estimation_bp.route('/', methods=['POST'])
def estimate():
    data = request.json
    savings = estimate_savings(data)
    return jsonify({'estimated_savings': savings})