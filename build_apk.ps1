# Build Rubik Timer APK
Write-Host "Building Rubik Timer APK..." -ForegroundColor Green
Write-Host "This may take several minutes..." -ForegroundColor Yellow

# Check if buildozer is installed
try {
    python -c "import buildozer" > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Buildozer not found"
    }
} catch {
    Write-Host "Installing buildozer..." -ForegroundColor Yellow
    pip install buildozer
}

# Build the APK
Write-Host "Starting build process..." -ForegroundColor Yellow
buildozer android debug

Write-Host ""
Write-Host "Build process completed!" -ForegroundColor Green
Write-Host "Check the 'bin' directory for your APK file."