import os
import logging
from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Import config
from config import SECRET_KEY, MAX_CONTENT_LENGTH, UPLOAD_FOLDER, ALLOWED_EXTENSIONS

# Create Flask application
app = Flask(__name__)
app.secret_key = SECRET_KEY
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure application
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Import routes
from routes import upload, study_plan, chat

# Register blueprints
app.register_blueprint(upload.bp)
app.register_blueprint(study_plan.bp)
app.register_blueprint(chat.bp)

@app.route('/')
def index():
    from flask import render_template
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
