FROM kivy/buildozer:latest

WORKDIR /app

# Copy all files
COPY . .

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Ensure Android SDK and NDK are properly set up
RUN buildozer android debug

# Build the APK
CMD ["buildozer", "android", "debug"]