/**
 * Meta WhatsApp Business API Template Validation Service
 * Validates template payloads before sending to Meta API to prevent errors
 */

import { CreateTemplatePayload, TemplateComponent, AuthTemplateComponent } from '../types/templateTypes';
import { SUPPORTED_LANGUAGES as SL } from './languages';
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
  userFacing: boolean; // New field to distinguish user vs technical errors
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  userErrors: ValidationError[]; // Only user-facing errors
  userWarnings: ValidationError[]; // Only user-facing warnings
}

export class MetaTemplateValidator {


  private static readonly SUPPORTED_LANGUAGES = SL.map(language => language.code);

  private static readonly CHARACTER_LIMITS = {
    template_name: { min: 1, max: 512 },
    header_text: { min: 1, max: 60 },
    body_text: { min: 1, max: 1024 },
    footer_text: { min: 1, max: 60 },
    button_text: { min: 1, max: 25 },
    url: { min: 1, max: 2000 },
    phone_number: { min: 1, max: 20 }
  };

  /**
   * Helper method to create validation errors
   */
  private static createError(
    field: string,
    message: string,
    code: string,
    severity: 'error' | 'warning' = 'error',
    userFacing: boolean = true
  ): ValidationError {
    return {
      field,
      message,
      code,
      severity,
      userFacing
    };
  }

  /**
   * Main validation method
   */
  static validateTemplate(payload: CreateTemplatePayload): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Basic field validation
    this.validateBasicFields(payload, errors, warnings);
    
    // Category-specific validation
    this.validateCategorySpecific(payload, errors, warnings);
    
    // Component validation (pass category context)
    this.validateComponents(payload, payload.category, errors, warnings);
    
    // Button validation
    this.validateButtons(payload, errors, warnings);

    // Filter user-facing errors and warnings
    const userErrors = errors.filter(error => error.userFacing);
    const userWarnings = warnings.filter(warning => warning.userFacing);

    return {
      isValid: userErrors.length === 0,
      errors,
      warnings,
      userErrors,
      userWarnings
    };
  }

  /**
   * Validate basic template fields
   */
  private static validateBasicFields(
    payload: CreateTemplatePayload, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    // Template name validation
    if (!payload.name || payload.name.trim().length === 0) {
      errors.push(this.createError(
        'name',
        'Template name is required',
        'MISSING_NAME',
        'error',
        true // User-facing
      ));
    } else {
      if (payload.name.length < this.CHARACTER_LIMITS.template_name.min) {
        errors.push(this.createError(
          'name',
          `Template name must be at least ${this.CHARACTER_LIMITS.template_name.min} character`,
          'NAME_TOO_SHORT',
          'error',
          true // User-facing
        ));
      }
      if (payload.name.length > this.CHARACTER_LIMITS.template_name.max) {
        errors.push(this.createError(
          'name',
          `Template name must not exceed ${this.CHARACTER_LIMITS.template_name.max} characters`,
          'NAME_TOO_LONG',
          'error',
          true // User-facing
        ));
      }
      
      // Check for invalid characters in name
      if (!/^[a-zA-Z0-9_]+$/.test(payload.name)) {
        errors.push(this.createError(
          'name',
          'Template name can only contain letters, numbers, and underscores',
          'INVALID_NAME_CHARS',
          'error',
          true // User-facing
        ));
      }
    }

    // Language validation
    if (!payload.language || payload.language.trim().length === 0) {
      errors.push(this.createError(
        'language',
        'Language is required',
        'MISSING_LANGUAGE',
        'error',
        true // User-facing
      ));
    } else if (!this.SUPPORTED_LANGUAGES.includes(payload.language)) {
      errors.push(this.createError(
        'language',
        `Language '${payload.language}' is not supported by Meta`,
        'UNSUPPORTED_LANGUAGE',
        'error',
        true // User-facing
      ));
    }

    // Category validation
    if (!payload.category || !['MARKETING', 'UTILITY', 'AUTHENTICATION'].includes(payload.category)) {
      errors.push(this.createError(
        'category',
        'Category must be MARKETING, UTILITY, or AUTHENTICATION',
        'INVALID_CATEGORY',
        'error',
        false // Technical error - shouldn't happen in UI
      ));
    }
  }

  /**
   * Validate category-specific requirements
   */
  private static validateCategorySpecific(
    payload: CreateTemplatePayload,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    switch (payload.category) {
      case 'AUTHENTICATION':
        this.validateAuthenticationTemplate(payload, errors, warnings);
        break;
      case 'MARKETING':
        this.validateMarketingTemplate(payload, errors, warnings);
        break;
      case 'UTILITY':
        this.validateUtilityTemplate(payload, errors, warnings);
        break;
    }
  }

  /**
   * Validate AUTHENTICATION template specific requirements
   */
  private static validateAuthenticationTemplate(
    payload: CreateTemplatePayload,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const authPayload = payload as any; // Cast to access auth-specific properties
    
    // AUTHENTICATION templates must have exactly one OTP button
    // Use uppercase 'BUTTONS' to match the actual structure
    const buttonComponents = authPayload.components?.filter((c: any) => c.type === 'BUTTONS') || [];
    
    if (buttonComponents.length === 0) {
      errors.push(this.createError(
        'components',
        'AUTHENTICATION templates must have exactly one button of OTP type',
        'AUTH_MISSING_BUTTON',
        'error',
        true // User-facing
      ));
    } else if (buttonComponents.length > 1) {
      errors.push(this.createError(
        'components',
        'AUTHENTICATION templates must have exactly one button, not multiple',
        'AUTH_MULTIPLE_BUTTONS',
        'error',
        true // User-facing
      ));
    } else {
      const buttons = buttonComponents[0]?.buttons || [];
      // Check for OTP buttons - use uppercase 'OTP' to match the actual structure
      const otpButtons = buttons.filter((b: any) => b.type === 'OTP');
      
      if (otpButtons.length === 0) {
        errors.push(this.createError(
          'components',
          'AUTHENTICATION templates must have exactly one OTP button',
          'AUTH_NO_OTP_BUTTON',
          'error',
          true // User-facing
        ));
      } else if (otpButtons.length > 1) {
        errors.push(this.createError(
          'components',
          'AUTHENTICATION templates must have exactly one OTP button',
          'AUTH_MULTIPLE_OTP_BUTTONS',
          'error',
          true // User-facing
        ));
      }

      // Validate OTP button configuration
      if (otpButtons.length === 1) {
        const otpButton = otpButtons[0];
        this.validateOtpButton(otpButton, errors, warnings);
      }
    }

    // AUTHENTICATION templates should not have header components
    // Use uppercase 'HEADER' to match the actual structure
    const headerComponents = authPayload.components?.filter((c: any) => c.type === 'HEADER') || [];
    if (headerComponents.length > 0) {
      warnings.push(this.createError(
        'components',
        'AUTHENTICATION templates typically do not include header components',
        'AUTH_HEADER_WARNING',
        'warning',
        true // User-facing
      ));
    }
  }

  /**
   * Validate package name format
   */
  private static validatePackageName(packageName: string): { isValid: boolean; error?: string } {
    if (!packageName || packageName.trim().length === 0) {
      return { isValid: false, error: 'Package name is required' };
    }
    
    if (packageName.length > 224) {
      return { isValid: false, error: 'Package name must not exceed 224 characters' };
    }
    
    // Must be alphanumeric, underscore, or period
    if (!/^[a-zA-Z0-9_.]+$/.test(packageName)) {
      return { isValid: false, error: 'Package name can only contain letters, numbers, underscores, and periods' };
    }
    
    // Must have at least two segments separated by a dot
    const segments = packageName.split('.');
    if (segments.length < 2) {
      return { isValid: false, error: 'Package name must have at least two segments separated by a dot (e.g., com.example.app)' };
    }
    
    // Each segment must start with a letter
    if (segments.some(s => !/^[a-zA-Z]/.test(s))) {
      return { isValid: false, error: 'Each segment of the package name must start with a letter' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate signature hash format
   */
  private static validateSignatureHash(signatureHash: string): { isValid: boolean; error?: string } {
    if (!signatureHash || signatureHash.trim().length === 0) {
      return { isValid: false, error: 'Signature hash is required' };
    }
    
    if (signatureHash.length !== 11) {
      return { isValid: false, error: 'Signature hash must be exactly 11 characters' };
    }
    
    // Must be base64 characters (A-Z, a-z, 0-9, +, /, =)
    if (!/^[a-zA-Z0-9+/=]+$/.test(signatureHash)) {
      return { isValid: false, error: 'Signature hash contains invalid characters. Use A-Z, a-z, 0-9, +, /, or =' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate URL format using regex
   */
  private static validateUrlFormat(url: string): { isValid: boolean; error?: string } {
    if (!url || url.trim().length === 0) {
      return { isValid: false, error: 'URL is required' };
    }

    // Comprehensive URL regex pattern
    // Supports: http://, https://, www., and various TLDs
    // Allows ports, paths, query strings, and fragments
    const urlPattern = /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[-\w&=%.])*)?(?:#(?:[-\w.])*)?$/i;
    
    // Also check for valid domain structure
    const domainPattern = /^https?:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::[0-9]+)?(?:\/.*)?$/i;
    
    if (!urlPattern.test(url)) {
      return { isValid: false, error: 'Invalid URL format. URL must start with http:// or https://' };
    }

    if (!domainPattern.test(url)) {
      return { isValid: false, error: 'Invalid URL format. Please provide a valid domain name' };
    }

    return { isValid: true };
  }

  /**
   * Validate OTP button configuration
   */
  private static validateOtpButton(otpButton: any, errors: ValidationError[], warnings: ValidationError[]): void {
    if (!otpButton.otp_type) {
      errors.push(this.createError(
        'otp_button',
        'OTP button must specify otp_type (one_tap, zero_tap, or copy_code)',
        'OTP_MISSING_TYPE',
        'error',
        false // Technical error
      ));
    } else {
      const validOtpTypes = ['one_tap', 'zero_tap', 'copy_code'];
      if (!validOtpTypes.includes(otpButton.otp_type)) {
        errors.push(this.createError(
          'otp_button',
          `OTP button type must be one of: ${validOtpTypes.join(', ')}`,
          'INVALID_OTP_TYPE',
          'error',
          false // Technical error
        ));
      }
    }

    // Validate supported apps for one_tap and zero_tap
    // Supported apps are OPTIONAL - if none exist, that's fine
    // But if they exist, they must be valid
    if (['one_tap', 'zero_tap'].includes(otpButton.otp_type)) {
      // Only validate if supported_apps array exists and has items
      if (otpButton.supported_apps && otpButton.supported_apps.length > 0) {
        otpButton.supported_apps.forEach((app: any, index: number) => {
          // Validate package name
          if (!app.package_name || app.package_name.trim().length === 0) {
            errors.push(this.createError(
              'otp_button',
              `Supported app ${index + 1}: Package name is required`,
              'OTP_MISSING_PACKAGE_NAME',
              'error',
              true // User-facing
            ));
          } else {
            const packageValidation = this.validatePackageName(app.package_name);
            if (!packageValidation.isValid) {
              errors.push(this.createError(
                'otp_button',
                `Supported app ${index + 1}: ${packageValidation.error}`,
                'OTP_INVALID_PACKAGE_NAME',
                'error',
                true // User-facing
              ));
            }
          }
          
          // Validate signature hash
          if (!app.signature_hash || app.signature_hash.trim().length === 0) {
            errors.push(this.createError(
              'otp_button',
              `Supported app ${index + 1}: Signature hash is required`,
              'OTP_MISSING_SIGNATURE_HASH',
              'error',
              true // User-facing
            ));
          } else {
            const hashValidation = this.validateSignatureHash(app.signature_hash);
            if (!hashValidation.isValid) {
              errors.push(this.createError(
                'otp_button',
                `Supported app ${index + 1}: ${hashValidation.error}`,
                'OTP_INVALID_SIGNATURE_HASH',
                'error',
                true // User-facing
              ));
            }
          }
        });
      }
      // If no supported apps, that's fine - no error
    }

    // Validate zero_tap specific requirements
    if (otpButton.otp_type === 'zero_tap') {
      if (otpButton.zero_tap_terms_accepted !== true) {
        errors.push(this.createError(
          'otp_button',
          'Zero-tap OTP buttons require accepting the terms and conditions',
          'ZERO_TAP_TERMS_NOT_ACCEPTED',
          'error',
          true // User-facing - changed to true
        ));
      }
    }
  }

  /**
   * Validate MARKETING template specific requirements
   */
  private static validateMarketingTemplate(
    payload: CreateTemplatePayload,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // MARKETING templates must have a body component
    const bodyComponents = payload.components?.filter(c => c.type === 'BODY') || [];
    if (bodyComponents.length === 0) {
      errors.push(this.createError(
        'components',
        'MARKETING templates must have a body component',
        'MARKETING_MISSING_BODY',
        'error',
        true // User-facing
      ));
    }

    // MARKETING templates can have up to 10 buttons (confirmed from Meta's official UI)
    const buttonComponents = payload.components?.filter(c => c.type === 'BUTTONS') || [];
    if (buttonComponents.length > 0) {
      const totalButtons = buttonComponents.reduce((sum, comp) => sum + (comp as any).buttons?.length || 0, 0);
      if (totalButtons > 10) {
        errors.push(this.createError(
          'components',
          'MARKETING templates can have a maximum of 10 buttons',
          'MARKETING_TOO_MANY_BUTTONS',
          'error',
          true // User-facing
        ));
      }
    }
  }

  /**
   * Validate UTILITY template specific requirements
   */
  private static validateUtilityTemplate(
    payload: CreateTemplatePayload,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // UTILITY templates must have a body component
    const bodyComponents = payload.components?.filter(c => c.type === 'BODY') || [];
    if (bodyComponents.length === 0) {
      errors.push(this.createError(
        'components',
        'UTILITY templates must have a body component',
        'UTILITY_MISSING_BODY',
        'error',
        true // User-facing
      ));
    }

    // UTILITY templates can have up to 3 buttons
    const buttonComponents = payload.components?.filter(c => c.type === 'BUTTONS') || [];
    if (buttonComponents.length > 0) {
      const totalButtons = buttonComponents.reduce((sum, comp) => sum + (comp as any).buttons?.length || 0, 0);
      if (totalButtons > 3) {
        errors.push(this.createError(
          'components',
          'UTILITY templates can have a maximum of 3 buttons',
          'UTILITY_TOO_MANY_BUTTONS',
          'error',
          true // User-facing
        ));
      }
    }
  }

  /**
   * Validate template components
   */
  private static validateComponents(
    payload: CreateTemplatePayload,
    category: "MARKETING" | "UTILITY" | "AUTHENTICATION",
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!payload.components || payload.components.length === 0) {
      errors.push(this.createError(
        'components',
        'Template must have at least one component',
        'MISSING_COMPONENTS',
        'error',
        false // Technical error - shouldn't happen in UI
      ));
      return;
    }

    payload.components.forEach((component, index) => {
      this.validateComponent(component as any, index, category, errors, warnings);
    });
  }

  /**
   * Validate individual component
   */
  private static validateComponent(
    component: TemplateComponent | AuthTemplateComponent,
    index: number,
    category: "MARKETING" | "UTILITY" | "AUTHENTICATION",
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const componentField = `components[${index}]`;

    // Validate component type
    // Use uppercase to match actual component types (HEADER, BODY, FOOTER, BUTTONS, etc.)
    const validTypes = ['HEADER', 'BODY', 'FOOTER', 'BUTTONS', 'CAROUSEL', 'LIMITED_TIME_OFFER'];
    if (!validTypes.includes(component.type)) {
      errors.push(this.createError(
        componentField,
        `Invalid component type: ${component.type}`,
        'INVALID_COMPONENT_TYPE',
        'error',
        false // Technical error - shouldn't happen in UI
      ));
    }

    // Validate component-specific fields
    switch (component.type) {
      case 'HEADER':
        this.validateHeaderComponent(component as any, componentField, errors, warnings);
        break;
      case 'BODY':
        this.validateBodyComponent(component as any, componentField, errors, warnings);
        break;
      case 'FOOTER':
        this.validateFooterComponent(component as any, componentField, category, errors, warnings);
        break;
      case 'BUTTONS':
        this.validateButtonsComponent(component as any, componentField, errors, warnings);
        break;
    }
  }

  /**
   * Validate header component
   */
  private static validateHeaderComponent(
    component: any,
    field: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!component.format) {
      errors.push(this.createError(
        field,
        'Header component must specify format',
        'HEADER_MISSING_FORMAT',
        'error',
        false // Technical error - shouldn't happen in UI
      ));
    } else {
      const validFormats = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION', 'PRODUCT'];
      if (!validFormats.includes(component.format)) {
        errors.push(this.createError(
          field,
          `Invalid header format: ${component.format}`,
          'INVALID_HEADER_FORMAT',
          'error',
          false // Technical error - shouldn't happen in UI
        ));
      }
    }

    if (component.format === 'TEXT') {
      if (!component.text || component.text.trim().length === 0) {
        errors.push(this.createError(
          field,
          'Text header must have text content',
          'HEADER_MISSING_TEXT',
          'error',
          true // User-facing
        ));
      } else if (component.text.length > this.CHARACTER_LIMITS.header_text.max) {
        errors.push(this.createError(
          field,
          `Header text must not exceed ${this.CHARACTER_LIMITS.header_text.max} characters`,
          'HEADER_TEXT_TOO_LONG',
          'error',
          true // User-facing
        ));
      } else {
        // Check for variables in header text ({{1}} only for headers)
        const hasVariable = /\{\{(\d+)\}\}/.test(component.text);
        if (hasVariable) {
          // Header can only have one variable {{1}}
          if (!component.example || !component.example.header_text || !component.example.header_text[0] || !component.example.header_text[0].trim()) {
            errors.push(this.createError(
              field,
              'Header text contains a variable ({{1}}) but example value is required. Please provide an example value.',
              'HEADER_MISSING_VARIABLE_EXAMPLE',
              'error',
              true // User-facing - changed to error and made it required
            ));
          }
        }
      }
    }

    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(component.format)) {
      if (!component.example || !component.example.header_handle || !component.example.header_handle[0] || !component.example.header_handle[0].trim()) {
        errors.push(this.createError(
          field,
          `${component.format} header must have a media file`,
          'HEADER_MISSING_MEDIA_EXAMPLE',
          'error',
          true // User-facing - changed to true so errors show in UI
        ));
      } 
    }
  }

  /**
   * Validate body component
   */
  private static validateBodyComponent(
    component: any,
    field: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // For authentication templates, body components don't have text field
    // They only have add_security_recommendation field
    const isAuthBodyComponent = component.type === 'BODY' && 
                                'add_security_recommendation' in component && 
                                !('text' in component);
    
    if (isAuthBodyComponent) {
      // Authentication body components don't need text validation
      // They only need to exist (which is already validated in validateAuthenticationTemplate)
      return;
    }
    
    // For regular templates (MARKETING, UTILITY), body components must have text
    if (!component.text || component.text.trim().length === 0) {
      errors.push(this.createError(
        field,
        'Body component must have text content',
        'BODY_MISSING_TEXT',
        'error',
        true // User-facing
      ));
    } else if (component.text.length > this.CHARACTER_LIMITS.body_text.max) {
      errors.push(this.createError(
        field,
        `Body text must not exceed ${this.CHARACTER_LIMITS.body_text.max} characters`,
        'BODY_TEXT_TOO_LONG',
        'error',
        true // User-facing
      ));
    }

    // Check for variables in body text (both positional {{1}}, {{2}} and named {{variable_name}})
    if (component.text) {
      // Check for positional variables ({{1}}, {{2}}, etc.)
      const positionalMatches = component.text.match(/\{\{(\d+)\}\}/g);
      // Check for named variables ({{variable_name}}, etc.)
      const namedMatches = component.text.match(/\{\{([A-Za-z_][\w]*)\}\}/g);
      
      const hasVariables = (positionalMatches && positionalMatches.length > 0) || 
                           (namedMatches && namedMatches.length > 0);
      
      if (hasVariables) {
        // For positional parameters, check body_text array
        if (positionalMatches && positionalMatches.length > 0) {
          if (!component.example || !component.example.body_text || !component.example.body_text[0]) {
            errors.push(this.createError(
              field,
              'Body text contains variables ({{1}}, {{2}}, etc.) but example values are required. Please provide example values for all variables.',
              'BODY_MISSING_VARIABLE_EXAMPLES',
              'error',
              true // User-facing - changed to error and made it required
            ));
          } else {
            // Check that all variables have examples
            const examples = component.example.body_text[0] || [];
            const requiredCount = positionalMatches.length;
            const providedCount = examples.filter((ex: string) => ex && ex.trim().length > 0).length;
            
            if (providedCount < requiredCount) {
              errors.push(this.createError(
                field,
                `Body text contains ${requiredCount} variable(s) but only ${providedCount} example value(s) provided. Please provide example values for all variables.`,
                'BODY_INCOMPLETE_VARIABLE_EXAMPLES',
                'error',
                true // User-facing
              ));
            }
          }
        }
        
        // For named parameters, check body_text_named_params array
        if (namedMatches && namedMatches.length > 0) {
          if (!component.example || !component.example.body_text_named_params) {
            errors.push(this.createError(
              field,
              'Body text contains named variables ({{variable_name}}, etc.) but example values are required. Please provide example values for all variables.',
              'BODY_MISSING_NAMED_VARIABLE_EXAMPLES',
              'error',
              true // User-facing - changed to error and made it required
            ));
          } else {
            // Extract all unique variable names
            const variableNames = Array.from(new Set(
              namedMatches.map((match: string) => match.replace(/[{}]/g, ''))
            )) as string[];
            
            // Check that all variables have examples
            const providedNames = (component.example.body_text_named_params as any[]).map((param: any) => param.param_name);
            const missingNames = variableNames.filter((name: string) => !providedNames.includes(name));
            
            if (missingNames.length > 0) {
              errors.push(this.createError(
                field,
                `Body text contains variables (${missingNames.map((n: string) => `{{${n}}}`).join(', ')}) but example values are missing. Please provide example values for all variables.`,
                'BODY_INCOMPLETE_NAMED_VARIABLE_EXAMPLES',
                'error',
                true // User-facing
              ));
            } else {
              // Check that provided examples are not empty
              const emptyExamples = (component.example.body_text_named_params as any[]).filter(
                (param: any) => !param.example || !param.example.trim()
              );
              
              if (emptyExamples.length > 0) {
                errors.push(this.createError(
                  field,
                  `Example values are required for all variables. Please fill in example values for: ${emptyExamples.map((p: any) => `{{${p.param_name}}}`).join(', ')}`,
                  'BODY_EMPTY_NAMED_VARIABLE_EXAMPLES',
                  'error',
                  true // User-facing
                ));
              }
            }
          }
        }
      }
    }
  }

  /**
   * Validate footer component
   */
  private static validateFooterComponent(
    component: any,
    field: string,
    category: "MARKETING" | "UTILITY" | "AUTHENTICATION",
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // For AUTHENTICATION templates, footer uses code_expiration_minutes instead of text
    // Check category first, then check if component has code_expiration_minutes property
    const isAuthFooter = category === 'AUTHENTICATION' || 
                        ('code_expiration_minutes' in component && !component.hasOwnProperty('text'));
    
    if (isAuthFooter) {
      // Authentication footer validation - code_expiration_minutes is optional
      // No validation needed as it's optional per Meta API
      // Even if it has a default value or is set, we don't require it
      return;
    }
    
    // Regular footer validation for MARKETING/UTILITY templates
    if (!component.text || component.text.trim().length === 0) {
      errors.push(this.createError(
        field,
        'Footer component must have text content',
        'FOOTER_MISSING_TEXT',
        'error',
        true // User-facing
      ));
    } else if (component.text.length > this.CHARACTER_LIMITS.footer_text.max) {
      errors.push(this.createError(
        field,
        `Footer text must not exceed ${this.CHARACTER_LIMITS.footer_text.max} characters`,
        'FOOTER_TEXT_TOO_LONG',
        'error',
        true // User-facing
      ));
    }
  }

  /**
   * Validate buttons component
   */
  private static validateButtonsComponent(
    component: any,
    field: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!component.buttons || component.buttons.length === 0) {
      errors.push(this.createError(
        field,
        'Buttons component must have at least one button',
        'BUTTONS_MISSING_BUTTONS',
        'error',
        false // Technical error - shouldn't happen in UI
      ));
      return;
    }

    // Removed generic 3-button limit - category-specific validations handle button limits:
    // MARKETING: 10 buttons, UTILITY: 3 buttons, AUTHENTICATION: 1 button

    component.buttons.forEach((button: any, index: number) => {
      this.validateButton(button, `${field}.buttons[${index}]`, errors, warnings);
    });
  }

  /**
   * Validate individual button
   */
  private static validateButton(
    button: any,
    field: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!button.type) {
      errors.push(this.createError(
        field,
        'Button must specify type',
        'BUTTON_MISSING_TYPE',
        'error',
        false // Technical error - shouldn't happen in UI
      ));
      return;
    }

    // Button types are uppercase (URL, PHONE_NUMBER, QUICK_REPLY, OTP, etc.)
    const validTypes = ['URL', 'PHONE_NUMBER', 'QUICK_REPLY', 'COPY_CODE', 'OTP', 'SPM', 'MPM',
                       'url', 'phone_number', 'quick_reply', 'copy_code', 'otp', 'spm', 'mpm']; // Support both cases for backward compatibility
    const buttonTypeUpper = button.type.toUpperCase();
    if (!validTypes.includes(button.type) && !validTypes.includes(buttonTypeUpper)) {
      errors.push(this.createError(
        field,
        `Invalid button type: ${button.type}`,
        'INVALID_BUTTON_TYPE',
        'error',
        false // Technical error - shouldn't happen in UI
      ));
    }

    // Normalize button type to uppercase for consistent checking
    const normalizedType = buttonTypeUpper;

    // OTP buttons are validated separately in validateOtpButton
    // Skip regular button validation for OTP buttons
    if (normalizedType === 'OTP') {
      return; // OTP buttons are validated in validateAuthenticationTemplate
    }

    // Validate button text (skip for copy_code buttons as they have predefined text)
    const isCopyCodeButton = normalizedType === 'COPY_CODE';
    
    if (!isCopyCodeButton) {
      if (!button.text || button.text.trim().length === 0) {
        errors.push(this.createError(
          field,
          'Button must have text',
          'BUTTON_MISSING_TEXT',
          'error',
          true // User-facing
        ));
      } else if (button.text.length > this.CHARACTER_LIMITS.button_text.max) {
        errors.push(this.createError(
          field,
          `Button text must not exceed ${this.CHARACTER_LIMITS.button_text.max} characters`,
          'BUTTON_TEXT_TOO_LONG',
          'error',
          true // User-facing
        ));
      }
    }

    // Validate button-specific fields
    switch (normalizedType) {
      case 'URL':
        if (!button.url || button.url.trim().length === 0) {
          errors.push(this.createError(
            field,
            'URL button must have url',
            'URL_BUTTON_MISSING_URL',
            'error',
            true // User-facing
          ));
        } else {
          // Check URL length
          if (button.url.length > this.CHARACTER_LIMITS.url.max) {
            errors.push(this.createError(
              field,
              `URL must not exceed ${this.CHARACTER_LIMITS.url.max} characters`,
              'URL_TOO_LONG',
              'error',
              true // User-facing
            ));
          } else {
            // Check if URL is dynamic (contains {{1}} or similar)
            const isDynamic = /\{\{(\d+)\}\}/.test(button.url);
            
            if (isDynamic) {
              // Extract base URL part (everything before {{1}})
              const paramMatch = button.url.match(/(.+?)\{\{(\d+)\}\}/);
              let baseUrl = '';
              
              if (paramMatch && paramMatch[1]) {
                baseUrl = paramMatch[1];
              } else {
                // If {{1}} is at the start or no base URL found
                baseUrl = button.url.replace(/\{\{(\d+)\}\}.*$/, '');
              }
              
              // Remove trailing slash if exists (before {{1}})
              baseUrl = baseUrl.replace(/\/+$/, '');
              
              if (baseUrl.trim().length === 0) {
                errors.push(this.createError(
                  field,
                  'Dynamic URL must have a valid base URL before {{1}}. Example: https://example.com/{{1}}',
                  'URL_INVALID_DYNAMIC_FORMAT',
                  'error',
                  true // User-facing
                ));
              } else {
                // Validate base URL format (ensure it's a valid URL structure)
                // Check if it starts with http:// or https://
                if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
                  errors.push(this.createError(
                    field,
                    'Dynamic URL base must start with http:// or https://. Example: https://example.com/{{1}}',
                    'URL_INVALID_DYNAMIC_BASE',
                    'error',
                    true // User-facing
                  ));
                } else {
                  // Validate the base URL format
                  const urlValidation = this.validateUrlFormat(baseUrl);
                  if (!urlValidation.isValid) {
                    errors.push(this.createError(
                      field,
                      `Invalid dynamic URL base: ${urlValidation.error}. Make sure the URL before {{1}} is valid.`,
                      'URL_INVALID_DYNAMIC_BASE',
                      'error',
                      true // User-facing
                    ));
                  }
                }
              }
              
              // For dynamic URLs, example value is REQUIRED
              if (!button.example || !button.example.length || !button.example[0] || !button.example[0].trim()) {
                errors.push(this.createError(
                  field,
                  'Example value is required for dynamic URLs. Please provide an example value for the {{1}} parameter.',
                  'URL_MISSING_EXAMPLE_VALUE',
                  'error',
                  true // User-facing
                ));
              } else {
                // Validate example value if provided
                const exampleValue = button.example[0].trim();
                
                if (exampleValue.length === 0) {
                  // Empty example after trim - treat as missing
                  errors.push(this.createError(
                    field,
                    'Example value is required for dynamic URLs. Please provide an example value for the {{1}} parameter.',
                    'URL_MISSING_EXAMPLE_VALUE',
                    'error',
                    true // User-facing
                  ));
                } else {
                  // Example value should not contain URL protocol - it should be just the parameter value
                  if (exampleValue.startsWith('http://') || exampleValue.startsWith('https://')) {
                    errors.push(this.createError(
                      field,
                      'Example value should not include http:// or https://. Enter only the dynamic part (e.g., "product-123" for https://example.com/{{1}}).',
                      'URL_INVALID_EXAMPLE_FORMAT',
                      'error',
                      true // User-facing
                    ));
                  } else if (baseUrl && baseUrl.startsWith('http')) {
                    // Construct full URL with example and validate
                    const separator = baseUrl.endsWith('/') ? '' : '/';
                    const fullExampleUrl = baseUrl + separator + exampleValue;
                    const fullUrlValidation = this.validateUrlFormat(fullExampleUrl);
                    if (!fullUrlValidation.isValid) {
                      errors.push(this.createError(
                        field,
                        `The full URL with your example value is invalid: ${fullUrlValidation.error}. Check that the example value creates a valid URL when combined with the base URL.`,
                        'URL_INVALID_EXAMPLE_FULL',
                        'error',
                        true // User-facing
                      ));
                    }
                  }
                }
              }
            } else {
              // For static URLs, validate the format directly
              const urlValidation = this.validateUrlFormat(button.url);
              if (!urlValidation.isValid) {
                errors.push(this.createError(
                  field,
                  `Invalid URL format: ${urlValidation.error}`,
                  'URL_INVALID_FORMAT',
                  'error',
                  true // User-facing
                ));
              }
            }
          }
        }
        break;
      case 'PHONE_NUMBER':
        if (!button.phone_number || button.phone_number.trim().length === 0) {
          errors.push(this.createError(
            field,
            'Phone number button must have phone_number',
            'PHONE_BUTTON_MISSING_NUMBER',
            'error',
            true // User-facing
          ));
        } else if (button.phone_number.length > this.CHARACTER_LIMITS.phone_number.max) {
          errors.push(this.createError(
            field,
            `Phone number must not exceed ${this.CHARACTER_LIMITS.phone_number.max} characters`,
            'PHONE_NUMBER_TOO_LONG',
            'error',
            true // User-facing
          ));
        }
        break;
    }
  }

  /**
   * Validate buttons across all components
   */
  private static validateButtons(
    payload: CreateTemplatePayload,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const buttonComponents = payload.components?.filter(c => c.type === 'BUTTONS') || [];
    
    // Check for duplicate button types in the same component
    buttonComponents.forEach((component, compIndex) => {
      const buttons = (component as any).buttons || [];
      const buttonTypes = buttons.map((b: any) => b.type);
      const uniqueTypes = new Set(buttonTypes);
      
      if (buttonTypes.length !== uniqueTypes.size) {
        errors.push(this.createError(
          `components[${compIndex}]`,
          'Each button in a component must have a unique type',
          'DUPLICATE_BUTTON_TYPES',
          'error',
          false // Technical error - shouldn't happen in UI
        ));
      }
    });
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: ValidationError): string {
    const messages: Record<string, string> = {
      'MISSING_NAME': 'Template name is required',
      'NAME_TOO_SHORT': 'Template name is too short',
      'NAME_TOO_LONG': 'Template name is too long',
      'INVALID_NAME_CHARS': 'Template name can only contain letters, numbers, and underscores',
      'MISSING_LANGUAGE': 'Language is required',
      'UNSUPPORTED_LANGUAGE': 'Selected language is not supported by Meta',
      'INVALID_CATEGORY': 'Invalid template category',
      'AUTH_MISSING_BUTTON': 'AUTHENTICATION templates must have exactly one OTP button',
      'AUTH_MULTIPLE_BUTTONS': 'AUTHENTICATION templates must have exactly one button',
      'AUTH_NO_OTP_BUTTON': 'AUTHENTICATION templates must have an OTP button',
      'AUTH_MULTIPLE_OTP_BUTTONS': 'AUTHENTICATION templates must have exactly one OTP button',
      'MARKETING_MISSING_BODY': 'MARKETING templates must have a body component',
      'MARKETING_TOO_MANY_BUTTONS': 'MARKETING templates can have a maximum of 10 buttons',
      'UTILITY_MISSING_BODY': 'UTILITY templates must have a body component',
      'UTILITY_TOO_MANY_BUTTONS': 'UTILITY templates can have a maximum of 3 buttons',
      'MISSING_COMPONENTS': 'Template must have at least one component',
      'INVALID_COMPONENT_TYPE': 'Invalid component type',
      'HEADER_MISSING_FORMAT': 'Header component must specify format',
      'INVALID_HEADER_FORMAT': 'Invalid header format',
      'HEADER_MISSING_TEXT': 'Text header must have text content',
      'HEADER_TEXT_TOO_LONG': 'Header text is too long',
      'HEADER_MISSING_MEDIA_EXAMPLE': 'Media header must have example with header_handle',
      'BODY_MISSING_TEXT': 'Body component must have text content',
      'BODY_TEXT_TOO_LONG': 'Body text is too long',
      'FOOTER_MISSING_TEXT': 'Footer component must have text content',
      'FOOTER_TEXT_TOO_LONG': 'Footer text is too long',
      'BUTTONS_MISSING_BUTTONS': 'Buttons component must have at least one button',
      'BUTTONS_TOO_MANY': 'Buttons component exceeds maximum for this template category',
      'BUTTON_MISSING_TYPE': 'Button must specify type',
      'INVALID_BUTTON_TYPE': 'Invalid button type',
      'BUTTON_MISSING_TEXT': 'Button must have text',
      'BUTTON_TEXT_TOO_LONG': 'Button text is too long',
      'URL_BUTTON_MISSING_URL': 'URL button must have url',
      'URL_TOO_LONG': 'URL is too long',
      'URL_INVALID_FORMAT': 'Invalid URL format. URL must start with http:// or https:// and have a valid domain',
      'URL_INVALID_DYNAMIC_FORMAT': 'Dynamic URL must have a valid base URL before {{1}}. Example: https://example.com/{{1}}',
      'URL_INVALID_DYNAMIC_BASE': 'Dynamic URL base must start with http:// or https://. Example: https://example.com/{{1}}',
      'URL_INVALID_EXAMPLE_FORMAT': 'Example value should not include http:// or https://. Enter only the dynamic part (e.g., "product-123" for https://example.com/{{1}}).',
      'URL_MISSING_EXAMPLE_VALUE': 'Example value is required for dynamic URLs. Please provide an example value for the {{1}} parameter.',
      'URL_INVALID_EXAMPLE_FULL': 'The full URL with your example value is invalid. Check that the example value creates a valid URL when combined with the base URL.',
      'HEADER_INVALID_MEDIA_URL': 'Invalid media URL format',
      'PHONE_BUTTON_MISSING_NUMBER': 'Phone number button must have phone_number',
      'PHONE_NUMBER_TOO_LONG': 'Phone number is too long',
      'DUPLICATE_BUTTON_TYPES': 'Each button in a component must have a unique type',
      'OTP_MISSING_TYPE': 'OTP button must specify otp_type',
      'INVALID_OTP_TYPE': 'Invalid OTP button type',
      'OTP_MISSING_SUPPORTED_APPS': 'OTP button must specify supported_apps',
      'OTP_INVALID_SUPPORTED_APP': 'Supported app must have package_name and signature_hash',
      'OTP_MISSING_PACKAGE_NAME': 'Supported app: Package name is required',
      'OTP_INVALID_PACKAGE_NAME': 'Supported app: Invalid package name format',
      'OTP_MISSING_SIGNATURE_HASH': 'Supported app: Signature hash is required',
      'OTP_INVALID_SIGNATURE_HASH': 'Supported app: Signature hash must be exactly 11 characters',
      'ZERO_TAP_TERMS_NOT_ACCEPTED': 'Zero-tap OTP buttons require accepting the terms and conditions'
    };

    return messages[error.code] || error.message;
  }

  /**
   * Format validation result for display (user-facing only)
   */
  static formatValidationResult(result: ValidationResult): string {
    if (result.isValid) {
      return 'Template validation passed!';
    }

    const errorMessages = result.userErrors.map(error => 
      `❌ ${this.getErrorMessage(error)}`
    );
    
    const warningMessages = result.userWarnings.map(warning => 
      `⚠️ ${this.getErrorMessage(warning)}`
    );

    return [
      'Please fix the following issues:',
      ...errorMessages,
      ...warningMessages
    ].join('\n');
  }
}

export default MetaTemplateValidator;
