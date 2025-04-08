import axios from 'axios';
import { securityConfig, securityUtils } from '../config/security';
import { authService } from './authService';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.setupAxiosInstance();
    this.setupInterceptors();
  }

  // Create axios instance with default config
  setupAxiosInstance() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  }

  // Setup request/response interceptors
  setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        // Add authorization header
        const token = authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token if available
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }

        // Sanitize request data
        if (config.data && typeof config.data === 'object') {
          config.data = securityUtils.sanitizeData(config.data, securityConfig.monitoring.sensitiveFields);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Validate response data
        if (response.data) {
          this.validateResponseData(response.data);
        }
        return response;
      },
      async (error) => {
        // Handle 401 errors
        if (error.response?.status === 401) {
          try {
            // Try to refresh token
            const newToken = await authService.refreshToken();
            if (newToken) {
              // Retry failed request with new token
              const config = error.config;
              config.headers.Authorization = `Bearer ${newToken}`;
              return this.api.request(config);
            }
          } catch (refreshError) {
            // If refresh fails, logout user
            authService.logout();
            return Promise.reject(refreshError);
          }
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          if (retryAfter) {
            // Wait for specified time and retry
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return this.api.request(error.config);
          }
        }

        // Log error securely
        this.logError(error);
        return Promise.reject(error);
      }
    );
  }

  // Validate response data
  validateResponseData(data) {
    // Check for common security issues in responses
    const stringData = JSON.stringify(data);
    
    // Check for potential XSS content
    if (/<script\b[^>]*>[\s\S]*?<\/script>/gi.test(stringData)) {
      throw new Error('Potential XSS attack detected in response');
    }

    // Check for sensitive data patterns
    const sensitivePatterns = [
      /\b\d{16}\b/, // Credit card numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // Email addresses
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(stringData)) {
        console.warn('Potential sensitive data detected in response');
        break;
      }
    }
  }

  // Secure logging
  logError(error) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      // Don't log sensitive headers
      headers: securityUtils.sanitizeData(error.config?.headers, ['authorization', 'cookie', 'x-csrf-token']),
    };

    // Log to monitoring service or console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', errorLog);
    } else {
      // Implement production logging service
      // this.monitoringService.logError(errorLog);
    }
  }

  // Generic request method with rate limiting
  async request(method, endpoint, data = null, config = {}) {
    try {
      // Check rate limit
      if (!securityUtils.checkRateLimit(endpoint)) {
        throw new Error(securityConfig.api.rateLimiting.message);
      }

      const response = await this.api.request({
        method,
        url: endpoint,
        data,
        ...config,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint, config = {}) {
    return this.request('GET', endpoint, null, config);
  }

  async post(endpoint, data, config = {}) {
    return this.request('POST', endpoint, data, config);
  }

  async put(endpoint, data, config = {}) {
    return this.request('PUT', endpoint, data, config);
  }

  async patch(endpoint, data, config = {}) {
    return this.request('PATCH', endpoint, data, config);
  }

  async delete(endpoint, config = {}) {
    return this.request('DELETE', endpoint, null, config);
  }
}

export const apiService = new ApiService(); 