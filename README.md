# PrepPilot

**An AI Agents: Intensive Vibe Coding Capstone Project by Google x Kaggle**

PrepPilot is an intelligent, agent-based study companion designed to ingest your course syllabus, schedule your study sessions, test your knowledge, and automatically fetch live resources to help you master your weak points. 

Built with React, FastAPI, Google Gemini, and the Model Context Protocol (MCP) powered by Tavily.

## Features

### 1. The AI Planner (Agent 1)
Upload any course syllabus (PDF), tell the AI your exam date and how many hours a day you want to study. The Planner Agent uses **Gemini 2.5** to extract the core topics and generate a custom, day-by-day study schedule. It even features a "Tight Schedule Warning" system that automatically prioritizes the most important topics if you're cramming!

### 2. The AI Quiz Master (Agent 2)
Every day on your schedule, the Quiz Agent generates a custom 10-question quiz (a mix of Multiple Choice and Short Answer questions). It strictly enforces a "one attempt per day" rule. Once submitted, it automatically grades your short-form answers with personalized feedback!

### 3. The MCP Resource Finder (Agent 3)
Fulfilling cutting-edge architectural standards, this agent acts as an **MCP Client**. It connects to the official Tavily MCP Server using Server-Sent Events (SSE). When you finish your quiz, it takes the topics you struggled with, performs real-time web searches, and curates a custom dashboard of live YouTube videos and articles to help you master those specific concepts.

### 4. Frictionless Local-First Architecture
Designed specifically for seamless testing, this application deliberately bypasses centralized databases in favor of a `localStorage` architecture. Because no login is required, this ensures that every single user (or hackathon judge!) gets a completely private, isolated sandbox environment in their browser. You can generate schedules and take quizzes without ever worrying about overwriting someone else's data!

## Architecture

- **Frontend:** React + Vite (State managed locally via `localStorage` for blazing-fast speed)
- **Backend:** FastAPI + Python
- **AI Engine:** Google Gemini (`gemini-2.5-flash-lite`)
- **Web Search:** Tavily via Model Context Protocol (MCP) SSE Client
- **PDF Extraction:** `pdfplumber`

## Getting Started

### Prerequisites
- Node.js (for the frontend)
- Python 3.9+ (for the backend)
- API Keys: Google Gemini, Tavily, and Supabase (optional DB)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` directory and add your keys:
   ```env
   GEMINI_API_KEY="your_gemini_key"
   TAVILY_API_KEY="your_tavily_key"
   SUPABASE_URL="your_supabase_url"
   SUPABASE_KEY="your_supabase_key"
   ```
5. Start the FastAPI server:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Live Deployment

This project is fully deployed and accessible live:
- **Frontend (React/Vite):** Hosted on [Vercel](https://vercel.com/)
- **Backend (FastAPI/MCP):** Hosted on [Railway](https://railway.app/)

## Conclusion

PrepPilot was built to showcase the power of Agentic AI workflows, explicitly utilizing the **Model Context Protocol (MCP)** to securely and reliably connect Large Language Models with external live data sources. Thank you to Google and Kaggle for hosting this incredible capstone!
