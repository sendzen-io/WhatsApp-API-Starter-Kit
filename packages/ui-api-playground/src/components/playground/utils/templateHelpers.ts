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

export const getCurrentMediaType = (
  selectedTemplate: MessageTemplate | undefined
): string => {
  if (!selectedTemplate) return '';
  
  const headerComponent = selectedTemplate.components.find(c => c.type === 'HEADER');
  return headerComponent?.format || '';
};

export const getProcessedMessageContent = (
  messageContent: string,
  templatePlaceholders: Record<string, string>
): string => {
  let content = messageContent;
  Object.entries(templatePlaceholders).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return content;
};

export const extractTemplatePlaceholders = (
  template: MessageTemplate
): Record<string, string> => {
  const newPlaceholders: Record<string, string> = {};
  let hasMediaHeader = false;
  
  template.components.forEach(component => {
    // Check for media header
    if (component.type === 'HEADER' && component.format && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(component.format)) {
      hasMediaHeader = true;
    }
    
    // Check for dynamic placeholders in HEADER component
    if (component.type === 'HEADER' && component.text) {
      // Positional: {{1}}
      const headerPositional = component.text.match(/\{\{(\d+)\}\}/g);
      if (headerPositional) {
        headerPositional.forEach(match => {
          const paramNumber = match.match(/\{\{(\d+)\}\}/)?.[1] || '1';
          newPlaceholders[`header_param_${paramNumber}`] = '';
        });
      }
      // Named: {{first_name}}
      const headerNamed = component.text.match(/\{\{([A-Za-z_][\w]*)\}\}/g);
      if (headerNamed) {
        headerNamed.forEach(match => {
          const name = match.match(/\{\{([A-Za-z_][\w]*)\}\}/)?.[1] || '';
          if (name) newPlaceholders[`header_param_${name}`] = '';
        });
      }
    }
    
    // Check for dynamic placeholders in BODY component
    if (component.type === 'BODY' && component.text) {
      // Positional: {{1}}
      const bodyPositional = component.text.match(/\{\{(\d+)\}\}/g);
      if (bodyPositional) {
        bodyPositional.forEach(match => {
          const paramNumber = match.match(/\{\{(\d+)\}\}/)?.[1] || '1';
          newPlaceholders[`body_param_${paramNumber}`] = '';
        });
      }
      // Named: {{first_name}}
      const bodyNamed = component.text.match(/\{\{([A-Za-z_][\w]*)\}\}/g);
      if (bodyNamed) {
        bodyNamed.forEach(match => {
          const name = match.match(/\{\{([A-Za-z_][\w]*)\}\}/)?.[1] || '';
          if (name) newPlaceholders[`body_param_${name}`] = '';
        });
      }
    }
    
    // Check for dynamic placeholders in BUTTONS component
    if (component.type === 'BUTTONS' && component.buttons) {
      component.buttons.forEach((button, buttonIndex) => {
        // Check URL buttons for dynamic parameters
        if (button.type === 'URL' && button.url) {
          const urlMatchPos = button.url.match(/\{\{(\d+)\}\}/);
          if (urlMatchPos && urlMatchPos[1]) {
            const paramNumber = urlMatchPos[1];
            newPlaceholders[`button_${buttonIndex}_param_${paramNumber}`] = '';
          }
          const urlMatchNamed = button.url.match(/\{\{([A-Za-z_][\w]*)\}\}/);
          if (urlMatchNamed && urlMatchNamed[1]) {
            const name = urlMatchNamed[1];
            newPlaceholders[`button_${buttonIndex}_param_${name}`] = '';
          }
        }
        
        // Check phone number buttons for dynamic parameters
        if (button.type === 'PHONE_NUMBER' && button.phone_number) {
          const phoneMatchPos = button.phone_number.match(/\{\{(\d+)\}\}/);
          if (phoneMatchPos && phoneMatchPos[1]) {
            const paramNumber = phoneMatchPos[1];
            newPlaceholders[`button_${buttonIndex}_param_${paramNumber}`] = '';
          }
          const phoneMatchNamed = button.phone_number.match(/\{\{([A-Za-z_][\w]*)\}\}/);
          if (phoneMatchNamed && phoneMatchNamed[1]) {
            const name = phoneMatchNamed[1];
            newPlaceholders[`button_${buttonIndex}_param_${name}`] = '';
          }
        }
        
        // Check copy code buttons for dynamic parameters
        if (button.type === 'COPY_CODE' && button.text) {
          const codeMatchPos = button.text.match(/\{\{(\d+)\}\}/);
          if (codeMatchPos && codeMatchPos[1]) {
            const paramNumber = codeMatchPos[1];
            newPlaceholders[`button_${buttonIndex}_param_${paramNumber}`] = '';
          }
          const codeMatchNamed = button.text.match(/\{\{([A-Za-z_][\w]*)\}\}/);
          if (codeMatchNamed && codeMatchNamed[1]) {
            const name = codeMatchNamed[1];
            newPlaceholders[`button_${buttonIndex}_param_${name}`] = '';
          }
        }
      });
    }
  });
  
  // Create parameters based on what we found
  if (hasMediaHeader) {
    newPlaceholders['header_media_url'] = '';
  }

  // Set default values for AUTHENTICATION templates
  if (template.category === 'AUTHENTICATION') {
    Object.keys(newPlaceholders).forEach(key => {
      // Preserve media URL for authentication templates
      if (key !== 'header_media_url') {
        newPlaceholders[key] = '1234';
      }
    });
  }

  return newPlaceholders;
};

export const getTemplateMessageContent = (template: MessageTemplate): string => {
  const bodyComponent = template.components.find(c => c.type === 'BODY');
  return bodyComponent?.text || '';
};

