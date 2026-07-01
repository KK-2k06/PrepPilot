import os
import json
from google import genai
from google.genai import types

def generate_quiz(topics: list) -> list:
    """Generates exactly 10 quiz questions based on the provided topics."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "your-gemini-api-key":
        raise ValueError("GEMINI_API_KEY not configured.")
        
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    Create a quiz based on the following topics: {json.dumps(topics)}
    
    CRITICAL RULES:
    1. You MUST generate EXACTLY 10 questions in total.
    2. Make a mix of 'mcq' (multiple choice) and 'short' (short answer) questions.
    3. Output ONLY a valid JSON array of objects with the following structure:
    [
      {{
        "id": 1,
        "type": "mcq",
        "question": "The question text",
        "options": ["A", "B", "C", "D"], // only for mcq
        "correct_answer": "The exact string of the correct option", // only for mcq
        "explanation": "Why this is correct"
      }},
      {{
        "id": 2,
        "type": "short",
        "question": "The question text",
        "correct_answer": "The expected key concept or answer", // for short answer grading reference
        "explanation": "Detailed explanation of the correct answer"
      }}
    ]
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    
    return json.loads(response.text)


def grade_quiz(questions: list, user_answers: dict) -> dict:
    """
    Grades the quiz. 
    user_answers is a dict like {{"1": "User's answer", "2": "User's short answer"}}
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    client = genai.Client(api_key=api_key)
    
    results = []
    total_score = 0
    
    # We will grade short answers with Gemini in a batch to save time.
    short_answers_to_grade = []
    
    for q in questions:
        q_id = str(q["id"])
        user_ans = user_answers.get(q_id, "")
        
        if q["type"] == "mcq":
            is_correct = (user_ans == q["correct_answer"])
            if is_correct:
                total_score += 1
            results.append({
                "id": q["id"],
                "question": q["question"],
                "type": "mcq",
                "user_answer": user_ans,
                "correct_answer": q["correct_answer"],
                "is_correct": is_correct,
                "explanation": q["explanation"]
            })
        else:
            # Queue for LLM grading
            short_answers_to_grade.append({
                "id": q["id"],
                "question": q["question"],
                "correct_answer": q["correct_answer"],
                "user_answer": user_ans,
                "explanation": q["explanation"]
            })
            
    # Grade short answers via Gemini
    if short_answers_to_grade:
        prompt = f"""
        You are a strict but fair teacher grading short answer questions.
        For each question, I will provide the Question, the Expected Correct Answer, and the Student's Answer.
        
        Evaluate if the student's answer is correct (it captures the core concept of the expected answer).
        
        Output ONLY a valid JSON array of objects with the structure:
        [
          {{
            "id": question_id,
            "is_correct": true/false,
            "feedback": "A short 1-sentence feedback on their specific answer"
          }}
        ]
        
        Questions to grade:
        {json.dumps(short_answers_to_grade)}
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        llm_grades = json.loads(response.text)
        
        # Merge grades
        for sg in short_answers_to_grade:
            grade = next((g for g in llm_grades if str(g["id"]) == str(sg["id"])), None)
            is_correct = grade["is_correct"] if grade else False
            if is_correct:
                total_score += 1
                
            results.append({
                "id": sg["id"],
                "question": sg["question"],
                "type": "short",
                "user_answer": sg["user_answer"],
                "correct_answer": sg["correct_answer"],
                "is_correct": is_correct,
                "feedback": grade["feedback"] if grade else "Could not grade.",
                "explanation": sg["explanation"]
            })
            
    # Sort results back by id
    results.sort(key=lambda x: int(x["id"]))
    
    return {
        "score": total_score,
        "total": len(questions),
        "results": results
    }
