# Rubik's Cube Timer - Mobile App

A Python-based Rubik's Cube timer application packaged as an Android APK.

## Features
- Professional Rubik's Cube timing with inspection timer
- Multiple cube types support (2x2, 3x3, 4x4, 5x5, Pyraminx, Megaminx, etc.)
- Time tracking and record keeping
- Multi-language support (English and Persian)
- Export/import functionality for times and settings

## Directory Structure
```
mobile-app/
├── src/              # Source code and build configurations
│   ├── app.py        # Flask backend server
│   ├── main.py       # Kivy mobile app wrapper
│   ├── requirements.txt
│   ├── buildozer.spec
│   └── setup.py
├── frontend/         # Web frontend files
│   ├── index.html
│   ├── styles.css
│   └── *.js
├── data/             # Data storage (created at runtime)
└── README.md
```

## Building the APK

### Option 1: Using Docker (Recommended for Windows)
```bash
docker build -t rubik-timer .
docker run -v ${PWD}/bin:/app/bin rubik-timer
```

### Option 2: Using Buildozer directly (Linux/macOS)
```bash
pip install buildozer
buildozer android debug
```

### Option 3: Using GitHub Actions
Push to a GitHub repository with the included workflow file.

## Requirements
- Python 3.7+
- Flask
- Kivy
- Buildozer (for Android packaging)

## Data Storage
All data (times, records, settings) is stored in JSON files in the `data/` directory.