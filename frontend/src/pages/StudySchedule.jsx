import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudySchedule = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [warning, setWarning] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  
  const toggleDay = (index) => {
    setExpandedDays(prev => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    const savedPlan = localStorage.getItem('studyPlan');
    if (savedPlan) {
      try {
        const parsed = JSON.parse(savedPlan);
        setWarning(parsed.warning || null);
        
        const enrichedSchedule = (parsed.schedule || []).map(day => ({
          ...day,
          completed: day.completed || false,
          hours: day.estimated_hours || 2 
        }));
        setSchedule(enrichedSchedule);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const todayIndex = enrichedSchedule.findIndex(day => day.date === todayStr);
        if (todayIndex >= 0) {
            setCurrentDayIndex(todayIndex);
        } else {
            const firstUncompleted = enrichedSchedule.findIndex(day => !day.completed);
            setCurrentDayIndex(firstUncompleted >= 0 ? firstUncompleted : 0);
        }

      } catch (e) {
        console.error("Failed to parse study plan", e);
      }
    }
  }, []);

  if (schedule.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2 style={{ marginBottom: '1rem' }}>No Study Plan Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Please upload your syllabus to generate a schedule.</p>
        <button className="btn-primary" onClick={() => navigate('/upload')}>Go to Setup</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Study Schedule</h1>
          <p className="page-subtitle">Your day-by-day plan to crush your exam.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Overall Progress</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-color)' }}>
            Day {currentDayIndex + 1} of {schedule.length}
          </div>
        </div>
      </div>

      {warning && (
        <div style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: '0.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '1.5rem' }}>⚠️</div>
          <div>
            <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>Tight Schedule Warning</strong>
            <p style={{ color: '#b45309', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>{warning}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {schedule.map((item, index) => (
          <div key={index}>
            <div 
              className="card" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem', 
                padding: '1rem 1.5rem', 
                borderLeft: index === currentDayIndex ? '4px solid var(--primary-color)' : '1px solid var(--border-color)' 
              }}
            >
              <div style={{ cursor: 'pointer', color: item.completed ? 'var(--secondary-color)' : 'var(--border-color)' }}>
                {item.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              
              <div style={{ width: '80px' }}>
                <div style={{ fontWeight: '700' }}>Day {item.day}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.date}</div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {item.topics.map((t, i) => (
                    <span key={i} className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: '400' }}>
                      {typeof t === 'string' ? t : t.name}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', width: '100px' }}>
                <Clock size={16} />
                <span style={{ fontSize: '0.875rem' }}>{item.hours}h est.</span>
              </div>

              <div style={{ width: '220px', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}>
                {index === currentDayIndex && (
                  <>
                    {item.completed ? (
                      <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: 'var(--secondary-color)' }} disabled>
                        Quiz Completed
                      </button>
                    ) : (
                      <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => navigate('/quiz')}>
                        Take Today's Quiz
                      </button>
                    )}
                  </>
                )}
                
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }} 
                  onClick={() => toggleDay(index)}
                >
                  {expandedDays[index] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
            </div>
            
            {expandedDays[index] && (
              <div style={{ 
                padding: '1.5rem', 
                border: '1px solid var(--border-color)', 
                borderTop: 'none', 
                borderRadius: '0 0 0.5rem 0.5rem', 
                backgroundColor: '#fafafa', 
                marginTop: '-1rem',
                marginLeft: '1rem',
                marginRight: '1rem'
              }}>
                 <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Topic Breakdown</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {item.topics.map((t, i) => (
                     <div key={i}>
                       <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                         {typeof t === 'string' ? t : t.name}
                       </div>
                       <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                         {typeof t === 'string' ? 'No detailed breakdown available.' : t.details}
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudySchedule;
