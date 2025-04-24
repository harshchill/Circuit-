# Circuit - AI Study Assistant

Exam Pal is an AI-powered study assistant that helps students prepare for exams by generating personalized study plans and providing a GenZ-styled conversational interface for Q&A about study materials.

## Features

- **Upload Study Materials**: PDF documents (lecture notes, textbooks) and images (photos of handwritten notes, whiteboard shots)
- **AI-Generated Study Plans**: Get a personalized study schedule based on your materials and deadline
- **GenZ Chat Assistant**: Ask questions about your study materials in a casual, meme-infused chat interface
- **Document Analysis**: AI-powered extraction of key concepts from your materials
- **Deadline Management**: Organize your study schedule based on your exam date

## Technical Implementation

The application is built using:

- **Frontend**: HTML, CSS, vanilla JavaScript (no frameworks)
- **Backend**: Python with Flask
- **AI Integration**: Groq API for both study plan generation and chat functionality
- **PDF Processing**: PyPDF2 for extracting text from PDF files
- **Image Processing**: Optional OCR for text extraction from images

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Groq API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

