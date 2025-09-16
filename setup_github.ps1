# Setup GitHub Repository for Rubik Timer
Write-Host "Setting up GitHub repository for Rubik Timer..." -ForegroundColor Green

# Check if git is available
try {
    git --version > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Git not found"
    }
} catch {
    Write-Host "Error: Git is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Get repository name from user
$repoName = Read-Host "Enter your GitHub repository name (e.g., rubik-timer-mobile)"

# Get username from user
$username = Read-Host "Enter your GitHub username"

# Create remote repository URL
$remoteUrl = "https://github.com/$username/$repoName.git"

# Add remote repository
Write-Host "Adding remote repository..." -ForegroundColor Yellow
git remote add origin $remoteUrl

# Push to GitHub
Write-Host "Pushing code to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host "1. Go to https://github.com/$username/$repoName" -ForegroundColor Cyan
Write-Host "2. Click on the 'Actions' tab to see the build progress" -ForegroundColor Cyan
Write-Host "3. When the build is complete, download the APK from the artifacts" -ForegroundColor Cyan