/**
 * Unit tests for environment configuration and validation
 */

import { env, envUtils, EnvValidationError } from '../env';

// Mock process.env for testing
const originalEnv = process.env;

describe('Environment Validation', () => {
  beforeEach(() => {
    // Reset process.env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('env validation', () => {
    it('should validate required environment variables successfully', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyTestKey123';

      // Re-import to trigger validation
      jest.resetModules();
      const { env: testEnv } = require('../env');

      expect(testEnv.GEMINI_API_KEY).toBe('AIzaSyTestKey123');
      expect(testEnv.NODE_ENV).toBe('test');
    });

    it('should throw error for missing GEMINI_API_KEY', () => {
      delete process.env.GEMINI_API_KEY;

      expect(() => {
        jest.resetModules();
        require('../env');
      }).toThrow(EnvValidationError);
    });

    it('should throw error for invalid GEMINI_API_KEY format', () => {
      process.env.GEMINI_API_KEY = 'invalid-key';

      expect(() => {
        jest.resetModules();
        require('../env');
      }).toThrow(EnvValidationError);
    });

    it('should validate GEMINI_API_KEY starting with AIza', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyValidKey123';

      jest.resetModules();
      const { env: testEnv } = require('../env');

      expect(testEnv.GEMINI_API_KEY).toBe('AIzaSyValidKey123');
    });
  });

  describe('envUtils', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'AIzaSyTestKey123';
      process.env.TEST_VAR = 'test_value';
      process.env.TEST_NUMBER = '42';
      process.env.TEST_BOOL_TRUE = 'true';
      process.env.TEST_BOOL_FALSE = 'false';
    });

    it('should check if environment is valid', () => {
      expect(envUtils.isValid()).toBe(true);
    });

    it('should return validation errors', () => {
      delete process.env.GEMINI_API_KEY;
      const errors = envUtils.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('GEMINI_API_KEY');
    });

    it('should get optional environment variables', () => {
      expect(envUtils.getOptional('TEST_VAR')).toBe('test_value');
      expect(envUtils.getOptional('NON_EXISTENT', 'default')).toBe('default');
    });

    it('should get boolean environment variables', () => {
      expect(envUtils.getBoolean('TEST_BOOL_TRUE')).toBe(true);
      expect(envUtils.getBoolean('TEST_BOOL_FALSE')).toBe(false);
      expect(envUtils.getBoolean('NON_EXISTENT', true)).toBe(true);
    });

    it('should get number environment variables', () => {
      expect(envUtils.getNumber('TEST_NUMBER')).toBe(42);
      expect(envUtils.getNumber('NON_EXISTENT', 100)).toBe(100);
      expect(envUtils.getNumber('INVALID_NUMBER', 50)).toBe(50);
    });
  });

  describe('error handling', () => {
    it('should provide helpful error messages', () => {
      delete process.env.GEMINI_API_KEY;

      try {
        jest.resetModules();
        require('../env');
      } catch (error) {
        expect(error).toBeInstanceOf(EnvValidationError);
        expect((error as EnvValidationError).variable).toBe('GEMINI_API_KEY');
        expect((error as EnvValidationError).message).toContain('GEMINI_API_KEY');
      }
    });
  });
});

