/**
 * Hook for Meta Template Validation
 * Provides validation functionality for template creation
 */

import { useState, useCallback } from 'react';
import { CreateTemplatePayload } from '../types/templateTypes';
import MetaTemplateValidator, { ValidationResult, ValidationError } from '../lib/metaTemplateValidator';

export interface UseTemplateValidationReturn {
  validateTemplate: (payload: CreateTemplatePayload) => ValidationResult;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  userErrors: ValidationError[]; // Only user-facing errors
  userWarnings: ValidationError[]; // Only user-facing warnings
  errorMessage: string;
  clearValidation: () => void;
  hasErrors: boolean;
  hasWarnings: boolean;
  hasUserErrors: boolean;
  hasUserWarnings: boolean;
}

export const useTemplateValidation = (): UseTemplateValidationReturn => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    userErrors: [],
    userWarnings: []
  });

  const validateTemplate = useCallback((payload: CreateTemplatePayload): ValidationResult => {
    const result = MetaTemplateValidator.validateTemplate(payload);
    setValidationResult(result);
    return result;
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult({
      isValid: true,
      errors: [],
      warnings: [],
      userErrors: [],
      userWarnings: []
    });
  }, []);

  const errorMessage = MetaTemplateValidator.formatValidationResult(validationResult);

  return {
    validateTemplate,
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    userErrors: validationResult.userErrors,
    userWarnings: validationResult.userWarnings,
    errorMessage,
    clearValidation,
    hasErrors: validationResult.errors.length > 0,
    hasWarnings: validationResult.warnings.length > 0,
    hasUserErrors: validationResult.userErrors.length > 0,
    hasUserWarnings: validationResult.userWarnings.length > 0
  };
};

export default useTemplateValidation;
