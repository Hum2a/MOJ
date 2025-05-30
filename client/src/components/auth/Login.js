import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

const Login = ({ onCancel, onSwitchToRegister }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [mfaData, setMfaData] = useState({
    tempToken: '',
    code: '',
  });
  const [showMFA, setShowMFA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
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
        // Update last login timestamp
        await userService.createUserProfile(response.user);
        const from = location.state?.from?.pathname || '/tasks';
        navigate(from);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginError('');
      setLoading(true);
      
      const response = await loginWithGoogle();
      
      if (response.success) {
        const from = location.state?.from?.pathname || '/tasks';
        navigate(from);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setLoginError(error.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleMFASubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const response = await login.verifyMFA(mfaData.tempToken, mfaData.code);
      // Update last login timestamp after MFA verification
      if (response.user) {
        await userService.createUserProfile(response.user);
      }
      const from = location.state?.from?.pathname || '/tasks';
      navigate(from);
    } catch (error) {
      console.error('MFA verification error:', error);
      setLoginError(error.message || 'Failed to verify MFA code');
    } finally {
      setLoading(false);
    }
  };

  if (showMFA) {
    return (
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
                setMfaData({ tempToken: '', code: '' });
              }}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
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
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
      
      <div className="social-login">
        <div className="divider">
          <span>OR</span>
        </div>
        <button 
          type="button"
          className="google-button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <span className="google-icon">G</span>
          Continue with Google
        </button>
      </div>
      
      <div className="auth-switch">
        <p>Don't have an account?</p>
        <button 
          className="switch-button"
          onClick={onSwitchToRegister}
        >
          Create Account
        </button>
      </div>
    </div>
  );
};

export default Login; 