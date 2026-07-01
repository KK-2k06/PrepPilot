import React, { useState, useEffect } from 'react';
import { ExternalLink, Info, PlayCircle, FileText, Loader, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ResourcesDashboard = () => {
  const navigate = useNavigate();
  const [hasPlan, setHasPlan] = useState(true);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noWeakTopics, setNoWeakTopics] = useState(false);
  const [quizTaken, setQuizTaken] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      const savedPlan = localStorage.getItem('studyPlan');
      if (!savedPlan) {
        setHasPlan(false);
        return;
      }
      
      const cachedResources = localStorage.getItem('cachedResources');
      if (cachedResources) {
          setResources(JSON.parse(cachedResources));
          setQuizTaken(true);
          return;
      }

      const storedResults = localStorage.getItem('quizResults');
      if (!storedResults) {
        setQuizTaken(false);
        return;
      }
      
      setQuizTaken(true);
      const parsedResults = JSON.parse(storedResults);
      const failed = parsedResults.results.filter(r => !r.is_correct).map(r => r.question);

      if (failed.length === 0) {
        setNoWeakTopics(true);
        return;
      }

      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/find-resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topics: failed })
        });
        const data = await res.json();
        if (data.status === 'success') {
          setResources(data.data);
          localStorage.setItem('cachedResources', JSON.stringify(data.data));
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Failed to fetch resources.");
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  if (!hasPlan) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2 style={{ marginBottom: '1rem' }}>No Study Plan Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Please upload your syllabus to unlock intelligent study resources.</p>
        <button className="btn-primary" onClick={() => navigate('/upload')}>Go to Setup</button>
      </div>
    );
  }

  return (
    <div>
      <div className="banner">
        <Info size={24} />
        <div>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Agent 3 Active</strong>
          <span>This dashboard automatically executes a live web search using Tavily for the topics you struggled with in today's quiz!</span>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: '2rem' }}>
        <h1 className="page-title">Targeted Resources</h1>
        <p className="page-subtitle">Custom study materials based on your quiz performance.</p>
      </div>

      {!quizTaken && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', backgroundColor: 'var(--card-bg)', borderRadius: '1rem', marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Take your quiz first!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Your custom resources will appear here after you complete today's quiz.</p>
          <button className="btn-primary" onClick={() => navigate('/quiz')}>Go to Quiz</button>
        </div>
      )}

      {noWeakTopics && !loading && quizTaken && (
        <div style={{ textAlign: 'center', padding: '4rem 0', backgroundColor: '#ecfdf5', borderRadius: '1rem', marginTop: '2rem', border: '1px solid #10b981' }}>
          <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '1rem', color: '#065f46' }}>Perfect Score!</h2>
          <p style={{ color: '#047857' }}>You mastered all of today's topics! No additional review resources are needed.</p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <Loader size={48} style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <h2 style={{ marginTop: '1.5rem' }}>Agent 3 is searching the web...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Using Tavily to find the best live YouTube videos and articles for your weak topics.</p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
         <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '0.5rem', marginTop: '2rem' }}>
           {error}
         </div>
      )}

      {resources.length === 0 && !loading && !error && !noWeakTopics && quizTaken && (
        <div style={{ textAlign: 'center', padding: '4rem 0', backgroundColor: 'var(--card-bg)', borderRadius: '1rem', marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>No Resources Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Our AI encountered an issue fetching your tailored resources (possibly due to rate limits).</p>
          <button className="btn-primary" onClick={() => {
            localStorage.removeItem('cachedResources');
            window.location.reload();
          }}>Retry Generation</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        
        {resources.map((res, index) => (
          <div key={index} className="card" style={{ borderTop: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{res.topic}</h3>
              <span className="badge badge-warning" style={{ flexShrink: 0, marginLeft: '1rem' }}>Needs Review</span>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              <strong>Why this matters:</strong> {res.why_it_matters}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {res.resources && res.resources.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', textDecoration: 'none', transition: 'transform 0.2s', backgroundColor: '#f8fafc' }}>
                  <div style={{ color: link.type === 'video' ? '#ef4444' : 'var(--primary-color)' }}>
                    {link.type === 'video' ? <PlayCircle size={24} /> : <FileText size={24} />}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: '500', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{link.type === 'video' ? 'Video' : 'Article'}</div>
                  </div>
                  <ExternalLink size={16} color="var(--text-muted)" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourcesDashboard;
