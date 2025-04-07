import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

const Register = ({ onCancel, onRegistrationSuccess }) => {
  const { register } = useAuth();
  
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

      // Create user profile in Firestore
      await userService.createUserProfile(user, {
        name: registerData.name,
        role: 'user' // Default role for new users
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
    </div>
  );
};

export default Register; 