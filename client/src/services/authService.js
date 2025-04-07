import { securityConfig, securityUtils } from '../config/security';
import axios from 'axios';
import * as OTPAuth from 'otpauth';

class AuthService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.tokenKey = 'auth_token';
    this.refreshKey = 'refresh_token';
    this.mfaKey = 'mfa_secret';
  }

  // Initialize authentication state
  async init() {
    try {
      const token = this.getToken();
      if (token) {
        await this.validateToken(token);
      }
    } catch (error) {
      this.logout();
    }
  }

  // Register new user
  async register(userData) {
    try {
      const sanitizedData = Object.keys(userData).reduce((acc, key) => {
        acc[key] = securityUtils.sanitizeInput(userData[key]);
        return acc;
      }, {});

      // Validate password strength
      const passwordValidation = securityUtils.validatePassword(sanitizedData.password);
      if (!passwordValidation.isValid) {
        throw new Error('Password does not meet security requirements');
      }

      const response = await axios.post(`${this.baseURL}/auth/register`, sanitizedData);
      
      if (securityConfig.auth.mfa.enabled) {
        // Generate MFA secret
        const mfaSecret = this.generateMFASecret(sanitizedData.email);
        await this.setupMFA(mfaSecret);
        return { ...response.data, mfaSecret };
      }

      return response.data;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Login with credentials
  async login(credentials) {
    try {
      const sanitizedCredentials = {
        email: securityUtils.sanitizeInput(credentials.email),
        password: credentials.password, // Don't sanitize password
      };

      const response = await axios.post(`${this.baseURL}/auth/login`, sanitizedCredentials);
      
      if (response.data.requiresMFA) {
        return { requiresMFA: true, tempToken: response.data.tempToken };
      }

      this.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setupRefreshTimer();
      
      return response.data;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Verify MFA token
  async verifyMFA(tempToken, mfaCode) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/verify-mfa`, {
        tempToken,
        mfaCode: securityUtils.sanitizeInput(mfaCode),
      });

      this.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setupRefreshTimer();
      
      return response.data;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await axios.post(`${this.baseURL}/auth/logout`, { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
      this.clearRefreshTimer();
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await axios.post(`${this.baseURL}/auth/refresh`, { refreshToken });
      this.setTokens(response.data.accessToken, response.data.refreshToken);
      
      return response.data.accessToken;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Generate MFA secret
  generateMFASecret(identifier) {
    const totp = new OTPAuth.TOTP({
      issuer: 'TaskManager',
      label: identifier,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.generate(),
    });

    return {
      secret: totp.secret.base32,
      uri: totp.toString(),
    };
  }

  // Setup MFA for user
  async setupMFA(mfaSecret) {
    try {
      const token = this.getToken();
      await axios.post(
        `${this.baseURL}/auth/setup-mfa`,
        { mfaSecret },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem(this.mfaKey, mfaSecret.secret);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Validate current token
  async validateToken(token) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/validate`, { token });
      return response.data.valid;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Token management
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshKey);
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshKey, refreshToken);
  }

  clearTokens() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.mfaKey);
  }

  // Refresh timer management
  setupRefreshTimer() {
    this.clearRefreshTimer();
    // Refresh 1 minute before expiry
    const refreshTime = (securityConfig.auth.session.maxAge - 60000);
    this.refreshTimer = setInterval(() => this.refreshToken(), refreshTime);
  }

  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  // Error handling
  handleAuthError(error) {
    if (error.response?.status === 401) {
      this.logout();
    }
    // Log error securely
    console.error('Auth error:', {
      status: error.response?.status,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

export const authService = new AuthService(); 