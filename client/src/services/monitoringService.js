import { securityConfig } from '../config/security';

class MonitoringService {
  constructor() {
    this.events = [];
    this.errorCount = 0;
    this.performanceMetrics = new Map();
    this.setupPerformanceMonitoring();
    this.setupErrorBoundary();
  }

  // Initialize performance monitoring
  setupPerformanceMonitoring() {
    if (typeof window !== 'undefined') {
      // Monitor page load performance
      window.addEventListener('load', () => {
        const metrics = this.getPerformanceMetrics();
        this.logPerformance('page_load', metrics);
      });

      // Monitor network requests
      this.setupNetworkMonitoring();
    }
  }

  // Setup global error boundary
  setupErrorBoundary() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError({
          type: 'runtime_error',
          message: event.message,
          source: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          type: 'unhandled_promise',
          message: event.reason?.message || 'Unhandled Promise Rejection',
          stack: event.reason?.stack,
        });
      });
    }
  }

  // Setup network request monitoring
  setupNetworkMonitoring() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        this.logNetworkRequest({
          url: args[0],
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: performance.now() - startTime,
        });
        return response;
      } catch (error) {
        this.logNetworkError({
          url: args[0],
          method: args[1]?.method || 'GET',
          error: error.message,
          duration: performance.now() - startTime,
        });
        throw error;
      }
    };
  }

  // Get performance metrics
  getPerformanceMetrics() {
    if (typeof window === 'undefined') return {};

    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      domComplete: navigation?.domComplete,
      loadEventEnd: navigation?.loadEventEnd,
      firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
      domInteractive: navigation?.domInteractive,
      resourceCount: performance.getEntriesByType('resource').length,
    };
  }

  // Log security event
  logSecurityEvent(event) {
    const securityLog = {
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity || 'info',
      details: this.sanitizeLogData(event.details),
      userId: event.userId,
      sessionId: event.sessionId,
    };

    this.events.push(securityLog);

    // Check if we need to alert based on thresholds
    if (this.shouldTriggerAlert(securityLog)) {
      this.triggerSecurityAlert(securityLog);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService('security_event', securityLog);
    } else {
      console.warn('Security Event:', securityLog);
    }
  }

  // Log error with context
  logError(error) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: error.type || 'error',
      message: error.message,
      stack: error.stack,
      context: this.sanitizeLogData(error.context),
    };

    this.errorCount++;

    // Check error thresholds
    if (this.errorCount >= securityConfig.monitoring.alertThresholds.failedLogins) {
      this.triggerSecurityAlert({
        type: 'error_threshold_exceeded',
        details: { errorCount: this.errorCount },
      });
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService('error', errorLog);
    } else {
      console.error('Error:', errorLog);
    }
  }

  // Log performance metrics
  logPerformance(type, metrics) {
    const performanceLog = {
      timestamp: new Date().toISOString(),
      type,
      metrics: this.sanitizeLogData(metrics),
    };

    // Store metrics for threshold checking
    this.performanceMetrics.set(type, {
      ...metrics,
      timestamp: Date.now(),
    });

    // Check performance thresholds
    if (metrics.duration > securityConfig.monitoring.alertThresholds.responseTime) {
      this.triggerSecurityAlert({
        type: 'performance_threshold_exceeded',
        details: { type, duration: metrics.duration },
      });
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService('performance', performanceLog);
    } else {
      console.log('Performance:', performanceLog);
    }
  }

  // Log network request
  logNetworkRequest(request) {
    const networkLog = {
      timestamp: new Date().toISOString(),
      url: this.sanitizeUrl(request.url),
      method: request.method,
      status: request.status,
      duration: request.duration,
    };

    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService('network_request', networkLog);
    } else {
      console.log('Network Request:', networkLog);
    }
  }

  // Log network error
  logNetworkError(error) {
    const networkErrorLog = {
      timestamp: new Date().toISOString(),
      url: this.sanitizeUrl(error.url),
      method: error.method,
      error: error.error,
      duration: error.duration,
    };

    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService('network_error', networkErrorLog);
    } else {
      console.error('Network Error:', networkErrorLog);
    }
  }

  // Check if alert should be triggered
  shouldTriggerAlert(event) {
    const { alertThresholds } = securityConfig.monitoring;
    
    switch (event.type) {
      case 'failed_login':
        return this.errorCount >= alertThresholds.failedLogins;
      case 'error':
        return this.errorCount >= alertThresholds.errorRate;
      default:
        return event.severity === 'critical';
    }
  }

  // Trigger security alert
  triggerSecurityAlert(alert) {
    const alertData = {
      timestamp: new Date().toISOString(),
      type: alert.type,
      details: this.sanitizeLogData(alert.details),
      severity: alert.severity || 'high',
    };

    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService('security_alert', alertData);
    } else {
      console.error('Security Alert:', alertData);
    }
  }

  // Sanitize sensitive data in logs
  sanitizeLogData(data) {
    if (!data) return data;

    const sanitized = { ...data };
    const sensitiveFields = securityConfig.monitoring.sensitiveFields;

    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeLogData(sanitized[key]);
      }
    });

    return sanitized;
  }

  // Sanitize URLs in logs
  sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove sensitive query parameters
      const sensitiveParams = ['token', 'key', 'password', 'secret'];
      sensitiveParams.forEach(param => urlObj.searchParams.delete(param));
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // Send data to monitoring service
  async sendToMonitoringService(eventType, data) {
    // Implement your monitoring service integration here
    // Example: Send to Application Insights, Sentry, or custom monitoring service
    try {
      await fetch(process.env.REACT_APP_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_MONITORING_API_KEY,
        },
        body: JSON.stringify({
          eventType,
          data,
          environment: process.env.NODE_ENV,
          appVersion: process.env.REACT_APP_VERSION,
        }),
      });
    } catch (error) {
      console.error('Failed to send to monitoring service:', error);
    }
  }
}

export const monitoringService = new MonitoringService(); 