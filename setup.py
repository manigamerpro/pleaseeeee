from setuptools import setup, find_packages

setup(
    name='rubik-timer',
    version='1.0.0',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'Flask>=2.0.1',
        'Flask-CORS>=3.0.10',
        'waitress>=2.1.2',
    ],
    entry_points={
        'console_scripts': [
            'rubik-timer=main:main',
        ],
    },
    package_data={
        '': ['frontend/*.html', 'frontend/*.css', 'frontend/*.js'],
    },
    data_files=[
        ('frontend', [
            'frontend/index.html',
            'frontend/styles.css',
            'frontend/app_clean.js',
            'frontend/lang_en.js',
            'frontend/lang_fa.js',
            'frontend/lang_manager.js'
        ]),
    ],
)