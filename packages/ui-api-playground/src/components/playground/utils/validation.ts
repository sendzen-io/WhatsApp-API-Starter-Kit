import { MessageTemplate } from '../../../types/services';

export interface PlaygroundConfig {
  accessToken: string;
  recipientPhone: string;
  selectedBusiness: string;
  selectedWaba: string;
  selectedTemplate: string;
  messageContent: string;
  templatePlaceholders: Record<string, string>;
  wabaId: string;
  phoneNumberId: string;
  isSessionMessage: boolean;
  sessionMessageText: string;
  sessionMessagePreviewUrl: boolean;
}

export const ALLOWED_EXTENSIONS = {
  IMAGE: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
  VIDEO: ['mp4', 'mov', 'avi', 'mkv', '3gp'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx']
};

export const getFileExtension = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();
    return extension || '';
  } catch {
    // If URL parsing fails, try to extract extension from the string directly
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || '';
  }
};

export const validateMediaUrl = (url: string, mediaType: string): { isValid: boolean; error?: string } => {
  if (!url.trim()) {
    return { isValid: true }; // Allow empty URLs
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    // If not a valid URL, check if it looks like a file path with extension
    if (!url.includes('.')) {
      return { isValid: false, error: 'Please enter a valid URL or file path with extension' };
    }
  }

  const extension = getFileExtension(url);
  if (!extension) {
    return { isValid: false, error: 'File must have a valid extension' };
  }

  const allowedExtensions = ALLOWED_EXTENSIONS[mediaType.toUpperCase() as keyof typeof ALLOWED_EXTENSIONS];
  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    const allowedList = allowedExtensions ? allowedExtensions.join(', ') : '';
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed extensions for ${mediaType.toLowerCase()}: ${allowedList}` 
    };
  }

  return { isValid: true };
};

export const validateMobileNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone.trim()) {
    return { isValid: false, error: 'Mobile number is required' };
  }
  
  // Basic phone number validation (supports international format)
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Please enter a valid mobile number (e.g., +1234567890)' };
  }
  
  return { isValid: true };
};

export const validateTemplate = (
  templateId: string,
  facebookTemplates: MessageTemplate[]
): { isValid: boolean; error?: string } => {
  if (!templateId.trim()) {
    return { isValid: false, error: 'Please select a message template' };
  }
  
  const template = facebookTemplates.find(t => t.id === templateId);
  if (!template) {
    return { isValid: false, error: 'Selected template not found' };
  }
  
  return { isValid: true };
};

export const validateTemplatePlaceholders = (placeholders: Record<string, string>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  Object.entries(placeholders).forEach(([key, value]) => {
    if (!value.trim()) {
      if (key === 'header_media_url') {
        errors[key] = 'Media URL is required for this template';
      } else if (key.startsWith('header_param_')) {
        errors[key] = `Header parameter ${key.replace('header_param_', '')} is required`;
      } else if (key.startsWith('body_param_')) {
        errors[key] = `Body parameter ${key.replace('body_param_', '')} is required`;
      } else if (key.startsWith('button_')) {
        const buttonMatch = key.match(/button_(\d+)_param_(\d+)/);
        if (buttonMatch) {
          errors[key] = `Button ${buttonMatch[1]} parameter ${buttonMatch[2]} is required`;
        }
      } else {
        errors[key] = `Parameter ${key.replace('param_', '')} is required`;
      }
    }
  });
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateApiCall = (
  config: PlaygroundConfig,
  facebookTemplates: MessageTemplate[]
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Validate mobile number
  const phoneValidation = validateMobileNumber(config.recipientPhone);
  if (!phoneValidation.isValid) {
    errors.recipientPhone = phoneValidation.error!;
  }
  
  // Validate based on message type
  if (config.isSessionMessage) {
    // Validate session message text
    if (!config.sessionMessageText.trim()) {
      errors.sessionMessageText = 'Session message text is required';
    } else if (config.sessionMessageText.length > 4096) {
      errors.sessionMessageText = 'Session message text cannot exceed 4096 characters';
    }
  } else {
    // Validate template
    const templateValidation = validateTemplate(config.selectedTemplate, facebookTemplates);
    if (!templateValidation.isValid) {
      errors.selectedTemplate = templateValidation.error!;
    }
    
    // Validate placeholders if template has them
    if (Object.keys(config.templatePlaceholders).length > 0) {
      const placeholderValidation = validateTemplatePlaceholders(config.templatePlaceholders);
      if (!placeholderValidation.isValid) {
        Object.assign(errors, placeholderValidation.errors);
      }
    }
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

