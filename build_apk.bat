@echo off
echo Building Rubik Timer APK...
echo This may take several minutes...

REM Check if buildozer is installed
python -c "import buildozer" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing buildozer...
    pip install buildozer
)

REM Build the APK
echo Starting build process...
buildozer android debug

echo.
echo Build process completed!
echo Check the 'bin' directory for your APK file.
pause