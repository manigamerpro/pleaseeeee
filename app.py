from flask import Flask, jsonify, request, send_from_directory
import json
import os
from datetime import datetime

app = Flask(__name__)

# Enable CORS for mobile access
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Data storage paths
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
TIMES_FILE = os.path.join(DATA_DIR, 'times.json')
SETTINGS_FILE = os.path.join(DATA_DIR, 'settings.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Default cube types
DEFAULT_CUBE_TYPES = ["2x2", "3x3", "4x4", "5x5", "Pyraminx", "Megaminx", "Skewb", "Square-1", "Clock"]

# Initialize data files if they don't exist
def init_data_files():
    if not os.path.exists(TIMES_FILE):
        with open(TIMES_FILE, 'w') as f:
            json.dump({
                "times": [],
                "records": {},
                "cubes": DEFAULT_CUBE_TYPES
            }, f)
    
    if not os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'w') as f:
            json.dump({
                "language": "en",
                "enabledFeatures": {
                    "inspectionTimer": True,
                    "saveUnknownSolves": True
                },
                "timerDisplayDuration": 1500,
                "inspectionTime": 15,
                "inspectionDelay": 200
            }, f)

# Load data functions
def load_times():
    with open(TIMES_FILE, 'r') as f:
        return json.load(f)

def save_times(data):
    with open(TIMES_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def load_settings():
    with open(SETTINGS_FILE, 'r') as f:
        return json.load(f)

def save_settings(settings):
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)

# Routes
@app.route('/')
def index():
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'frontend'), 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'frontend'), path)

# API Routes
@app.route('/api/times', methods=['GET'])
def get_times():
    data = load_times()
    return jsonify(data['times'])

@app.route('/api/times', methods=['POST'])
def add_time():
    data = load_times()
    new_time = request.json
    new_time['id'] = max([t.get('id', 0) for t in data['times']], default=0) + 1
    new_time['timestamp'] = new_time.get('timestamp', datetime.now().isoformat())
    data['times'].append(new_time)
    save_times(data)
    return jsonify(new_time), 201

@app.route('/api/times/<int:time_id>', methods=['DELETE'])
def delete_time(time_id):
    data = load_times()
    data['times'] = [t for t in data['times'] if t.get('id') != time_id]
    save_times(data)
    return '', 204

@app.route('/api/times/<int:time_id>/type', methods=['PUT'])
def update_time_type(time_id):
    data = load_times()
    new_type = request.json.get('cube')
    
    for time_entry in data['times']:
        if time_entry.get('id') == time_id:
            time_entry['cube'] = new_type
            break
    
    save_times(data)
    return '', 204

@app.route('/api/times/clear', methods=['POST'])
def clear_all_times():
    data = load_times()
    data['times'] = []
    save_times(data)
    return '', 204

@app.route('/api/records', methods=['GET'])
def get_records():
    data = load_times()
    return jsonify(data['records'])

@app.route('/api/records', methods=['POST'])
def update_records():
    data = load_times()
    records = request.json
    data['records'] = records
    save_times(data)
    return '', 204

@app.route('/api/records/clear', methods=['POST'])
def clear_records():
    data = load_times()
    data['records'] = {}
    save_times(data)
    return '', 204

@app.route('/api/cubes', methods=['GET'])
def get_cubes():
    data = load_times()
    return jsonify(data['cubes'])

@app.route('/api/cubes', methods=['POST'])
def add_cube():
    data = load_times()
    new_cube = request.json.get('cube')
    
    if new_cube not in data['cubes']:
        data['cubes'].append(new_cube)
        save_times(data)
        return jsonify({'message': 'Cube added successfully'}), 201
    else:
        return jsonify({'error': 'Cube already exists'}), 400

@app.route('/api/cubes/<cube_name>', methods=['DELETE'])
def remove_cube(cube_name):
    data = load_times()
    if cube_name in data['cubes']:
        data['cubes'].remove(cube_name)
        data['times'] = [t for t in data['times'] if t.get('cube') != cube_name]
        save_times(data)
        return '', 204
    else:
        return jsonify({'error': 'Cube not found'}), 404

@app.route('/api/cubes/rename', methods=['POST'])
def rename_cube():
    data = load_times()
    old_name = request.json.get('oldName')
    new_name = request.json.get('newName')
    
    # Update cube list
    if old_name in data['cubes']:
        data['cubes'] = [new_name if c == old_name else c for c in data['cubes']]
    
    # Update times
    for time_entry in data['times']:
        if time_entry.get('cube') == old_name:
            time_entry['cube'] = new_name
    
    # Update records
    updated_records = {}
    for cube_type, record_data in data['records'].items():
        if cube_type == old_name:
            updated_records[new_name] = record_data
        elif cube_type != new_name:
            updated_records[cube_type] = record_data
    data['records'] = updated_records
    
    save_times(data)
    return '', 204

@app.route('/api/settings', methods=['GET'])
def get_settings():
    settings = load_settings()
    return jsonify(settings)

@app.route('/api/settings', methods=['POST'])
def update_settings():
    settings = request.json
    save_settings(settings)
    return '', 204

if __name__ == '__main__':
    init_data_files()
    # Try to use a production WSGI server if available
    try:
        import waitress
        print("Starting production server with Waitress...")
        waitress.serve(app, host='127.0.0.1', port=5000)
    except ImportError:
        print("Starting development server with Flask...")
        app.run(debug=False, host='127.0.0.1', port=5000, use_reloader=False)