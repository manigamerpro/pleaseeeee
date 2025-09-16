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

REM Try to find pyinstaller in the user scripts directory
set PYINSTALLER_PATH=%APPDATA%\Python\Python313\Scripts\pyinstaller.exe

REM Check if pyinstaller exists at the expected location
if not exist "%PYINSTALLER_PATH%" (
    REM Try to find pyinstaller in PATH
    where pyinstaller >nul 2>&1
    if errorlevel 1 (
        echo Error: Could not find pyinstaller executable
        pause
        exit /b 1
    ) else (
        set PYINSTALLER_PATH=pyinstaller
    )
)

REM Create the executable
echo Building executable with PyInstaller...
"%PYINSTALLER_PATH%" --onefile --windowed --add-data "frontend;frontend" --add-data "data;data" main_desktop.py

echo.
echo Build completed!
echo The executable can be found in the 'dist' folder
echo.

pause