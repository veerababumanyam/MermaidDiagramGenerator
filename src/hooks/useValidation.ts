/**
 * Custom hook for input validation and sanitization
 * Provides real-time validation feedback and security
 */

import { useState, useCallback, useMemo } from 'react';
import { inputValidation, securityLogger } from '../utils/security';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized: string;
}

export interface ValidationOptions {
  maxLength?: number;
  minLength?: number;
  allowHtml?: boolean;
  allowSpecialChars?: boolean;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateMermaid?: boolean;
}

export interface UseValidationReturn {
  value: string;
  setValue: (value: string) => void;
  validation: ValidationResult;
  isValidating: boolean;
  validate: () => ValidationResult;
  reset: () => void;
  hasErrors: boolean;
}

/**
 * Hook for text input validation with security
 */
export const useTextValidation = (
  initialValue: string = '',
  options: ValidationOptions = {}
): UseValidationReturn => {
  const [value, setValueState] = useState(initialValue);
  const [isValidating, setIsValidating] = useState(false);

  const validateInput = useCallback((input: string): ValidationResult => {
    let result: ValidationResult;

    if (options.validateMermaid) {
      const mermaidValidation = inputValidation.validateMermaidCode(input);
      result = {
        isValid: mermaidValidation.isValid,
        errors: mermaidValidation.errors,
        sanitized: input // Mermaid code doesn't need HTML sanitization
      };
    } else {
      result = inputValidation.validateTextInput(input, {
        maxLength: options.maxLength,
        minLength: options.minLength,
        allowHtml: options.allowHtml,
        allowSpecialChars: options.allowSpecialChars
      });
    }

    // Log security threats
    if (!result.isValid && result.errors.some(error =>
      error.includes('dangerous') || error.includes('invalid')
    )) {
      securityLogger.logThreat('suspicious_input', {
        input: input.substring(0, 100), // Log first 100 chars only
        errors: result.errors,
        type: options.validateMermaid ? 'mermaid' : 'text'
      });
    }

    return result;
  }, [options]);

  const validation = useMemo(() => validateInput(value), [value, validateInput]);

  const setValue = useCallback((newValue: string) => {
    if (options.debounceMs && options.debounceMs > 0) {
      setIsValidating(true);
      setTimeout(() => {
        setValueState(newValue);
        setIsValidating(false);
      }, options.debounceMs);
    } else {
      setValueState(newValue);
    }
  }, [options.debounceMs]);

  const validate = useCallback(() => {
    return validateInput(value);
  }, [value, validateInput]);

  const reset = useCallback(() => {
    setValueState(initialValue);
    setIsValidating(false);
  }, [initialValue]);

  return {
    value,
    setValue,
    validation,
    isValidating,
    validate,
    reset,
    hasErrors: validation.errors.length > 0
  };
};

/**
 * Hook for file upload validation
 */
export const useFileValidation = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
} = {}) => {
  const [isValidating, setIsValidating] = useState(false);

  const validateFile = useCallback(async (file: File): Promise<ValidationResult> => {
    setIsValidating(true);

    try {
      const result = inputValidation.validateFileUpload(file, options);

      if (!result.isValid) {
        securityLogger.logThreat('suspicious_input', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          errors: result.errors,
          type: 'file_upload'
        });
      }

      return {
        isValid: result.isValid,
        errors: result.errors,
        sanitized: file.name // Return sanitized filename
      };
    } finally {
      setIsValidating(false);
    }
  }, [options]);

  return {
    validateFile,
    isValidating
  };
};

/**
 * Hook for rate limiting user actions
 */
export const useRateLimit = (
  actionKey: string,
  options: {
    maxAttempts: number;
    windowMs: number;
  }
) => {
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    allowed: boolean;
    remainingAttempts: number;
    resetTime: number;
  }>({
    allowed: true,
    remainingAttempts: options.maxAttempts,
    resetTime: 0
  });

  const checkRateLimit = useCallback(() => {
    const { rateLimit } = require('../utils/security');
    const result = rateLimit.check(actionKey, options);
    setRateLimitInfo(result);

    if (!result.allowed) {
      securityLogger.logThreat('rate_limit', {
        action: actionKey,
        remainingAttempts: result.remainingAttempts,
        resetTime: result.resetTime
      });
    }

    return result.allowed;
  }, [actionKey, options]);

  const resetRateLimit = useCallback(() => {
    const { rateLimit } = require('../utils/security');
    rateLimit.attempts.delete(actionKey);
    setRateLimitInfo({
      allowed: true,
      remainingAttempts: options.maxAttempts,
      resetTime: 0
    });
  }, [actionKey, options.maxAttempts]);

  return {
    ...rateLimitInfo,
    checkRateLimit,
    resetRateLimit,
    isRateLimited: !rateLimitInfo.allowed,
    timeUntilReset: Math.max(0, rateLimitInfo.resetTime - Date.now())
  };
};

/**
 * Hook for form validation with multiple fields
 */
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Record<keyof T, ValidationOptions>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string[]>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback((field: keyof T, value: string): ValidationResult => {
    const rules = validationRules[field];
    if (!rules) return { isValid: true, errors: [], sanitized: value };

    return inputValidation.validateTextInput(value, rules);
  }, [validationRules]);

  const setFieldValue = useCallback((field: keyof T, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Validate on change if specified
    const rules = validationRules[field];
    if (rules?.validateOnChange) {
      const result = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: result.errors
      }));
    }
  }, [validateField, validationRules]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate when field becomes touched
    const value = values[field];
    if (typeof value === 'string') {
      const result = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: result.errors
      }));
    }
  }, [validateField, values]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string[]>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const fieldKey = field as keyof T;
      const value = values[fieldKey];

      if (typeof value === 'string') {
        const result = validateField(fieldKey, value);
        if (!result.isValid) {
          newErrors[fieldKey] = result.errors;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(validationRules).reduce((acc, field) => ({
      ...acc,
      [field]: true
    }), {}));

    return isValid;
  }, [validateField, validationRules, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(fieldErrors => !fieldErrors || fieldErrors.length === 0);
  }, [errors]);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateForm,
    resetForm,
    isValid,
    isDirty,
    hasErrors: Object.keys(errors).length > 0
  };
};

