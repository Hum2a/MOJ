import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import TaskManager from '../pages/TaskManager';

const Navigation = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/tasks" element={<TaskManager />} />
      {/* Add more routes here as we create them */}
    </Routes>
  );
};

export default Navigation;
