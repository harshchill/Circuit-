"""
Application configuration settings
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Flask configuration
SECRET_KEY = os.environ.get("SESSION_SECRET", "exam-pal-secret-key")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True) 