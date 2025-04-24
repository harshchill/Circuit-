"""
Route handlers for study plan generation
"""

import logging
from typing import Dict, Any

from flask import Blueprint, request, jsonify

from utils.file_processor import get_all_uploaded_files, process_file
from utils.groq_api import generate_study_plan, is_api_key_valid

bp = Blueprint('study_plan', __name__, url_prefix='/api')

@bp.route('/generate-plan', methods=['POST'])
def create_study_plan():
    """
    Generate a study plan based on uploaded materials
    
    Accepts:
        - goal: Study goal (pass, good, ace, master)
        - deadline: Date and time of the exam
        
    Returns:
        JSON response with the generated study plan
    """
    # Check if API key is valid
    if not is_api_key_valid():
        return jsonify({
            'success': False,
            'message': 'Groq API key is not valid or not set',
            'plan': None
        }), 400
    
    # Get request data
    data = request.get_json()
    
    if not data:
        return jsonify({
            'success': False,
            'message': 'No data provided',
            'plan': None
        }), 400
    
    goal = data.get('goal', 'pass')
    deadline = data.get('deadline')
    
    if not deadline:
        return jsonify({
            'success': False,
            'message': 'No deadline provided',
            'plan': None
        }), 400
    
    # Get the uploaded materials
    uploaded_files = get_all_uploaded_files()
    
    if not uploaded_files:
        return jsonify({
            'success': False,
            'message': 'No study materials have been uploaded',
            'plan': None
        }), 400
    
    # Process each file to get content
    materials = []
    for file_info in uploaded_files:
        # If we already have content, use it; otherwise process the file
        if 'content' in file_info:
            materials.append(file_info)
        else:
            processed_info = process_file(file_info['path'])
            materials.append(processed_info)
    
    try:
        # Generate the study plan
        study_plan = generate_study_plan(materials, goal, deadline)
        
        # Check if generation was successful
        if 'error' in study_plan:
            return jsonify({
                'success': False,
                'message': study_plan['error'],
                'plan': None
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Study plan generated successfully',
            'plan': study_plan
        })
    
    except Exception as e:
        logging.error(f"Error generating study plan: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error generating study plan: {str(e)}',
            'plan': None
        }), 500
