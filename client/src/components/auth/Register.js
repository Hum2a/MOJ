import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

const Register = ({ onCancel, onRegistrationSuccess }) => {
  const { register, loginWithGoogle } = useAuth();
  
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
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
      // Register the user with Firebase Auth
      const { user } = await register({
        email: registerData.email,
        password: registerData.password,
        name: registerData.name
      });

      // Create user profile in Firestore with initial stats
      await userService.createUserProfile(user, {
        name: registerData.name,
        role: 'user', // Default role for new users
        stats: {
          tasksCreated: 0,
          tasksAssigned: 0,
          tasksCompleted: 0,
          lastTaskCompletedAt: null
        }
      });
      
      // After successful registration, pass the data back to parent
      onRegistrationSuccess({
        email: registerData.email,
        password: registerData.password
      });
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setRegisterError('');
      setLoading(true);

      // Use Google authentication
      const response = await loginWithGoogle();
      
      if (response.success) {
        // If registration was successful, notify parent component
        onRegistrationSuccess({
          email: response.user.email
        });
      }
    } catch (error) {
      console.error('Google sign up error:', error);
      setRegisterError(error.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
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
          onClick={handleGoogleSignUp}
          disabled={loading}
        >
          <span className="google-icon">G</span>
          Sign up with Google
        </button>
      </div>
    </div>
  );
};

export default Register; 