"""
Groq API integration for Exam Pal
Handles communication with Groq API for text generation and chat functionality
"""

import os
import json
import logging
import datetime
from typing import Dict, List, Any, Optional

import requests

# Get API key from environment variables
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Model settings
DEFAULT_MODEL = "llama3-70b-8192"
HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

def is_api_key_valid() -> bool:
    """Check if the Groq API key is set and valid"""
    if not GROQ_API_KEY:
        logging.warning("Groq API key is not set. Please set the GROQ_API_KEY environment variable.")
        return False
    
    # Make a simple request to verify the key
    try:
        response = requests.post(
            GROQ_API_URL,
            headers=HEADERS,
            json={
                "model": DEFAULT_MODEL,
                "messages": [{"role": "user", "content": "Hello, are you working?"}],
                "max_tokens": 10
            },
            timeout=5
        )
        
        if response.status_code == 200:
            return True
        else:
            logging.error(f"API key validation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logging.error(f"Error validating API key: {str(e)}")
        return False

def generate_study_plan(materials: List[Dict[str, Any]], goal: str, deadline: str) -> Dict:
    """
    Generate a personalized study plan using Groq API
    
    Args:
        materials: List of dictionaries containing file info and extracted content
        goal: Study goal selected by the user
        deadline: Deadline date and time
        
    Returns:
        Dictionary containing the generated study plan
    """
    if not GROQ_API_KEY:
        return {"error": "Groq API key is not set. Please set the GROQ_API_KEY environment variable."}
    
    # Parse deadline string to datetime
    try:
        deadline_dt = datetime.datetime.fromisoformat(deadline)
        days_until_deadline = (deadline_dt - datetime.datetime.now()).days
    except Exception as e:
        logging.error(f"Error parsing deadline: {str(e)}")
        days_until_deadline = 14  # Fallback to 2 weeks
    
    # Prepare the material content (limit length to avoid token limit issues)
    material_content = ""
    for material in materials:
        content = material.get('content', '')
        # Limit each material to 2000 chars to avoid hitting token limits
        if len(content) > 2000:
            content = content[:2000] + "... [content truncated]"
        
        material_content += f"--- {material.get('name', 'Unnamed material')} ---\n{content}\n\n"
    
    # Limit overall content length
    if len(material_content) > 8000:
        material_content = material_content[:8000] + "... [content truncated]"
    
    # Map goal to difficulty level
    goal_descriptions = {
        "pass": "just pass the exam with minimal effort",
        "good": "get a good grade (B or equivalent)",
        "ace": "ace the exam (A or equivalent)",
        "master": "master the material completely for long-term knowledge"
    }
    
    goal_description = goal_descriptions.get(goal, "do well on the exam")
    
    # Create prompt for Groq API
    system_prompt = """
    You are Exam Pal, an AI study assistant designed to help students prepare for exams effectively.
    Your task is to create a personalized study plan based on the student's uploaded materials,
    their goal, and their exam deadline. The plan should be specific, actionable, and tailored to the content.
    
    The study plan should include:
    1. An overview of the material and key topics to focus on
    2. A timeline with specific milestones and tasks broken down by date
    3. Learning strategies appropriate for the material
    4. Recommended practice exercises or self-assessment methods
    
    Your response should be in JSON format with the following structure:
    {
        "overview": "General overview and approach",
        "milestones": [
            {
                "date": "YYYY-MM-DD",
                "title": "Milestone title",
                "description": "Description of this milestone",
                "tasks": ["Task 1", "Task 2", ...]
            },
            ...
        ]
    }
    
    Ensure the milestones are distributed evenly from now until the deadline.
    """
    
    user_prompt = f"""
    Create a study plan for me based on these materials:
    
    {material_content}
    
    My goal is to {goal_description}.
    My exam is in {days_until_deadline} days (on {deadline}).
    
    Please make the plan specific to the content in these materials and provide a realistic schedule.
    """
    
    try:
        response = requests.post(
            GROQ_API_URL,
            headers=HEADERS,
            json={
                "model": DEFAULT_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 4000
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Extract and parse the JSON response
            content = result["choices"][0]["message"]["content"]
            
            # Try to parse as JSON
            try:
                # Find JSON objects in the response if wrapped in backticks or text
                if "```json" in content:
                    json_str = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    json_str = content.split("```")[1].strip()
                else:
                    json_str = content
                
                study_plan = json.loads(json_str)
                return study_plan
            except json.JSONDecodeError:
                # If JSON parsing fails, return the text as-is
                logging.warning("Could not parse JSON from Groq response, returning raw text")
                return {"overview": content, "milestones": []}
        else:
            logging.error(f"Groq API error: {response.status_code} - {response.text}")
            return {"error": f"Failed to generate study plan: {response.text}"}
    
    except Exception as e:
        logging.error(f"Error generating study plan: {str(e)}")
        return {"error": f"Failed to generate study plan: {str(e)}"}

def chat_with_materials(materials: List[Dict[str, Any]], message: str, chat_history: Optional[List] = None) -> str:
    """
    Generate chat responses based on uploaded materials
    
    Args:
        materials: List of dictionaries containing file info and extracted content
        message: User's message
        chat_history: Previous chat history (optional)
        
    Returns:
        AI-generated response text
    """
    if not GROQ_API_KEY:
        return "Sorry, I can't respond right now because the Groq API key is not set. Please set the GROQ_API_KEY environment variable."
    
    if not chat_history:
        chat_history = []
    
    # Prepare the material content
    material_content = ""
    for material in materials:
        content = material.get('content', '')
        # Limit each material to avoid token limits
        if len(content) > 1500:
            content = content[:1500] + "... [content truncated]"
        
        material_content += f"--- {material.get('name', 'Unnamed material')} ---\n{content}\n\n"
    
    # Limit overall content length
    if len(material_content) > 6000:
        material_content = material_content[:6000] + "... [content truncated]"
    
    # Create system prompt for Groq API
    system_prompt = f"""
    You are Exam Pal, a Gen Z-styled study assistant. Your personality is:
    - Helpful and supportive but with a casual, relaxed tone
    - You use simple, conversational language (not formal academic speak)
    - You occasionally use Gen Z slang and internet culture references
    - You're enthusiastic about learning and helping students succeed
    - You sometimes add light-hearted emoji to your responses
    - You keep responses concise and to the point (no long-winded explanations)
    - You occasionally use meme references that Gen Z would understand
    
    You have access to the following study materials:
    
    {material_content}
    
    When responding to questions:
    1. If the answer is in the materials, provide it in a clear, conversational way
    2. If the answer isn't in the materials, be honest and say you don't have that information
    3. If appropriate, suggest tips for studying the related concepts
    4. Keep your responses under 200 words unless more detail is explicitly requested
    
    DO NOT make up information not found in the materials.
    """
    
    # Prepare messages including chat history
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add chat history (limited to last 10 messages)
    for entry in chat_history[-10:]:
        messages.append({"role": entry["role"], "content": entry["content"]})
    
    # Add current user message
    messages.append({"role": "user", "content": message})
    
    try:
        response = requests.post(
            GROQ_API_URL,
            headers=HEADERS,
            json={
                "model": DEFAULT_MODEL,
                "messages": messages,
                "temperature": 0.8,
                "max_tokens": 1000
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            logging.error(f"Groq API error: {response.status_code} - {response.text}")
            return "Sorry, I'm having trouble connecting to my brain. Try asking me something else!"
    
    except Exception as e:
        logging.error(f"Error in chat response: {str(e)}")
        return "Oops, something went wrong on my end. Can you try again with a different question?"
