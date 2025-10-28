/**
 * Meta WhatsApp Business API Template Validation Service
 * Validates template payloads before sending to Meta API to prevent errors
 */

import { CreateTemplatePayload, TemplateComponent, AuthTemplateComponent } from '../types/templateTypes';

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
  private static readonly SUPPORTED_LANGUAGES = [
    'af', 'sq', 'ar', 'az', 'bn', 'bg', 'ca', 'zh_CN', 'zh_HK', 'zh_TW', 'hr', 'cs', 'da', 'nl', 'en', 'en_GB', 'en_US',
    'et', 'fil', 'fi', 'fr', 'ka', 'de', 'el', 'gu', 'he', 'hi', 'hu', 'id', 'ga', 'it', 'ja', 'kn', 'kk', 'ko', 'lo',
    'lv', 'lt', 'mk', 'ms', 'ml', 'mr', 'nb', 'fa', 'pl', 'pt_BR', 'pt_PT', 'pa', 'ro', 'ru', 'sr', 'sk', 'sl', 'es',
    'es_AR', 'es_ES', 'es_MX', 'sw', 'sv', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'uz', 'vi', 'zu'
  ];

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
    
    // Component validation
    this.validateComponents(payload, errors, warnings);
    
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
    const buttonComponents = authPayload.components?.filter((c: any) => c.type === 'buttons') || [];
    
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
      const otpButtons = buttons.filter((b: any) => b.type === 'otp');
      
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
    const headerComponents = authPayload.components?.filter((c: any) => c.type === 'header') || [];
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
    if (['one_tap', 'zero_tap'].includes(otpButton.otp_type)) {
      if (!otpButton.supported_apps || otpButton.supported_apps.length === 0) {
        errors.push(this.createError(
          'otp_button',
          `${otpButton.otp_type} OTP buttons must specify supported_apps`,
          'OTP_MISSING_SUPPORTED_APPS',
          'error',
          false // Technical error
        ));
      } else {
        otpButton.supported_apps.forEach((app: any, index: number) => {
          if (!app.package_name || !app.signature_hash) {
            errors.push(this.createError(
              'otp_button',
              `Supported app ${index + 1} must have package_name and signature_hash`,
              'OTP_INVALID_SUPPORTED_APP',
              'error',
              false // Technical error
            ));
          }
        });
      }
    }

    // Validate zero_tap specific requirements
    if (otpButton.otp_type === 'zero_tap') {
      if (otpButton.zero_tap_terms_accepted !== true) {
        errors.push(this.createError(
          'otp_button',
          'Zero-tap OTP buttons must have zero_tap_terms_accepted set to true',
          'ZERO_TAP_TERMS_NOT_ACCEPTED',
          'error',
          false // Technical error
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
      this.validateComponent(component as any, index, errors, warnings);
    });
  }

  /**
   * Validate individual component
   */
  private static validateComponent(
    component: TemplateComponent | AuthTemplateComponent,
    index: number,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const componentField = `components[${index}]`;

    // Validate component type
    const validTypes = ['header', 'body', 'footer', 'buttons', 'carousel', 'limited_time_offer'];
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
        this.validateFooterComponent(component as any, componentField, errors, warnings);
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
      }
    }

    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(component.format)) {
      if (!component.example || !component.example.header_handle) {
        errors.push(this.createError(
          field,
          `${component.format} header must have example with header_handle`,
          'HEADER_MISSING_MEDIA_EXAMPLE',
          'error',
          false // Technical error - shouldn't happen in UI
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

    // Check for variables in body text
    if (component.text) {
      const variableMatches = component.text.match(/\{\{(\d+)\}\}/g);
      if (variableMatches && variableMatches.length > 0) {
        // Validate that examples are provided for variables
        if (!component.example || !component.example.body_text) {
          warnings.push(this.createError(
            field,
            'Body text contains variables but no examples are provided',
            'BODY_MISSING_VARIABLE_EXAMPLES',
            'warning',
            true // User-facing
          ));
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
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
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

    const validTypes = ['url', 'phone_number', 'quick_reply', 'copy_code', 'otp', 'spm', 'mpm'];
    if (!validTypes.includes(button.type)) {
      errors.push(this.createError(
        field,
        `Invalid button type: ${button.type}`,
        'INVALID_BUTTON_TYPE',
        'error',
        false // Technical error - shouldn't happen in UI
      ));
    }

    // Validate button text (skip for copy_code buttons as they have predefined text)
    const isCopyCodeButton = button.type === 'copy_code' || 
                           (button.type === 'otp' && button.otp_type === 'copy_code');
    
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
    switch (button.type) {
      case 'url':
        if (!button.url || button.url.trim().length === 0) {
          errors.push(this.createError(
            field,
            'URL button must have url',
            'URL_BUTTON_MISSING_URL',
            'error',
            true // User-facing
          ));
        } else if (button.url.length > this.CHARACTER_LIMITS.url.max) {
          errors.push(this.createError(
            field,
            `URL must not exceed ${this.CHARACTER_LIMITS.url.max} characters`,
            'URL_TOO_LONG',
            'error',
            true // User-facing
          ));
        }
        break;
      case 'phone_number':
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
      'PHONE_BUTTON_MISSING_NUMBER': 'Phone number button must have phone_number',
      'PHONE_NUMBER_TOO_LONG': 'Phone number is too long',
      'DUPLICATE_BUTTON_TYPES': 'Each button in a component must have a unique type',
      'OTP_MISSING_TYPE': 'OTP button must specify otp_type',
      'INVALID_OTP_TYPE': 'Invalid OTP button type',
      'OTP_MISSING_SUPPORTED_APPS': 'OTP button must specify supported_apps',
      'OTP_INVALID_SUPPORTED_APP': 'Supported app must have package_name and signature_hash',
      'ZERO_TAP_TERMS_NOT_ACCEPTED': 'Zero-tap OTP buttons must have zero_tap_terms_accepted set to true'
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
