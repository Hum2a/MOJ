import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: '📋',
      title: 'Task Management',
      description: 'Efficiently create, track, and manage your tasks with our intuitive interface.'
    },
    {
      icon: '⏰',
      title: 'Due Date Tracking',
      description: 'Never miss a deadline with our smart due date tracking system.'
    },
    {
      icon: '📊',
      title: 'Status Updates',
      description: 'Easily update task status and keep everyone in the loop.'
    }
  ];

  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1 className="landing-title">HMCTS Task Manager</h1>
        <p className="landing-subtitle">
          Streamline your casework with our efficient task management system designed specifically for HMCTS caseworkers.
        </p>
      </header>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="feature-card" key={index}>
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>

      <button className="cta-button" onClick={() => navigate('/tasks')}>
        Get Started
      </button>
    </div>
  );
};

export default LandingPage;
