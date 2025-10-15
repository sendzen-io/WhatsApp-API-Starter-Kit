/**
 * User-Facing Error Filtering Demo
 * Shows the difference between user-facing and technical errors
 */

import MetaTemplateValidator from './metaTemplateValidator';
import { CreateTemplatePayload } from '../types/templateTypes';

// Example: Template with both user-facing and technical issues
const problematicTemplate: CreateTemplatePayload = {
  name: 'invalid-name!', // User-facing error: invalid characters
  language: 'en_US',
  category: 'AUTHENTICATION',
  components: [
    {
      type: 'BODY',
      text: 'Your verification code is {{1}}'
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL', // User-facing error: wrong button type for AUTH
          text: 'Verify',
          url: 'https://example.com'
        }
      ]
    }
  ]
};

export function demonstrateUserFacingErrors(): void {
  console.log('🎯 User-Facing Error Filtering Demo\n');

  const result = MetaTemplateValidator.validateTemplate(problematicTemplate);

  console.log('📊 Validation Results:');
  console.log(`Total Errors: ${result.errors.length}`);
  console.log(`User-Facing Errors: ${result.userErrors.length}`);
  console.log(`Technical Errors: ${result.errors.length - result.userErrors.length}`);
  console.log('');

  console.log('👤 User-Facing Errors (shown to user):');
  result.userErrors.forEach((error, index) => {
    console.log(`${index + 1}. ${error.message}`);
  });
  console.log('');

  console.log('🔧 Technical Errors (hidden from user):');
  result.errors
    .filter(error => !error.userFacing)
    .forEach((error, index) => {
      console.log(`${index + 1}. ${error.message}`);
    });
  console.log('');

  console.log('✅ UI Behavior:');
  console.log(`- Submit button disabled: ${result.userErrors.length > 0 ? 'Yes' : 'No'}`);
  console.log(`- Error alert shown: ${result.userErrors.length > 0 ? 'Yes' : 'No'}`);
  console.log(`- Template can be submitted: ${result.isValid ? 'Yes' : 'No'}`);
}

// Example error categorization:
export const errorCategories = {
  userFacing: [
    'MISSING_NAME',
    'NAME_TOO_SHORT', 
    'NAME_TOO_LONG',
    'INVALID_NAME_CHARS',
    'MISSING_LANGUAGE',
    'UNSUPPORTED_LANGUAGE',
    'AUTH_MISSING_BUTTON',
    'AUTH_MULTIPLE_BUTTONS',
    'AUTH_NO_OTP_BUTTON',
    'MARKETING_MISSING_BODY',
    'MARKETING_TOO_MANY_BUTTONS',
    'UTILITY_MISSING_BODY',
    'UTILITY_TOO_MANY_BUTTONS',
    'HEADER_MISSING_TEXT',
    'HEADER_TEXT_TOO_LONG',
    'BODY_MISSING_TEXT',
    'BODY_TEXT_TOO_LONG',
    'FOOTER_MISSING_TEXT',
    'FOOTER_TEXT_TOO_LONG',
    'BUTTON_MISSING_TEXT',
    'BUTTON_TEXT_TOO_LONG',
    'URL_BUTTON_MISSING_URL',
    'URL_TOO_LONG',
    'PHONE_BUTTON_MISSING_NUMBER',
    'PHONE_NUMBER_TOO_LONG'
  ],
  technical: [
    'INVALID_CATEGORY', // Shouldn't happen in UI
    'MISSING_COMPONENTS', // Internal validation
    'INVALID_COMPONENT_TYPE', // Internal validation
    'DUPLICATE_BUTTON_TYPES', // Internal validation
    'OTP_MISSING_TYPE', // Internal validation
    'OTP_MISSING_SUPPORTED_APPS', // Internal validation
    'OTP_INVALID_SUPPORTED_APP', // Internal validation
    'ZERO_TAP_TERMS_NOT_ACCEPTED' // Internal validation
  ]
};

export default demonstrateUserFacingErrors;

