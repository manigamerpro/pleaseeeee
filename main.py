import threading
from kivy.app import App
from kivy.uix.widget import Widget
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.gridlayout import GridLayout
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

# Try to import WebView
try:
    from kivy.uix.webview import WebView
    WEBVIEW_AVAILABLE = True
except ImportError:
    WEBVIEW_AVAILABLE = False
    print("WebView not available, using fallback interface")

# Set window size for mobile-like experience
Window.size = (360, 640)

# Create a screen for the web view
class WebScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Create layout
        layout = BoxLayout(orientation='vertical')
        
        if WEBVIEW_AVAILABLE:
            # Use WebView if available
            try:
                webview = WebView(url='http://127.0.0.1:5000')
                layout.add_widget(webview)
            except Exception as e:
                print(f"Error creating WebView: {e}")
                self.create_fallback_ui(layout)
        else:
            # Create fallback UI
            self.create_fallback_ui(layout)
        
        self.add_widget(layout)
    
    def create_fallback_ui(self, layout):
        """Create a fallback UI when WebView is not available"""
        # Add a simple web view placeholder
        web_placeholder = BoxLayout(orientation='vertical', padding=20, spacing=10)
        
        title = Label(text='Rubik Timer', size_hint_y=None, height=50, 
                     font_size=24, color=(0.7, 0.8, 1, 1))
        web_placeholder.add_widget(title)
        
        message = Label(text='Your Rubik Timer app is ready!\n\nAccess it in your browser at:\nhttp://127.0.0.1:5000', 
                       halign='center', valign='middle')
        web_placeholder.add_widget(message)
        
        status = Label(text='Status: Server Running', size_hint_y=None, height=30,
                      color=(0.5, 1, 0.5, 1))
        web_placeholder.add_widget(status)
        
        # Add refresh button
        refresh_btn = Button(text='Refresh Status', size_hint_y=None, height=50)
        refresh_btn.bind(on_press=self.refresh_status)
        web_placeholder.add_widget(refresh_btn)
        
        layout.add_widget(web_placeholder)
    
    def refresh_status(self, instance):
        """Refresh the status display"""
        # In a real implementation, you could check if the server is running
        pass


class RubikTimerApp(App):
    def build(self):
        # Initialize data files
        if FLASK_AVAILABLE:
            init_data_files()
            
        # Start Flask app in a separate thread
        if FLASK_AVAILABLE:
            Clock.schedule_once(self.start_flask_server, 0)
        
        # Create screen manager
        sm = ScreenManager()
        
        # Add web screen
        web_screen = WebScreen(name='web')
        sm.add_widget(web_screen)
        
        return sm
    
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