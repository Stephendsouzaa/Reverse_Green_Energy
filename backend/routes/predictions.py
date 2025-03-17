from flask import Blueprint, request, jsonify
from models.energy_prediction import predict_energy

predictions_bp = Blueprint('predictions', __name__)

@predictions_bp.route('/', methods=['POST'])
def predict():
    data = request.json
    prediction = predict_energy(data)
    return jsonify({'predicted_output': prediction})