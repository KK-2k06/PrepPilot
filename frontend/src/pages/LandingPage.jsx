import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Globe, LineChart, ArrowRight } from 'lucide-react';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="hero-container">
      <div className="hero-content">
        <div className="hero-logo-container">
          <img src="/logo.png" alt="PrepPilot Logo" className="hero-logo" />
        </div>
        <h1 className="hero-title">
          Welcome to <span className="text-primary">PrepPilot</span>
        </h1>
        <p className="hero-subtitle">
          The Autonomous AI Study Companion. 
          <br/>
          Instantly convert any syllabus into a daily curriculum, test your knowledge, and access live curated resources.
        </p>
        
        <div className="hero-features">
          <div className="feature-badge"><Zap size={16} /> Powered by Gemini 3.1</div>
          <div className="feature-badge"><Globe size={16} /> Local MCP Architecture</div>
          <div className="feature-badge"><LineChart size={16} /> Dynamic Study Plans</div>
        </div>

        <button 
          className="hero-cta-button"
          onClick={() => navigate('/upload')}
        >
          Get Started Now
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default LandingPage;
