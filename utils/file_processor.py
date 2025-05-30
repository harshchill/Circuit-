"""
File processing utilities for Exam Pal
Handles PDF text extraction and image processing
"""

import os
import logging
import tempfile
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import PyPDF2
from werkzeug.utils import secure_filename
from PIL import Image
import requests

from config import ALLOWED_EXTENSIONS, UPLOAD_FOLDER

def allowed_file(filename: str) -> bool:
    """Check if a file has an allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file, upload_dir: str = None) -> Tuple[bool, str, Optional[str]]:
    """
    Save an uploaded file to the specified directory
    
    Args:
        file: The file object from the request
        upload_dir: Directory to save the file (defaults to app's UPLOAD_FOLDER)
        
    Returns:
        Tuple of (success: bool, message: str, saved_path: Optional[str])
    """
    if upload_dir is None:
        upload_dir = UPLOAD_FOLDER
    
    if not file:
        return False, "No file provided", None
    
    if file.filename == '':
        return False, "No file selected", None
    
    if not allowed_file(file.filename):
        return False, f"File type not allowed. Supported types: {', '.join(ALLOWED_EXTENSIONS)}", None
    
    try:
        # Secure the filename to prevent path traversal attacks
        filename = secure_filename(file.filename)
        
        # Create a unique filename to prevent overwrites
        base, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(os.path.join(upload_dir, filename)):
            filename = f"{base}_{counter}{ext}"
            counter += 1
        
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        return True, "File uploaded successfully", file_path
    except Exception as e:
        logging.error(f"Error saving file: {str(e)}")
        return False, f"Error saving file: {str(e)}", None

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text content from a PDF file
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Extracted text as a string
    """
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            num_pages = len(reader.pages)
            
            for page_num in range(num_pages):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n\n"
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {str(e)}")
        text = f"[Error extracting text: {str(e)}]"
    
    return text

def upload_to_groq_vision(file_path: str) -> str:
    """
    Upload an image file to Groq Vision for processing.

    Args:
        file_path: Path to the image file.

    Returns:
        The file ID returned by Groq Vision.
    """
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
    GROQ_VISION_URL = "https://api.groq.com/vision/v1/upload"

    if not GROQ_API_KEY:
        raise ValueError("Groq API key is not set in the environment variables.")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    with open(file_path, "rb") as file:
        files = {"file": file}
        response = requests.post(GROQ_VISION_URL, headers=headers, files=files)

    if response.status_code != 200:
        raise Exception(f"Failed to upload file to Groq Vision: {response.text}")

    return response.json().get("id")

def extract_text_from_image_with_groq(file_path: str) -> str:
    """
    Extract text from an image using Groq Vision.

    Args:
        file_path: Path to the image file.

    Returns:
        Extracted text as a string.
    """
    file_id = upload_to_groq_vision(file_path)
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
    GROQ_VISION_PROCESS_URL = f"https://api.groq.com/vision/v1/process/{file_id}"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    response = requests.get(GROQ_VISION_PROCESS_URL, headers=headers)

    if response.status_code != 200:
        raise Exception(f"Failed to process file with Groq Vision: {response.text}")

    return response.json().get("text", "")

# Update the existing extract_text_from_image function to use Groq Vision
def extract_text_from_image(image_path: str) -> str:
    """
    Extract text from an image using Groq Vision.

    Args:
        image_path: Path to the image file.

    Returns:
        Extracted text as a string.
    """
    try:
        return extract_text_from_image_with_groq(image_path)
    except Exception as e:
        logging.error(f"Error extracting text from image using Groq Vision: {str(e)}")
        return f"[Error extracting text: {str(e)}]"

def process_file(file_path: str) -> Dict:
    """
    Process an uploaded file and extract its content
    
    Args:
        file_path: Path to the uploaded file
        
    Returns:
        Dictionary with file info and extracted content
    """
    file_info = {
        'path': file_path,
        'name': os.path.basename(file_path),
        'size': os.path.getsize(file_path),
        'content': "",
        'type': ""
    }
    
    # Determine file type and extract content
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.pdf':
        file_info['type'] = 'pdf'
        file_info['content'] = extract_text_from_pdf(file_path)
    elif ext in ['.jpg', '.jpeg', '.png']:
        file_info['type'] = 'image'
        file_info['content'] = extract_text_from_image(file_path)
    else:
        file_info['type'] = 'unknown'
        file_info['content'] = "[Unsupported file type]"
    
    return file_info

def get_all_uploaded_files(user_id: str = "default") -> List[Dict]:
    """
    Get information about all uploaded files for a user
    
    Args:
        user_id: Identifier for the user (for future multi-user support)
        
    Returns:
        List of dictionaries with file information
    """
    upload_dir = UPLOAD_FOLDER
    files = []
    
    try:
        for filename in os.listdir(upload_dir):
            file_path = os.path.join(upload_dir, filename)
            if os.path.isfile(file_path):
                file_info = {
                    'path': file_path,
                    'name': filename,
                    'size': os.path.getsize(file_path),
                    'type': os.path.splitext(filename)[1].lower()[1:]  # Extension without dot
                }
                files.append(file_info)
    except Exception as e:
        logging.error(f"Error getting uploaded files: {str(e)}")
    
    return files

def delete_file(file_path: str) -> Tuple[bool, str]:
    """
    Delete an uploaded file
    
    Args:
        file_path: Path to the file to delete
        
    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True, "File deleted successfully"
        else:
            return False, "File not found"
    except Exception as e:
        logging.error(f"Error deleting file: {str(e)}")
        return False, f"Error deleting file: {str(e)}"
