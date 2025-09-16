@echo off
echo Building Rubik Timer Desktop Application...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Install PyInstaller if not already installed
echo Installing PyInstaller...
pip install pyinstaller

REM Create the executable
echo Building executable with PyInstaller...
pyinstaller --onefile --windowed --add-data "frontend;frontend" --add-data "data;data" main_desktop.py

echo.
echo Build completed!
echo The executable can be found in the 'dist' folder
echo.

pause