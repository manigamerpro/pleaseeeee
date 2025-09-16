# Build Rubik Timer Desktop Application
Write-Host "Building Rubik Timer Desktop Application..." -ForegroundColor Green
Write-Host ""

# Check if Python is available
try {
    python --version > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
}
catch {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Install PyInstaller if not already installed
Write-Host "Installing PyInstaller..." -ForegroundColor Yellow
pip install pyinstaller

# Create the executable
Write-Host "Building executable with PyInstaller..." -ForegroundColor Yellow
pyinstaller --onefile --windowed --add-data "frontend;frontend" --add-data "data;data" main_desktop.py

Write-Host ""
Write-Host "Build completed!" -ForegroundColor Green
Write-Host "The executable can be found in the 'dist' folder" -ForegroundColor Cyan
Write-Host ""