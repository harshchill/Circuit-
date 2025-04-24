"""
Route handlers for file upload functionality
"""

import os
import logging
from typing import List, Dict

from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

from utils.file_processor import save_uploaded_file, process_file, get_all_uploaded_files, delete_file

bp = Blueprint('upload', __name__, url_prefix='/api')

@bp.route('/upload', methods=['POST'])
def upload_files():
    """
    Handle file uploads
    
    Accepts:
        - files: One or more files in the request
        
    Returns:
        JSON response with upload status and file information
    """
    # Check if any file was included in the request
    if 'files' not in request.files:
        return jsonify({'success': False, 'message': 'No files in request'}), 400
    
    files = request.files.getlist('files')
    
    # Check if any files were selected
    if not files or files[0].filename == '':
        return jsonify({'success': False, 'message': 'No files selected'}), 400
    
    # Process each uploaded file
    uploaded_files = []
    
    for file in files:
        success, message, file_path = save_uploaded_file(file)
        
        if success and file_path:
            # Process the file to extract content
            file_info = process_file(file_path)
            uploaded_files.append(file_info)
            logging.info(f"Successfully processed file: {file.filename}")
        else:
            logging.warning(f"Failed to upload file {file.filename}: {message}")
    
    if uploaded_files:
        return jsonify({
            'success': True,
            'message': f'Successfully uploaded {len(uploaded_files)} file(s)',
            'files': uploaded_files
        })
    else:
        return jsonify({
            'success': False,
            'message': 'No files were uploaded successfully'
        }), 400

@bp.route('/files', methods=['GET'])
def get_files():
    """
    Get information about all uploaded files
    
    Returns:
        JSON response with list of file information
    """
    files = get_all_uploaded_files()
    
    return jsonify({
        'success': True,
        'files': files
    })

@bp.route('/delete-file', methods=['POST'])
def delete_uploaded_file():
    """
    Delete an uploaded file
    
    Accepts:
        - filename: Path to the file to delete
        
    Returns:
        JSON response with deletion status
    """
    data = request.get_json()
    
    if not data or 'filename' not in data:
        return jsonify({'success': False, 'message': 'No filename provided'}), 400
    
    filename = data['filename']
    
    # Validate the filename to prevent directory traversal
    if '..' in filename or filename.startswith('/'):
        return jsonify({'success': False, 'message': 'Invalid filename'}), 400
    
    # Only allow deleting files from the upload folder
    if not filename.startswith(current_app.config['UPLOAD_FOLDER']):
        filename = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    success, message = delete_file(filename)
    
    return jsonify({
        'success': success,
        'message': message
    })
