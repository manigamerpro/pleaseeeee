# Rubik's Cube Timer - Mobile App (Simple Instructions)

## What's in this folder?
All the files needed to build your Rubik's Cube Timer app into an Android APK.

## Directory Structure:
```
mobile-app/
├── app.py              # Main Flask server
├── main_mobile.py      # Kivy mobile app wrapper
├── requirements.txt    # Python dependencies
├── buildozer.spec      # Android build configuration
├── build_apk.bat       # Windows batch build script
├── build_apk.ps1       # PowerShell build script
├── frontend/           # Web interface files
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── language files
└── data/               # App data (created automatically)
```

## How to Build the APK:

### Option 1: Double-click method (Windows)
1. Double-click on `build_apk.bat`
2. Wait for the build to complete (10-30 minutes)
3. Find your APK in the `bin/` folder

### Option 2: Command line method
1. Open Command Prompt or PowerShell
2. Navigate to this folder:
   ```cmd
   cd c:\Users\manigamerpro\rubik-timer\mobile-app
   ```
3. Run the build script:
   ```cmd
   build_apk.bat
   ```
   or
   ```powershell
   .\build_apk.ps1
   ```

## What happens during the build?
1. Downloads Android SDK/NDK (only on first run)
2. Compiles your Python code
3. Packages everything into an APK
4. Places the APK in the `bin/` folder

## How to install the APK:
1. Connect your Android phone to your computer
2. Copy the APK from `bin/` to your phone
3. On your phone, open the APK file and install it

## Need help?
If you get any errors during the build:
1. Make sure you have a good internet connection
2. Make sure you have at least 4GB free disk space
3. Try running the build script as Administrator