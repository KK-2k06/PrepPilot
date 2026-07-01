import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, CheckCircle2, XCircle } from 'lucide-react';

const QuizScreen = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchQuiz = async () => {
      try {
        const savedPlan = localStorage.getItem('studyPlan');
        if (!savedPlan) {
          setError("No study plan found. Please upload a syllabus first.");
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(savedPlan);
        const schedule = parsed.schedule || [];
        
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const todayStr = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
        
        const today = schedule.find(day => day.date === todayStr);
        
        if (!today) {
          setError("No topics scheduled for today.");
          setLoading(false);
          return;
        }

        // If today's quiz is completed, show the report instead of an error!
        if (today.completed) {
           const storedResults = localStorage.getItem('quizResults');
           if (storedResults) {
              const parsedResults = JSON.parse(storedResults);
              if (!parsedResults.date || parsedResults.date === today.date) {
                  setResults(parsedResults);
                  setLoading(false);
                  return;
              }
           }
           setError("You have completed today's quiz. Come back tomorrow!");
           setLoading(false);
           return;
        }

        // Check if we already have a cached quiz for today
        const cached = localStorage.getItem('cachedQuiz');
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            if (parsedCache.date === today.date) {
              setQuestions(parsedCache.questions);
              setAnswers(parsedCache.answers || {});
              setLoading(false);
              return; // Skip API call
            }
          } catch (e) {
            console.error("Failed to parse cached quiz", e);
          }
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/generate-quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topics: today.topics })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
          setQuestions(data.data);
          // Save to cache
          localStorage.setItem('cachedQuiz', JSON.stringify({
            date: today.date,
            questions: data.data,
            answers: {}
          }));
        } else {
          setError(data.message || 'Failed to generate quiz.');
        }
      } catch (err) {
        setError("Failed to connect to backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, []);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswerChange = (qId, value) => {
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    
    // Save answer progress to cache
    const cached = localStorage.getItem('cachedQuiz');
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        parsedCache.answers = newAnswers;
        localStorage.setItem('cachedQuiz', JSON.stringify(parsedCache));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async () => {
    setGrading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/grade-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, user_answers: answers })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const todayStr = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
        
        const resultsWithDate = { ...data.data, date: todayStr };
        setResults(resultsWithDate);
        localStorage.setItem('quizResults', JSON.stringify(resultsWithDate));
        
        // Mark today as completed in localStorage
        const savedPlan = localStorage.getItem('studyPlan');
        if (savedPlan) {
            const parsed = JSON.parse(savedPlan);
            const index = parsed.schedule.findIndex(d => d.date === todayStr);
            if (index >= 0) parsed.schedule[index].completed = true;
            localStorage.setItem('studyPlan', JSON.stringify(parsed));
        }
        // Clear cache so it doesn't stay around forever
        localStorage.removeItem('cachedQuiz');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to grade quiz.");
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <Loader size={48} style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <h2 style={{ marginTop: '1.5rem' }}>Generating your custom quiz...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Analyzing today's topics to build 10 targeted questions.</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: '#b91c1c' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={() => navigate('/schedule')} style={{ marginTop: '1rem' }}>Go Back</button>
      </div>
    );
  }

  if (results) {
    const percentage = Math.round((results.score / results.total) * 100);
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Quiz Complete!</h2>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ fontSize: '4rem', fontWeight: '700', color: percentage >= 70 ? 'var(--secondary-color)' : 'var(--primary-color)', marginBottom: '1rem' }}>
              {percentage}%
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>You got {results.score} out of {results.total} questions correct.</p>
          </div>
        </div>

        <h3 style={{ marginBottom: '1.5rem' }}>Detailed Review</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {results.results.map((res, i) => (
            <div key={i} className="card" style={{ borderLeft: res.is_correct ? '4px solid var(--secondary-color)' : '4px solid #ef4444' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ marginTop: '0.25rem' }}>
                  {res.is_correct ? <CheckCircle2 size={24} color="var(--secondary-color)"/> : <XCircle size={24} color="#ef4444"/>}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.5' }}>Q{i+1}: {res.question}</h4>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Your Answer: </span>
                    <strong style={{ color: res.is_correct ? 'var(--secondary-color)' : '#ef4444' }}>
                      {res.user_answer || "No answer provided"}
                    </strong>
                  </div>
                  
                  {!res.is_correct && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Correct Answer: </span>
                      <strong style={{ color: 'var(--secondary-color)' }}>{res.correct_answer}</strong>
                    </div>
                  )}

                  {res.type === 'short' && res.feedback && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                      <strong>AI Feedback: </strong> {res.feedback}
                    </div>
                  )}
                  
                  <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    <strong>Explanation: </strong>{res.explanation}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center', marginBottom: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button className="btn-primary" onClick={() => window.print()} style={{ padding: '1rem 3rem', backgroundColor: 'var(--text-muted)' }}>
            Download Report (PDF)
          </button>
          <button className="btn-primary" onClick={() => navigate('/resources')} style={{ padding: '1rem 3rem' }}>
            View Recommended Resources
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title" style={{ fontSize: '1.5rem', margin: 0 }}>Daily Quiz</h2>
        <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Question {currentQuestionIndex + 1} of {questions.length}</span>
      </div>

      <div style={{ width: '100%', backgroundColor: 'var(--border-color)', height: '6px', borderRadius: '3px', marginBottom: '2rem' }}>
        <div style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`, backgroundColor: 'var(--primary-color)', height: '100%', borderRadius: '3px', transition: 'width 0.3s' }}></div>
      </div>

      <div className="card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {currentQ.question}
          </h3>
          
          {currentQ.type === 'mcq' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(currentQ.options || []).map((opt, i) => (
                <label 
                  key={i} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
                    border: answers[currentQ.id] === opt ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', 
                    borderRadius: '0.5rem', cursor: 'pointer',
                    backgroundColor: answers[currentQ.id] === opt ? '#eff6ff' : 'transparent'
                  }}
                >
                  <input 
                    type="radio" 
                    name={`q-${currentQ.id}`} 
                    value={opt}
                    checked={answers[currentQ.id] === opt}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    style={{ width: '1.25rem', height: '1.25rem' }} 
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <div>
              <textarea 
                className="form-input" 
                rows="6" 
                placeholder="Type your explanation here..."
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
              ></textarea>
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <button 
            className="btn-primary" 
            style={{ backgroundColor: 'var(--text-muted)' }} 
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          
          {currentQuestionIndex === questions.length - 1 ? (
            <button className="btn-primary" onClick={handleSubmit} disabled={grading}>
              {grading ? 'Grading...' : 'Submit Quiz'}
            </button>
          ) : (
            <button className="btn-primary" onClick={handleNext}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizScreen;
