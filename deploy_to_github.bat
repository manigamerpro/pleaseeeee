@echo off
echo Deploying Rubik Timer to GitHub...
echo ====================================

REM Check if git is available
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Git is not installed or not in PATH
    pause
    exit /b 1
)

REM Add all files
echo Adding files to Git...
git add .

REM Commit changes
echo Committing changes...
git commit -m "Update Rubik Timer app"

REM Push to GitHub (you'll need to set up the remote repository first)
echo Pushing to GitHub...
git push origin main

echo.
echo Deployment completed!
echo Make sure you've set up your GitHub repository and added it as a remote.
echo Use: git remote add origin https://github.com/yourusername/your-repo.git
pause