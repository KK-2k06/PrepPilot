import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import UploadSetup from './pages/UploadSetup';
import StudySchedule from './pages/StudySchedule';
import QuizScreen from './pages/QuizScreen';
import ResourcesDashboard from './pages/ResourcesDashboard';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/upload" element={<UploadSetup />} />
            <Route path="/schedule" element={<StudySchedule />} />
            <Route path="/quiz" element={<QuizScreen />} />
            <Route path="/resources" element={<ResourcesDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
