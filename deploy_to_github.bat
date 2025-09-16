@echo off
setlocal

echo Deploying Rubik Timer to GitHub...
echo.

REM Set repository configuration
set USERNAME=manigamerpro
set REPO_NAME=pleaseeeee

echo Configured repository: %REPO_NAME% for user: %USERNAME%
echo.

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git is not installed or not in PATH
    pause
    exit /b 1
)

REM Add all files
echo Adding files to git...
git add .; git status

REM Commit changes
echo.
echo Committing changes...
git commit -m "Deploy Rubik Timer application"

REM Push to GitHub
echo.
echo Pushing to GitHub repository...
git push -u origin main

echo.
echo Deployment completed!
echo.
echo To view your build:
echo 1. Visit https://github.com/%USERNAME%/%REPO_NAME%
echo 2. Click on the "Actions" tab
echo 3. Download the APK from the latest successful build artifacts
echo.

pause