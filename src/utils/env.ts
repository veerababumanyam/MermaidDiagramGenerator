/**
 * Environment Configuration and Validation
 * Provides centralized environment variable management with validation and error handling
 */

interface EnvConfig {
  GEMINI_API_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
  VITE_APP_TITLE: string;
}

class EnvValidationError extends Error {
  constructor(message: string, public readonly variable: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates and retrieves environment variables with proper error handling
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (!value && !defaultValue) {
    throw new EnvValidationError(
      `Environment variable ${key} is required but not set`,
      key
    );
  }

  return value!;
}

/**
 * Validates environment configuration
 */
function validateEnvironment(): EnvConfig {
  const config: EnvConfig = {
    GEMINI_API_KEY: getEnvVar('GEMINI_API_KEY'),
    NODE_ENV: (getEnvVar('NODE_ENV', 'development') as EnvConfig['NODE_ENV']),
    VITE_APP_TITLE: getEnvVar('VITE_APP_TITLE', 'Mermaid Diagram Generator'),
  };

  // Additional validation for specific variables
  if (config.GEMINI_API_KEY.length < 10) {
    throw new EnvValidationError(
      'GEMINI_API_KEY appears to be invalid (too short)',
      'GEMINI_API_KEY'
    );
  }

  if (!config.GEMINI_API_KEY.startsWith('AIza')) {
    throw new EnvValidationError(
      'GEMINI_API_KEY should start with "AIza"',
      'GEMINI_API_KEY'
    );
  }

  return config;
}

/**
 * Safe environment configuration with error handling
 */
export const env: EnvConfig = (() => {
  try {
    return validateEnvironment();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error(`Environment validation failed: ${error.message}`);
      console.error(`Missing or invalid environment variable: ${error.variable}`);

      // In development, show helpful setup instructions
      if (process.env.NODE_ENV !== 'production') {
        console.error('\nTo fix this issue:');
        console.error('1. Copy .env.example to .env.local');
        console.error('2. Add your GEMINI_API_KEY to .env.local');
        console.error('3. Restart the development server');
      }

      throw error;
    }

    throw error;
  }
})();

/**
 * Type-safe environment variable access
 */
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/**
 * Environment validation utilities
 */
export const envUtils = {
  /**
   * Checks if all required environment variables are properly configured
   */
  isValid(): boolean {
    try {
      validateEnvironment();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Gets validation errors for environment configuration
   */
  getValidationErrors(): string[] {
    const errors: string[] = [];

    try {
      validateEnvironment();
    } catch (error) {
      if (error instanceof EnvValidationError) {
        errors.push(error.message);
      } else {
        errors.push('Unknown environment validation error');
      }
    }

    return errors;
  },

  /**
   * Safe getter for optional environment variables
   */
  getOptional(key: string, defaultValue = ''): string {
    return process.env[key] || defaultValue;
  },

  /**
   * Safe getter for boolean environment variables
   */
  getBoolean(key: string, defaultValue = false): boolean {
    const value = process.env[key]?.toLowerCase();
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return defaultValue;
  },

  /**
   * Safe getter for numeric environment variables
   */
  getNumber(key: string, defaultValue = 0): number {
    const value = process.env[key];
    const parsed = parseFloat(value || '');
    return isNaN(parsed) ? defaultValue : parsed;
  }
};

/**
 * Environment configuration for different deployment environments
 */
export const environmentConfigs = {
  development: {
    apiUrl: 'http://localhost:5173',
    enableDebugLogging: true,
    enableDevTools: true,
  },
  production: {
    apiUrl: window.location.origin,
    enableDebugLogging: false,
    enableDevTools: false,
  },
  test: {
    apiUrl: 'http://localhost:5173',
    enableDebugLogging: false,
    enableDevTools: false,
  }
} as const;

export const currentEnvConfig = environmentConfigs[env.NODE_ENV];

