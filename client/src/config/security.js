export const securityConfig = {
  // Authentication settings
  auth: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true,
    },
    mfa: {
      enabled: false,
      methods: ['authenticator', 'sms'],
      backupCodes: 10,
    },
    session: {
      maxAge: 3600000, // 1 hour
      extendOnActivity: true,
      maxConcurrentSessions: 3,
      refreshTokenExpiry: 604800000, // 7 days
    },
    lockout: {
      maxAttempts: 5,
      lockoutDuration: 900000, // 15 minutes
      resetAfter: 3600000, // 1 hour
    },
  },

  // API Security
  api: {
    rateLimiting: {
      windowMs: 900000, // 15 minutes
      maxRequests: 100, // per window
      message: 'Too many requests, please try again later.',
    },
    jwt: {
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      rotateRefreshToken: true,
    },
    cors: {
      allowedOrigins: ['http://localhost:3000'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Total-Count'],
      credentials: true,
      maxAge: 86400, // 24 hours
    },
  },

  // Data Security
  data: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 2592000000, // 30 days
    },
    backup: {
      frequency: 86400000, // 24 hours
      retentionPeriod: 2592000000, // 30 days
      encrypted: true,
    },
    masking: {
      patterns: {
        email: /^(.{3}).*(@.*)/,
        phone: /^(\+\d{2})(\d+)(\d{4})$/,
        creditCard: /^(\d{4})(\d+)(\d{4})$/,
      },
      replacements: {
        email: '$1***$2',
        phone: '$1****$3',
        creditCard: '$1 **** **** $3',
      },
    },
  },

  // Cookie Settings
  cookies: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    path: '/',
  },

  // Monitoring
  monitoring: {
    logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
    alertThresholds: {
      failedLogins: 10,
      errorRate: 0.05,
      responseTime: 5000,
    },
  },
};

// Security utility functions
export const securityUtils = {
  validatePassword: (password) => {
    const { passwordPolicy } = securityConfig.auth;
    const errors = [];

    if (password.length < passwordPolicy.minLength) {
      errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
    }

    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '');
  },

  // Centralized data sanitization function
  sanitizeData: (data, sensitiveFields) => {
    if (!data) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => securityUtils.sanitizeData(item, sensitiveFields));
    }
    
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).reduce((acc, key) => {
        // Skip sanitization for specific fields or redact sensitive ones
        if (sensitiveFields.some(field => key.toLowerCase() === field.toLowerCase())) {
          acc[key] = '[REDACTED]';
        } else {
          acc[key] = typeof data[key] === 'object' 
            ? securityUtils.sanitizeData(data[key], sensitiveFields)
            : securityUtils.sanitizeInput(data[key]);
        }
        return acc;
      }, {});
    }

    return data;
  },

  // Generate secure random tokens
  generateSecureToken: (length = 32) => {
    return crypto.getRandomValues(new Uint8Array(length))
      .reduce((acc, val) => acc + (val % 36).toString(36), '');
  },

  // Mask sensitive data
  maskSensitiveData: (data, type) => {
    const { patterns, replacements } = securityConfig.data.masking;
    if (!patterns[type] || !replacements[type]) return data;
    return data.replace(patterns[type], replacements[type]);
  },

  // Rate limiting check
  checkRateLimit: (() => {
    const requests = new Map();
    return (identifier) => {
      const now = Date.now();
      const { windowMs, maxRequests } = securityConfig.api.rateLimiting;
      
      if (!requests.has(identifier)) {
        requests.set(identifier, [now]);
        return true;
      }

      const userRequests = requests.get(identifier);
      const windowStart = now - windowMs;
      const recentRequests = userRequests.filter(time => time > windowStart);
      
      if (recentRequests.length >= maxRequests) return false;
      
      recentRequests.push(now);
      requests.set(identifier, recentRequests);
      return true;
    };
  })(),
};

// Export security middleware
export const securityMiddleware = {
  validateSession: (req, res, next) => {
    // Session validation logic
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    // Implement your token validation logic here
    next();
  },

  rateLimiter: (req, res, next) => {
    const identifier = req.ip;
    if (!securityUtils.checkRateLimit(identifier)) {
      return res.status(429).json({ error: securityConfig.api.rateLimiting.message });
    }
    next();
  },

  sanitizeRequest: (req, res, next) => {
    // Sanitize request body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        req.body[key] = securityUtils.sanitizeInput(req.body[key]);
      });
    }
    next();
  },
}; 