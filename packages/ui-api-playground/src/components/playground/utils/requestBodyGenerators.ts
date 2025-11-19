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

export interface WABAOption {
  value: string;
  label: string;
  businessName: string;
  phone: string;
  status: string;
  templates: number;
  wabaId: string;
  phoneId: string;
  projectId: string;
  projectName: string;
  setupMode: string;
}

export const generateTemplateRequestJSON = (
  selectedTemplate: MessageTemplate | undefined,
  templatePlaceholders: Record<string, string>
): any[] | null => {
  if (!selectedTemplate) return null;

  const templateComponents: any[] = [];

  selectedTemplate.components.forEach((component, index) => {
    switch (component.type) {
      case 'HEADER':
        if (component.format === 'TEXT' && component.text) {
          // Collect positional and named placeholders in order of appearance
          const tokens = component.text.match(/\{\{([^}]+)\}\}/g);
          if (tokens && tokens.length > 0) {
            const parameters = tokens.map((match) => {
              const inner = match.replace(/[{}]/g, '');
              const isNumber = /^\d+$/.test(inner);
              const key = `header_param_${inner}`;
              const value = templatePlaceholders[key] || match;
              return {
                type: "text",
                text: value,
                ...(isNumber ? {} : { parameter_name: inner })
              };
            });

            templateComponents.push({
              type: "header",
              parameters: parameters
            });
          }
        } else if (component.format && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(component.format)) {
          // Media header with dynamic content
          const mediaType = component.format.toLowerCase();
          const mediaUrl = templatePlaceholders['header_media_url'] || 
                          component.example?.header_handle?.[0] || 
                           `https://example.com/${mediaType === 'document' ? 'doc.pdf' : mediaType === 'video' ? 'vid.mp4' : 'img.png'}`;
          
          templateComponents.push({
            type: "header",
            parameters: [{
              type: mediaType,
              [mediaType]: {
                link: mediaUrl
              }
            }]
          });
        }
        break;

      case 'BODY':
        if (component.text) {
          // Extract all placeholders (positional and named) from body text in order
          const tokens = component.text.match(/\{\{([^}]+)\}\}/g);
          if (tokens && tokens.length > 0) {
            const parameters = tokens.map((match) => {
              const inner = match.replace(/[{}]/g, '');
              const isNumber = /^\d+$/.test(inner);
              const key = `body_param_${inner}`;
              const value = templatePlaceholders[key] || match;
              return {
                type: "text",
                text: value,
                ...(isNumber ? {} : { parameter_name: inner })
              };
            });

            templateComponents.push({
              type: "body",
              parameters: parameters
            });
          }
        }
        break;

      case 'BUTTONS':
        if (component.buttons && component.buttons.length > 0) {
          component.buttons.forEach((button, buttonIndex) => {
            if (button.type === 'URL' && button.url) {
              // Support positional and named parameters in URL
              const urlToken = button.url.match(/\{\{([^}]+)\}\}/);
              if (urlToken && urlToken[1]) {
                const inner = urlToken[1];
                const isNumber = /^\d+$/.test(inner);
                const key = `button_${buttonIndex}_param_${inner}`;
                const value = templatePlaceholders[key] || "123456";
                templateComponents.push({
                  type: "button",
                  sub_type: "url",
                  index: buttonIndex,
                  parameters: [{
                    type: "text",
                    text: value,
                    ...(isNumber ? {} : { parameter_name: inner })
                  }]
                });
              }
            } else if (button.type === 'PHONE_NUMBER') {
              // PHONE_NUMBER buttons don't need to be included in the request body components
              // They are handled automatically by WhatsApp
            } else if (button.type === 'COPY_CODE') {
              // Copy code button supports positional and named parameter in text
              const codeToken = button.text?.match(/\{\{([^}]+)\}\}/);
              if (codeToken && codeToken[1]) {
                const inner = codeToken[1];
                const isNumber = /^\d+$/.test(inner);
                const key = `button_${buttonIndex}_param_${inner}`;
                const value = templatePlaceholders[key] || "123456";
                templateComponents.push({
                  type: "button",
                  sub_type: "copy_code",
                  index: buttonIndex,
                  parameters: [{
                    type: "text",
                    text: value,
                    ...(isNumber ? {} : { parameter_name: inner })
                  }]
                });
              }
            } else if (button.type === 'FLOW') {
              // Flow button with flow navigation
              const flowButton = button as any; // Type assertion for flow button properties
              const flowAction: {flow_token?: string, flow_action_data?: {flow_id?: string, flow_action?: string, navigate_screen?: string}} = {};
              
              // Add flow_token (optional, default "unused")
              const flowTokenKey = `button_${buttonIndex}_flow_token`;
              const flowToken = templatePlaceholders[flowTokenKey];
              if (flowToken) {
                flowAction.flow_token = flowToken;
              } else {
                flowAction.flow_token = "unused";
              }
              
              // Add flow_action_data (optional) - check for custom data from placeholders first
              const flowActionDataKey = `button_${buttonIndex}_flow_action_data`;
              const customFlowActionData = templatePlaceholders[flowActionDataKey];
              
              if (customFlowActionData) {
                try {
                  // Try to parse as JSON if it's a string
                  flowAction.flow_action_data = typeof customFlowActionData === 'string' 
                    ? JSON.parse(customFlowActionData) 
                    : customFlowActionData;
                } catch (e) {
                  // If parsing fails, create empty object
                  flowAction.flow_action_data = {};
                }
              } else if (flowButton.flow_id || flowButton.flow_action || flowButton.navigate_screen) {
                // If no custom data but button has flow navigation info, include it in flow_action_data
                flowAction.flow_action_data = {};
                if (flowButton.flow_id) {
                  flowAction.flow_action_data.flow_id = flowButton.flow_id;
                }
                if (flowButton.flow_action) {
                  flowAction.flow_action_data.flow_action = flowButton.flow_action;
                }
                if (flowButton.navigate_screen) {
                  flowAction.flow_action_data.navigate_screen = flowButton.navigate_screen;
                }
              }
              // If no custom data and no flow navigation info, flow_action_data is omitted (optional)
              
              templateComponents.push({
                type: "button",
                sub_type: "flow",
                index: buttonIndex,
                parameters: [{
                  type: "action",
                  action: flowAction
                }]
              });
            }
            else if (button.type === 'QUICK_REPLY') {
              // QUICK_REPLY buttons don't need to be included in the request body components
              // They are handled automatically by WhatsApp
            }
          });
        }
        break;
    }
  });

  return templateComponents.length > 0 ? templateComponents : null;
};

export const generateTemplateRequestBody = (
  config: PlaygroundConfig,
  selectedTemplate: MessageTemplate | undefined,
  wabaOptions: WABAOption[],
  apiEndpoint: 'sendzen' | 'facebook'
): any | null => {
  const currentSelectedWaba = wabaOptions.find(w => w.value === config.selectedWaba);
  const templateComponents = generateTemplateRequestJSON(selectedTemplate, config.templatePlaceholders);

  if (!selectedTemplate) {
    return null;
  }

  const templateObject: any = {
    name: selectedTemplate.name,
    language: {
      code: selectedTemplate.language
    }
  };

  // Only add components if there are dynamic values
  if (templateComponents && templateComponents.length > 0) {
    templateObject.components = templateComponents;
  }

  // Return different JSON structure based on API endpoint
  if (apiEndpoint === 'facebook') {
    return {
      messaging_product: "whatsapp",
      to: config.recipientPhone,
      type: "template",
      template: templateObject
    };
  } else {
    return {
      from: currentSelectedWaba?.phone || '919099913506',
      to: config.recipientPhone,
      type: 'template',
      template: {
        ...templateObject,
        lang_code: templateObject.language.code,
        language: undefined // Remove language object for SendZen format
      }
    };
  }
};

export const generateRequestBody = (
  config: PlaygroundConfig,
  selectedTemplate: MessageTemplate | undefined,
  wabaOptions: WABAOption[],
  facebookTemplates: MessageTemplate[],
  apiEndpoint: 'sendzen' | 'facebook'
): any => {
  const currentSelectedWaba = wabaOptions.find(w => w.value === config.selectedWaba);
  
  // If session message mode is enabled, generate session message body
  if (config.isSessionMessage) {
    if (apiEndpoint === 'facebook') {
      return {
        messaging_product: "whatsapp",
        to: config.recipientPhone,
        type: "text",
        text: {
          body: config.sessionMessageText
        }
      };
    } else {
      return {
        from: currentSelectedWaba?.phone || '919099913506',
        to: config.recipientPhone,
        type: 'text',
        text: {
          body: config.sessionMessageText,
          preview_url: config.sessionMessagePreviewUrl
        }
      };
    }
  }
  
  // Template message format (existing logic)
  if (config.selectedTemplate) {
    const templateBody = generateTemplateRequestBody(config, selectedTemplate, wabaOptions, apiEndpoint);
    if (templateBody) {
      return templateBody;
    }
  }

  // Fallback for template without selection
  const fallbackSelectedWaba = wabaOptions.find(w => w.value === config.selectedWaba);
  
  if (apiEndpoint === 'facebook') {
    return {
      messaging_product: "whatsapp",
      to: config.recipientPhone,
      type: "template",
      template: {
        name: "sample_template",
        language: {
          code: "en_US"
        }
      }
    };
  } else {
    return {
      from: fallbackSelectedWaba?.phone || '919099913506',
      to: config.recipientPhone,
      type: 'template',
      template: {
        name: 'sample_template',
        lang_code: 'en_US'
      }
    };
  }
};

