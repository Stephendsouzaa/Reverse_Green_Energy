import os
from flask import Flask, jsonify, send_from_directory
from routes.solar_data import solar_data_bp
from routes.site_selection import site_selection_bp
from routes.predictions import predictions_bp
from routes.cost_estimation import cost_estimation_bp
from routes.terrain_analysis import terrain_analysis_bp

# Get the absolute path to the project root directory
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')
ASSETS_DIR = os.path.join(PROJECT_ROOT, 'assets')
FRONTEND_ASSETS_DIR = os.path.join(FRONTEND_DIR, 'assets')
COMPONENTS_DIR = os.path.join(PROJECT_ROOT, 'components')
CHARTS_DIR = os.path.join(PROJECT_ROOT, 'charts')

app = Flask(__name__)

# Register Blueprints for API routes
app.register_blueprint(solar_data_bp, url_prefix='/api/solar')
app.register_blueprint(site_selection_bp, url_prefix='/api/site-selection')
app.register_blueprint(predictions_bp, url_prefix='/api/predictions')
app.register_blueprint(cost_estimation_bp, url_prefix='/api/cost-estimation')
app.register_blueprint(terrain_analysis_bp, url_prefix='/api/terrain-analysis')

# Serve frontend HTML files
@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_frontend(filename):
    # Check if the file exists in the frontend directory
    frontend_path = os.path.join(FRONTEND_DIR, filename)
    if os.path.isfile(frontend_path):
        return send_from_directory(FRONTEND_DIR, filename)
    
    # If not found, return a 404 error
    return jsonify({"error": "File not found"}), 404

# Serve static assets from both locations
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    # First try to serve from the frontend/assets directory
    frontend_asset_path = os.path.join(FRONTEND_ASSETS_DIR, filename)
    if os.path.isfile(frontend_asset_path):
        return send_from_directory(FRONTEND_ASSETS_DIR, filename)
    
    # If not found in frontend/assets, serve from the main assets directory
    return send_from_directory(ASSETS_DIR, filename)

# Serve components
@app.route('/components/<path:filename>')
def serve_components(filename):
    return send_from_directory(COMPONENTS_DIR, filename)

# Serve charts
@app.route('/charts/<path:filename>')
def serve_charts(filename):
    return send_from_directory(CHARTS_DIR, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Use Render's assigned port
    app.run(host="0.0.0.0", port=port, debug=True)
