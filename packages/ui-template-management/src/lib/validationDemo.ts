/**
 * Meta Template Validation Demo
 * Demonstrates the validation system with real examples
 */

import MetaTemplateValidator from './metaTemplateValidator';
import { CreateTemplatePayload } from '../types/templateTypes';

// Example 1: Valid Marketing Template
const validMarketingTemplate: CreateTemplatePayload = {
  name: 'welcome_message',
  language: 'en_US',
  category: 'MARKETING',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'Welcome to our service!'
    },
    {
      type: 'BODY',
      text: 'Hello {{1}}, thank you for joining us! We\'re excited to have you on board.'
    },
    {
      type: 'FOOTER',
      text: 'Reply STOP to unsubscribe'
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'Visit Website',
          url: 'https://example.com'
        },
        {
          type: 'QUICK_REPLY',
          text: 'Get Started'
        }
      ]
    }
  ]
};

// Example 2: Invalid Authentication Template (wrong button type)
const invalidAuthTemplate: CreateTemplatePayload = {
  name: 'verification_code',
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
          type: 'URL',  // ❌ Should be OTP for AUTHENTICATION
          text: 'Verify',
          url: 'https://example.com/verify'
        }
      ]
    }
  ]
};

// Example 3: Valid Authentication Template
const validAuthTemplate: CreateTemplatePayload = {
  name: 'otp_verification',
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
          type: 'OTP',
          otp_type: 'copy_code',
          text: 'Copy Code'
        }
      ]
    }
  ]
};

// Example 4: Template with invalid name
const invalidNameTemplate: CreateTemplatePayload = {
  name: 'invalid-name!',  // ❌ Contains invalid characters
  language: 'en_US',
  category: 'MARKETING',
  components: [
    {
      type: 'BODY',
      text: 'Test message'
    }
  ]
};

// Example 5: Template with too many buttons
const tooManyButtonsTemplate: CreateTemplatePayload = {
  name: 'too_many_buttons',
  language: 'en_US',
  category: 'MARKETING',
  components: [
    {
      type: 'BODY',
      text: 'Check out our offers!'
    },
    {
      type: 'BUTTONS',
      buttons: [
        { type: 'URL', text: 'Button 1', url: 'https://example1.com' },
        { type: 'URL', text: 'Button 2', url: 'https://example2.com' },
        { type: 'URL', text: 'Button 3', url: 'https://example3.com' },
        { type: 'URL', text: 'Button 4', url: 'https://example4.com' }  // ❌ Too many buttons
      ]
    }
  ]
};

export function runValidationDemo(): void {
  console.log('🧪 Meta Template Validation Demo\n');

  // Test 1: Valid Marketing Template
  console.log('📋 Test 1: Valid Marketing Template');
  const result1 = MetaTemplateValidator.validateTemplate(validMarketingTemplate);
  console.log(`Result: ${result1.isValid ? '✅ PASS' : '❌ FAIL'}`);
  if (!result1.isValid) {
    console.log('Errors:', result1.errors.map(e => e.message).join(', '));
  }
  console.log('');

  // Test 2: Invalid Authentication Template
  console.log('📋 Test 2: Invalid Authentication Template (Wrong Button Type)');
  const result2 = MetaTemplateValidator.validateTemplate(invalidAuthTemplate);
  console.log(`Result: ${result2.isValid ? '✅ PASS' : '❌ FAIL'}`);
  if (!result2.isValid) {
    console.log('Errors:', result2.errors.map(e => e.message).join(', '));
  }
  console.log('');

  // Test 3: Valid Authentication Template
  console.log('📋 Test 3: Valid Authentication Template');
  const result3 = MetaTemplateValidator.validateTemplate(validAuthTemplate);
  console.log(`Result: ${result3.isValid ? '✅ PASS' : '❌ FAIL'}`);
  if (!result3.isValid) {
    console.log('Errors:', result3.errors.map(e => e.message).join(', '));
  }
  console.log('');

  // Test 4: Invalid Name Template
  console.log('📋 Test 4: Template with Invalid Name');
  const result4 = MetaTemplateValidator.validateTemplate(invalidNameTemplate);
  console.log(`Result: ${result4.isValid ? '✅ PASS' : '❌ FAIL'}`);
  if (!result4.isValid) {
    console.log('Errors:', result4.errors.map(e => e.message).join(', '));
  }
  console.log('');

  // Test 5: Too Many Buttons Template
  console.log('📋 Test 5: Template with Too Many Buttons');
  const result5 = MetaTemplateValidator.validateTemplate(tooManyButtonsTemplate);
  console.log(`Result: ${result5.isValid ? '✅ PASS' : '❌ FAIL'}`);
  if (!result5.isValid) {
    console.log('Errors:', result5.errors.map(e => e.message).join(', '));
  }
  console.log('');

  console.log('✅ Demo completed!');
}

// Export examples for use in other components
export {
  validMarketingTemplate,
  invalidAuthTemplate,
  validAuthTemplate,
  invalidNameTemplate,
  tooManyButtonsTemplate
};

export default runValidationDemo;

