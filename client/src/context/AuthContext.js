import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      try {
        await authService.init();
        const token = authService.getToken();
        if (token) {
          // Get user data if token exists
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.login({ email, password });
      
      if (response.requiresMFA) {
        return { requiresMFA: true, tempToken: response.tempToken };
      }
      
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message || 'Failed to login');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      return { success: true, ...response };
    } catch (error) {
      setError(error.message || 'Failed to register');
      throw error;
    }
  };

  const verifyMFA = async (tempToken, mfaCode) => {
    try {
      setError(null);
      const response = await authService.verifyMFA(tempToken, mfaCode);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      setError(error.message || 'Failed to verify MFA');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    verifyMFA,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 