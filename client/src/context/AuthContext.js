import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

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
        
        // Check for redirect result (for Google sign-in)
        const redirectResult = await authService.getRedirectResult();
        if (redirectResult && redirectResult.user) {
          await handleUserSignIn(redirectResult.user);
        } else {
          // Get user data if token exists
          const userData = authService.getCurrentUser();
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Helper function to handle user sign-in and profile creation
  const handleUserSignIn = async (userData) => {
    try {
      // Create or update user profile in Firestore
      await userService.createUserProfile(userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error handling user sign in:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.login({ email, password });
      
      if (response.requiresMFA) {
        return { requiresMFA: true, tempToken: response.tempToken };
      }
      
      await handleUserSignIn(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message || 'Failed to login');
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const response = await authService.loginWithGoogle();
      await handleUserSignIn(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message || 'Failed to login with Google');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      await handleUserSignIn(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message || 'Failed to register');
      throw error;
    }
  };

  const verifyMFA = async (tempToken, mfaCode) => {
    try {
      setError(null);
      const response = await authService.verifyMFA(tempToken, mfaCode);
      await handleUserSignIn(response.user);
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
    loginWithGoogle,
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