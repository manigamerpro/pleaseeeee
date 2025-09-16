#!/usr/bin/env python3
"""
Verification script to check if all required files are present
for building the Rubik Timer APK.
"""

import os
import sys

def check_file_exists(filepath, description):
    """Check if a file exists and print status"""
    if os.path.exists(filepath):
        print(f"✓ {description} - Found")
        return True
    else:
        print(f"✗ {description} - Missing")
        return False

def main():
    print("Verifying Rubik Timer APK setup...")
    print("=" * 40)
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # List of required files and their descriptions
    required_files = [
        ("app.py", "Main Flask application"),
        ("main_mobile.py", "Kivy mobile wrapper"),
        ("requirements.txt", "Python dependencies"),
        ("buildozer.spec", "Build configuration"),
        ("frontend/index.html", "Main HTML file"),
        ("frontend/styles.css", "CSS styles"),
        ("frontend/app.js", "JavaScript code"),
    ]
    
    # Check each required file
    all_good = True
    for filename, description in required_files:
        filepath = os.path.join(script_dir, filename)
        if not check_file_exists(filepath, description):
            all_good = False
    
    print("=" * 40)
    
    if all_good:
        print("✓ All required files are present!")
        print("You're ready to build your APK.")
        print("Run 'build_apk.bat' or 'build_apk.ps1' to start the build process.")
    else:
        print("✗ Some required files are missing!")
        print("Please check your directory structure.")
        
    return all_good

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)