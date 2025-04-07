import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './misc/navigation';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
      </Router>
    </AuthProvider>
  );
}

export default App;
