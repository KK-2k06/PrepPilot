import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UploadSetup = () => {
  const [examDate, setExamDate] = useState('');
  const [studyHours, setStudyHours] = useState(2);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Please upload a syllabus PDF first.');
      return;
    }
    if (!examDate) {
      setError('Please select an exam date.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const currentDate = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
    formData.append('file', file);
    formData.append('current_date', currentDate);
    formData.append('exam_date', examDate);
    formData.append('study_hours', studyHours);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/generate-plan`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Clear out any old data from a previous syllabus run
        localStorage.removeItem('cachedQuiz');
        localStorage.removeItem('quizResults');
        localStorage.removeItem('cachedResources');
        
        // Store the generated plan in localStorage
        localStorage.setItem('studyPlan', JSON.stringify(data.data));
        navigate('/schedule');
      } else {
        setError(data.message || 'Failed to generate plan.');
      }
    } catch (err) {
      setError('Failed to connect to the backend server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Upload & Setup</h1>
        <p className="page-subtitle">Start by uploading your syllabus to generate a custom study plan.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div className="card" style={{ flex: 2 }}>
          
          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Syllabus PDF</label>
            <div 
              className="drop-zone" 
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer', borderColor: file ? 'var(--primary-color)' : '' }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf" 
                style={{ display: 'none' }} 
              />
              {file ? (
                <>
                  <FileText size={40} className="drop-zone-icon" style={{ color: 'var(--primary-color)' }} />
                  <h3 style={{ color: 'var(--primary-color)' }}>{file.name}</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Click to change file</p>
                </>
              ) : (
                <>
                  <Upload size={40} className="drop-zone-icon" />
                  <h3>Drag & drop your syllabus here</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>or click to browse files</p>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">When is your exam?</label>
              <input 
                type="date" 
                className="form-input" 
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Daily Study Hours ({studyHours}h)</label>
              <input 
                type="range" 
                min="1" 
                max="12" 
                step="0.5"
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={handleGenerate} 
              disabled={loading}
              style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <Loader size={20} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  Generating Plan... (This may take a minute)
                </>
              ) : (
                'Generate Study Plan'
              )}
            </button>
          </div>
        </div>

        <div className="card" style={{ flex: 1, alignSelf: 'flex-start' }}>
          <h3 style={{ marginBottom: '1rem' }}>How it works</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <strong style={{ color: 'var(--primary-color)' }}>Step 1: Plan</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>We analyze your syllabus and build a day-by-day study schedule.</p>
            </div>
            <div>
              <strong style={{ color: 'var(--primary-color)' }}>Step 2: Quiz</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Take daily quizzes on your scheduled topics to test your knowledge.</p>
            </div>
            <div>
              <strong style={{ color: 'var(--primary-color)' }}>Step 3: Get Resources</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>We find targeted study materials for topics you are struggling with.</p>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UploadSetup;
