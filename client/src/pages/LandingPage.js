import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user, error } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [mfaData, setMfaData] = useState({
    tempToken: '',
    code: '',
  });
  const [showMFA, setShowMFA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMFAInputChange = (e) => {
    setMfaData(prev => ({
      ...prev,
      code: e.target.value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const response = await login(loginData.email, loginData.password);
      
      if (response.requiresMFA) {
        setMfaData(prev => ({ ...prev, tempToken: response.tempToken }));
        setShowMFA(true);
      } else {
        const from = location.state?.from?.pathname || '/tasks';
        navigate(from);
      }
    } catch (error) {
      setLoginError(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (registerData.password.length < 8) {
      setRegisterError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: registerData.email,
        password: registerData.password,
        name: registerData.name
      });
      
      // After successful registration, show login form
      setShowRegister(false);
      setShowLogin(true);
      setLoginData({
        email: registerData.email,
        password: registerData.password
      });
    } catch (error) {
      setRegisterError(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleMFASubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      await login.verifyMFA(mfaData.tempToken, mfaData.code);
      const from = location.state?.from?.pathname || '/tasks';
      navigate(from);
    } catch (error) {
      setLoginError(error.message || 'Failed to verify MFA code');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/tasks');
    } else {
      setShowLogin(true);
    }
  };

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

      {!showLogin && !showRegister && !showMFA ? (
        <div className="auth-actions">
          <button className="cta-button" onClick={handleGetStarted}>
            {user ? 'Go to Tasks' : 'Get Started'}
          </button>
          {!user && (
            <button 
              className="register-button"
              onClick={() => setShowRegister(true)}
            >
              Create Account
            </button>
          )}
        </div>
      ) : showMFA ? (
        <div className="auth-form mfa-form">
          <h2>Enter MFA Code</h2>
          <p>Please enter the code from your authenticator app</p>
          <form onSubmit={handleMFASubmit}>
            <div className="form-group">
              <input
                type="text"
                name="code"
                placeholder="Enter MFA code"
                value={mfaData.code}
                onChange={handleMFAInputChange}
                required
                pattern="[0-9]*"
                maxLength="6"
              />
            </div>
            {loginError && <div className="error-message">{loginError}</div>}
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button" 
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => {
                  setShowMFA(false);
                  setShowLogin(true);
                }}
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      ) : showRegister ? (
        <div className="auth-form register-form">
          <h2>Create Account</h2>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={registerData.name}
                onChange={handleRegisterInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={registerData.email}
                onChange={handleRegisterInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={registerData.password}
                onChange={handleRegisterInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={registerData.confirmPassword}
                onChange={handleRegisterInputChange}
                required
              />
            </div>
            {registerError && <div className="error-message">{registerError}</div>}
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button" 
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setShowRegister(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="auth-form login-form">
          <h2>Login to Continue</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={loginData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            {loginError && <div className="error-message">{loginError}</div>}
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setShowLogin(false)}
              >
                Cancel
              </button>
            </div>
          </form>
          <div className="auth-switch">
            <p>Don't have an account?</p>
            <button 
              className="switch-button"
              onClick={() => {
                setShowLogin(false);
                setShowRegister(true);
              }}
            >
              Create Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
