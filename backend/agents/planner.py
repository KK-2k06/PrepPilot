import os
import json
import datetime
import pdfplumber
from google import genai
from google.genai import types

def parse_pdf(file_path: str) -> str:
    """Extracts text and tables from PDF using pdfplumber."""
    extracted_text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            # Extract text
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
            
            # Extract tables if needed
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    extracted_text += " | ".join(str(cell) if cell else "" for cell in row) + "\n"
    return extracted_text

def generate_study_plan(pdf_content: str, current_date: str, exam_date: str, study_hours: float) -> dict:
    """Uses Gemini API to structure topics and generate a day-by-day schedule in one shot."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "your-gemini-api-key":
        raise ValueError("GEMINI_API_KEY not configured. Please add it to backend/.env")
    
    client = genai.Client(api_key=api_key)
    
    # Combined Prompt for 2x Speed
    prompt = f"""
    Analyze the following syllabus content.
    
    Task 1: Extract the core topics from the syllabus.
    Task 2: Given the current date ({current_date}), an exam date ({exam_date}), and daily study hours available ({study_hours} hours/day), create a day-by-day study schedule.
    
    CRITICAL RULES:
    1. The schedule must START exactly from the current date ({current_date}) and END strictly on the day BEFORE the exam date ({exam_date}). Do NOT schedule anything on the exam date itself.
    2. TIME CONSTRAINTS: You must strictly adhere to the user's daily limit of {study_hours} hours. The `estimated_hours` for ANY single day must NEVER exceed {study_hours}. If the total estimated hours to learn all topics exceeds the total available study time, you MUST prioritize the highest-weightage topics and cut the less important ones.
    3. If you had to drop topics or heavily cram the schedule due to lack of time, provide a brief, helpful warning message in the "warning" field. If there is enough time to cover everything comfortably, set "warning" to null.
    4. SURPLUS TIME: If the syllabus is small and you have more total available study hours than needed to cover the topics, you MUST still generate a schedule that spans the ENTIRE duration from {current_date} to the day before {exam_date}. Allocate the excess days towards "Full Revision", "Practice Exams", and "Deep Dives" so that the schedule perfectly fills the entire requested timeframe without any missing days.
    
    Output ONLY a valid JSON object with exactly this structure:
    {{
      "warning": "string describing what was cut or null if plenty of time",
      "topics": [
        {{ "topic": "Topic Name", "weightage": number or null, "estimated_hours": number }}
      ],
      "schedule": [
        {{ 
          "day": 1, 
          "date": "YYYY-MM-DD", 
          "topics": [
            {{ "name": "Topic 1", "details": "A brief 1-2 sentence breakdown of what exactly to study" }}
          ], 
          "estimated_hours": number 
        }}
      ]
    }}
    
    Syllabus Content:
    {pdf_content}
    """
    
    response = client.models.generate_content(
        model='gemini-3.1-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    
    plan_data = json.loads(response.text)
    
    # Post-process: Force deterministic dates to prevent LLM date hallucinations
    try:
        start_date = datetime.datetime.strptime(current_date, "%Y-%m-%d")
        if "schedule" in plan_data:
            for idx, day_plan in enumerate(plan_data["schedule"]):
                day_plan["day"] = idx + 1
                day_plan["date"] = (start_date + datetime.timedelta(days=idx)).strftime("%Y-%m-%d")
    except Exception as e:
        print(f"Warning: Date enforcement failed: {e}")
        
    return plan_data

