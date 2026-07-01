import os
import shutil
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.planner import parse_pdf, generate_study_plan
from database import save_topics, save_schedule
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PrepPilot API")

# Allow frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/generate-plan")
async def create_plan(
    file: UploadFile,
    exam_date: str = Form(...),
    study_hours: float = Form(...),
    current_date: str = Form(...)
):
    temp_file_path = f"temp_{file.filename}"
    try:
        # Save file temporarily
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Agent 1 logic
        # 1. Parse PDF
        pdf_content = parse_pdf(temp_file_path)
        
        # 2. Structure & Schedule using Gemini
        plan_data = generate_study_plan(pdf_content, current_date, exam_date, study_hours)
        
        # 3. Save to Supabase (assuming schema is set up)
        save_topics(plan_data["topics"])
        save_schedule(plan_data["schedule"])
        
        return {"status": "success", "data": plan_data}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        # Cleanup
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/")
def read_root():
    return {"message": "Welcome to the PrepPilot API"}

class QuizGenerateRequest(BaseModel):
    topics: list

class QuizGradeRequest(BaseModel):
    questions: list
    user_answers: dict

@app.post("/api/generate-quiz")
async def api_generate_quiz(req: QuizGenerateRequest):
    try:
        from agents.quiz import generate_quiz
        questions = generate_quiz(req.topics)
        return {"status": "success", "data": questions}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/grade-quiz")
async def api_grade_quiz(req: QuizGradeRequest):
    try:
        from agents.quiz import grade_quiz
        results = grade_quiz(req.questions, req.user_answers)
        return {"status": "success", "data": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

class FindResourcesRequest(BaseModel):
    topics: list

@app.post("/api/find-resources")
async def api_find_resources(req: FindResourcesRequest):
    try:
        from agents.resource_finder import find_resources
        resources = await find_resources(req.topics)
        return {"status": "success", "data": resources}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
