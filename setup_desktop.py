from setuptools import setup

setup(
    name="RubikTimer",
    version="1.0",
    description="Rubik's Cube Timer Application",
    executables=[{
        "script": "main_desktop.py",
        "target_name": "RubikTimer",
        "icon": None  # Add path to icon file if you have one
    }]
)