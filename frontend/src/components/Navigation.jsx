import React from 'react';
import { NavLink } from 'react-router-dom';
import { UploadCloud, Calendar, FileQuestion, BookOpen } from 'lucide-react';

const Navigation = () => {
  return (
    <nav className="sidebar">
      <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
        PrepPilot
      </div>
      <div className="nav-links">
        <NavLink to="/upload" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <UploadCloud size={20} />
          <span>Upload & Setup</span>
        </NavLink>
        <NavLink to="/schedule" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Calendar size={20} />
          <span>Schedule</span>
        </NavLink>
        <NavLink to="/quiz" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileQuestion size={20} />
          <span>Quiz</span>
        </NavLink>
        <NavLink to="/resources" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Resources</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
