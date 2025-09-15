/**
 * Security configuration and utilities
 * Implements security headers, input validation, and other security measures
 */

import DOMPurify from 'dompurify';

// Security headers configuration
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://esm.sh https://aistudiocdn.com https://cdn.tailwindcss.com",
    "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://ai.google.dev https://generativelanguage.googleapis.com https://*.googleapis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; '),

  // Other security headers
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'payment=()',
    'usb=()'
  ].join(', '),

  // HTTPS Strict Transport Security (only in production)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

/**
 * Apply security headers to the document
 */
export const applySecurityHeaders = () => {
  if (typeof document === 'undefined') return;

  const metaTags = [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { name: 'format-detection', content: 'telephone=no' },
    { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
  ];

  metaTags.forEach(({ name, content, 'http-equiv': httpEquiv }) => {
    const meta = document.createElement('meta');
    if (httpEquiv) {
      meta.setAttribute('http-equiv', httpEquiv);
    } else {
      meta.name = name!;
    }
    meta.content = content!;
    document.head.appendChild(meta);
  });
};

/**
 * Input validation utilities
 */
export const inputValidation = {
  /**
   * Sanitize HTML input to prevent XSS
   */
  sanitizeHtml: (input: string): string => {
    if (typeof window === 'undefined') return input;
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['br', 'p', 'strong', 'em', 'code', 'pre'],
      ALLOWED_ATTR: []
    });
  },

  /**
   * Validate Mermaid diagram code
   */
  validateMermaidCode: (code: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!code || code.trim().length === 0) {
      errors.push('Code cannot be empty');
    }

    if (code.length > 50000) {
      errors.push('Code is too long (max 50,000 characters)');
    }

    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        errors.push('Code contains potentially dangerous content');
      }
    });

    // Basic Mermaid syntax validation
    const mermaidKeywords = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'pie', 'gitGraph'];
    const hasValidStart = mermaidKeywords.some(keyword => code.trim().startsWith(keyword));

    if (!hasValidStart && code.trim().length > 0) {
      errors.push('Code does not appear to be valid Mermaid syntax');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate user input for general text fields
   */
  validateTextInput: (input: string, options: {
    maxLength?: number;
    minLength?: number;
    allowHtml?: boolean;
    allowSpecialChars?: boolean;
  } = {}): { isValid: boolean; errors: string[]; sanitized: string } => {
    const errors: string[] = [];
    let sanitized = input;

    // Length validation
    if (options.minLength && input.length < options.minLength) {
      errors.push(`Input must be at least ${options.minLength} characters`);
    }

    if (options.maxLength && input.length > options.maxLength) {
      errors.push(`Input must be no more than ${options.maxLength} characters`);
      sanitized = input.substring(0, options.maxLength);
    }

    // HTML sanitization
    if (!options.allowHtml) {
      sanitized = inputValidation.sanitizeHtml(sanitized);
    }

    // Special characters validation
    if (!options.allowSpecialChars) {
      const specialCharsRegex = /[<>{}[\]\\]/;
      if (specialCharsRegex.test(sanitized)) {
        errors.push('Input contains invalid special characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  },

  /**
   * Validate file uploads
   */
  validateFileUpload: (file: File, options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Size validation
    if (options.maxSize && file.size > options.maxSize) {
      errors.push(`File size must be less than ${options.maxSize / 1024 / 1024}MB`);
    }

    // Type validation
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
    }

    // Extension validation
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !options.allowedExtensions.includes(extension)) {
        errors.push(`File extension must be one of: ${options.allowedExtensions.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Rate limiting utilities
 */
export const rateLimit = {
  attempts: new Map<string, { count: number; resetTime: number }>(),

  /**
   * Check if an action should be rate limited
   */
  check: (key: string, options: {
    maxAttempts: number;
    windowMs: number;
  }): { allowed: boolean; remainingAttempts: number; resetTime: number } => {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.attempts.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return {
        allowed: true,
        remainingAttempts: options.maxAttempts - 1,
        resetTime: now + options.windowMs
      };
    }

    if (record.count >= options.maxAttempts) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: record.resetTime
      };
    }

    record.count++;
    return {
      allowed: true,
      remainingAttempts: options.maxAttempts - record.count,
      resetTime: record.resetTime
    };
  },

  /**
   * Clean up expired records
   */
  cleanup: () => {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
};

/**
 * Security event logging
 */
export const securityLogger = {
  /**
   * Log security events
   */
  log: (event: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    };

    console.warn('Security Event:', logEntry);

    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to security monitoring service
    }
  },

  /**
   * Log potential security threats
   */
  logThreat: (type: 'xss' | 'injection' | 'suspicious_input' | 'rate_limit', details: any) => {
    this.log(`security_threat_${type}`, details);
  }
};

// Auto-cleanup rate limit records every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => rateLimit.cleanup(), 5 * 60 * 1000);
}

