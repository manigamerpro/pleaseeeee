import threading
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.clock import Clock
from kivy.core.window import Window
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import your Flask app
try:
    from app import app as flask_app, init_data_files
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False
    print("Flask app not found")

# Set window size for mobile-like experience
Window.size = (360, 640)

class RubikTimerApp(App):
    def build(self):
        # Initialize data files
        if FLASK_AVAILABLE:
            init_data_files()
            
        # Start Flask app in a separate thread
        if FLASK_AVAILABLE:
            Clock.schedule_once(self.start_flask_server, 0)
        
        # Create main layout
        layout = BoxLayout(orientation='vertical', padding=20, spacing=10)
        
        # Add title
        title = Label(text='Rubik Timer', size_hint_y=None, height=50, 
                     font_size=24, color=(0.7, 0.8, 1, 1))
        layout.add_widget(title)
        
        # Add status message
        message = Label(text='Rubik Timer Server is Running\n\nAccess the app at:\nhttp://127.0.0.1:5000', 
                       halign='center', valign='middle')
        layout.add_widget(message)
        
        # Add status indicator
        status = Label(text='Status: Server Running', size_hint_y=None, height=30,
                      color=(0.5, 1, 0.5, 1))
        layout.add_widget(status)
        
        # Add instructions
        instructions = Label(text='Open your device browser and go to http://127.0.0.1:5000 to use the app',
                            halign='center', valign='middle', font_size=12)
        layout.add_widget(instructions)
        
        return layout
    
    def start_flask_server(self, dt=None):
        """Start the Flask server in a separate thread"""
        def run_flask():
            try:
                flask_app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
            except Exception as e:
                print(f"Error starting Flask server: {e}")
        
        flask_thread = threading.Thread(target=run_flask, daemon=True)
        flask_thread.start()

    def on_start(self):
        """Called when the application starts"""
        print("Rubik Timer App Started")

    def on_stop(self):
        """Called when the application stops"""
        print("Rubik Timer App Stopped")

if __name__ == '__main__':
    RubikTimerApp().run()