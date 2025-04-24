"""
Route handlers for chatbot functionality
"""

import logging
from typing import Dict, List, Any

from flask import Blueprint, request, jsonify, session

from utils.file_processor import get_all_uploaded_files, process_file
from utils.groq_api import chat_with_materials, is_api_key_valid

bp = Blueprint('chat', __name__, url_prefix='/api')

@bp.route('/chat', methods=['POST'])
def chat_message():
    """
    Handle chat messages and generate responses
    
    Accepts:
        - message: User's message text
        
    Returns:
        JSON response with the AI-generated reply
    """
    # Check if API key is valid
    if not is_api_key_valid():
        return jsonify({
            'success': False,
            'message': 'Groq API key is not valid or not set',
            'response': None
        }), 400
    
    # Get request data
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({
            'success': False,
            'message': 'No message provided',
            'response': None
        }), 400
    
    user_message = data['message']
    
    # Retrieve chat history from session
    chat_history = session.get('chat_history', [])
    
    # Add user message to history
    chat_history.append({
        "role": "user",
        "content": user_message
    })
    
    # Keep history to a reasonable size (last 20 messages)
    if len(chat_history) > 20:
        chat_history = chat_history[-20:]
    
    # Get the uploaded materials
    uploaded_files = get_all_uploaded_files()
    
    if not uploaded_files:
        ai_response = "I don't see any study materials uploaded yet. Please upload your notes, textbooks, or any resources you'd like me to help you with!"
    else:
        # Process each file to get content if needed
        materials = []
        for file_info in uploaded_files:
            # If we already have content, use it; otherwise process the file
            if 'content' in file_info:
                materials.append(file_info)
            else:
                processed_info = process_file(file_info['path'])
                materials.append(processed_info)
        
        try:
            # Generate response based on materials and chat history
            ai_response = chat_with_materials(materials, user_message, chat_history)
        except Exception as e:
            logging.error(f"Error generating chat response: {str(e)}")
            ai_response = "Sorry, I'm having trouble processing your question right now. Please try again!"
    
    # Add AI response to history
    chat_history.append({
        "role": "assistant",
        "content": ai_response
    })
    
    # Update session
    session['chat_history'] = chat_history
    
    return jsonify({
        'success': True,
        'message': 'Response generated successfully',
        'response': ai_response
    })

@bp.route('/chat-history', methods=['GET'])
def get_chat_history():
    """
    Get the current chat history
    
    Returns:
        JSON response with the chat history
    """
    chat_history = session.get('chat_history', [])
    
    return jsonify({
        'success': True,
        'history': chat_history
    })

@bp.route('/reset-chat', methods=['POST'])
def reset_chat():
    """
    Reset the chat history
    
    Returns:
        JSON response confirming reset
    """
    session['chat_history'] = []
    
    return jsonify({
        'success': True,
        'message': 'Chat history reset successfully'
    })
