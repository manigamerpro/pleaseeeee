import threading
import webview
from app import app, init_data_files
import waitress
import os

def start_server():
    """Start the Flask server in a separate thread"""
    init_data_files()
    waitress.serve(app, host='127.0.0.1', port=5000)

def create_app():
    """Create and run the desktop application"""
    # Start Flask server in a separate thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Create webview window
    webview.create_window(
        "Rubik Timer",
        "http://127.0.0.1:5000",
        width=360,
        height=640,
        resizable=True,
        fullscreen=False
    )
    
    # Start the webview
    webview.start(debug=False)

if __name__ == '__main__':
    create_app()