/**
 * Meta Template Validation Tests
 * Tests various template scenarios to ensure validation works correctly
 */

import MetaTemplateValidator from '../lib/metaTemplateValidator';
import { CreateTemplatePayload } from '../types/templateTypes';

// Test data
const validMarketingTemplate: CreateTemplatePayload = {
  name: 'test_marketing_template',
  language: 'en_US',
  category: 'MARKETING',
  components: [
    {
      type: 'BODY',
      text: 'Hello {{1}}, welcome to our service!'
    }
  ]
};

const validUtilityTemplate: CreateTemplatePayload = {
  name: 'test_utility_template',
  language: 'en_US',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: 'Your order #{{1}} has been processed.'
    }
  ]
};

const validAuthTemplate: CreateTemplatePayload = {
  name: 'test_auth_template',
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

const invalidAuthTemplate: CreateTemplatePayload = {
  name: 'invalid_auth_template',
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
          type: 'URL',
          text: 'Visit Website',
          url: 'https://example.com'
        }
      ]
    }
  ]
};

const templateWithInvalidName: CreateTemplatePayload = {
  name: 'invalid-name-with-special-chars!',
  language: 'en_US',
  category: 'MARKETING',
  components: [
    {
      type: 'BODY',
      text: 'Test message'
    }
  ]
};

const templateWithUnsupportedLanguage: CreateTemplatePayload = {
  name: 'test_template',
  language: 'xyz_ABC',
  category: 'MARKETING',
  components: [
    {
      type: 'BODY',
      text: 'Test message'
    }
  ]
};

const templateWithTooManyButtons: CreateTemplatePayload = {
  name: 'test_template',
  language: 'en_US',
  category: 'MARKETING',
  components: [
    {
      type: 'BODY',
      text: 'Test message'
    },
    {
      type: 'BUTTONS',
      buttons: [
        { type: 'URL', text: 'Button 1', url: 'https://example1.com' },
        { type: 'URL', text: 'Button 2', url: 'https://example2.com' },
        { type: 'URL', text: 'Button 3', url: 'https://example3.com' },
        { type: 'URL', text: 'Button 4', url: 'https://example4.com' }
      ]
    }
  ]
};

const templateWithLongBody: CreateTemplatePayload = {
  name: 'test_template',
  language: 'en_US',
  category: 'MARKETING',
  components: [
    {
      type: 'BODY',
      text: 'A'.repeat(1025) // Exceeds 1024 character limit
    }
  ]
};

const templateWithoutBody: CreateTemplatePayload = {
  name: 'test_template',
  language: 'en_US',
  category: 'MARKETING',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'Header only'
    }
  ]
};

export class ValidationTestSuite {
  static runAllTests(): void {
    console.log('🧪 Running Meta Template Validation Tests...\n');

    this.testValidTemplates();
    this.testInvalidTemplates();
    this.testEdgeCases();
    
    console.log('✅ All tests completed!');
  }

  static testValidTemplates(): void {
    console.log('📋 Testing Valid Templates:');
    
    // Test valid marketing template
    const marketingResult = MetaTemplateValidator.validateTemplate(validMarketingTemplate);
    console.log(`  ✓ Marketing Template: ${marketingResult.isValid ? 'PASS' : 'FAIL'}`);
    if (!marketingResult.isValid) {
      console.log(`    Errors: ${marketingResult.errors.map(e => e.message).join(', ')}`);
    }

    // Test valid utility template
    const utilityResult = MetaTemplateValidator.validateTemplate(validUtilityTemplate);
    console.log(`  ✓ Utility Template: ${utilityResult.isValid ? 'PASS' : 'FAIL'}`);
    if (!utilityResult.isValid) {
      console.log(`    Errors: ${utilityResult.errors.map(e => e.message).join(', ')}`);
    }

    // Test valid auth template
    const authResult = MetaTemplateValidator.validateTemplate(validAuthTemplate);
    console.log(`  ✓ Auth Template: ${authResult.isValid ? 'PASS' : 'FAIL'}`);
    if (!authResult.isValid) {
      console.log(`    Errors: ${authResult.errors.map(e => e.message).join(', ')}`);
    }

    console.log('');
  }

  static testInvalidTemplates(): void {
    console.log('❌ Testing Invalid Templates:');
    
    // Test invalid auth template (wrong button type)
    const invalidAuthResult = MetaTemplateValidator.validateTemplate(invalidAuthTemplate);
    console.log(`  ✓ Invalid Auth Template: ${!invalidAuthResult.isValid ? 'PASS' : 'FAIL'}`);
    if (invalidAuthResult.isValid) {
      console.log(`    Expected to fail but passed`);
    } else {
      console.log(`    Errors: ${invalidAuthResult.errors.map(e => e.message).join(', ')}`);
    }

    // Test template with invalid name
    const invalidNameResult = MetaTemplateValidator.validateTemplate(templateWithInvalidName);
    console.log(`  ✓ Invalid Name Template: ${!invalidNameResult.isValid ? 'PASS' : 'FAIL'}`);
    if (invalidNameResult.isValid) {
      console.log(`    Expected to fail but passed`);
    } else {
      console.log(`    Errors: ${invalidNameResult.errors.map(e => e.message).join(', ')}`);
    }

    // Test template with unsupported language
    const unsupportedLangResult = MetaTemplateValidator.validateTemplate(templateWithUnsupportedLanguage);
    console.log(`  ✓ Unsupported Language Template: ${!unsupportedLangResult.isValid ? 'PASS' : 'FAIL'}`);
    if (unsupportedLangResult.isValid) {
      console.log(`    Expected to fail but passed`);
    } else {
      console.log(`    Errors: ${unsupportedLangResult.errors.map(e => e.message).join(', ')}`);
    }

    // Test template with too many buttons
    const tooManyButtonsResult = MetaTemplateValidator.validateTemplate(templateWithTooManyButtons);
    console.log(`  ✓ Too Many Buttons Template: ${!tooManyButtonsResult.isValid ? 'PASS' : 'FAIL'}`);
    if (tooManyButtonsResult.isValid) {
      console.log(`    Expected to fail but passed`);
    } else {
      console.log(`    Errors: ${tooManyButtonsResult.errors.map(e => e.message).join(', ')}`);
    }

    // Test template with long body
    const longBodyResult = MetaTemplateValidator.validateTemplate(templateWithLongBody);
    console.log(`  ✓ Long Body Template: ${!longBodyResult.isValid ? 'PASS' : 'FAIL'}`);
    if (longBodyResult.isValid) {
      console.log(`    Expected to fail but passed`);
    } else {
      console.log(`    Errors: ${longBodyResult.errors.map(e => e.message).join(', ')}`);
    }

    // Test template without body
    const noBodyResult = MetaTemplateValidator.validateTemplate(templateWithoutBody);
    console.log(`  ✓ No Body Template: ${!noBodyResult.isValid ? 'PASS' : 'FAIL'}`);
    if (noBodyResult.isValid) {
      console.log(`    Expected to fail but passed`);
    } else {
      console.log(`    Errors: ${noBodyResult.errors.map(e => e.message).join(', ')}`);
    }

    console.log('');
  }

  static testEdgeCases(): void {
    console.log('🔍 Testing Edge Cases:');
    
    // Test empty template
    const emptyTemplate: CreateTemplatePayload = {
      name: '',
      language: '',
      category: 'MARKETING' as any,
      components: []
    };
    
    const emptyResult = MetaTemplateValidator.validateTemplate(emptyTemplate);
    console.log(`  ✓ Empty Template: ${!emptyResult.isValid ? 'PASS' : 'FAIL'}`);
    if (emptyResult.isValid) {
      console.log(`    Expected to fail but passed`);
    } else {
      console.log(`    Errors: ${emptyResult.errors.map(e => e.message).join(', ')}`);
    }

    // Test template with missing required fields
    const missingFieldsTemplate: CreateTemplatePayload = {
      name: 'test',
      language: 'en_US',
      category: 'MARKETING',
      components: [
        {
          type: 'BODY',
          text: ''
        }
      ]
    };
    
    const missingFieldsResult = MetaTemplateValidator.validateTemplate(missingFieldsTemplate);
    console.log(`  ✓ Missing Fields Template: ${!missingFieldsResult.isValid ? 'PASS' : 'FAIL'}`);
    if (missingFieldsResult.isValid) {
      console.log(`    Expected to fail but passed`);
    } else {
      console.log(`    Errors: ${missingFieldsResult.errors.map(e => e.message).join(', ')}`);
    }

    console.log('');
  }

  static testSpecificError(errorCode: string): void {
    console.log(`🔍 Testing specific error: ${errorCode}`);
    
    // Create a template that should trigger the specific error
    let testTemplate: CreateTemplatePayload;
    
    switch (errorCode) {
      case 'AUTH_MISSING_BUTTON':
        testTemplate = {
          name: 'test_auth_no_button',
          language: 'en_US',
          category: 'AUTHENTICATION',
          components: [
            { type: 'BODY', text: 'Test' }
          ]
        };
        break;
        
      case 'AUTH_MULTIPLE_BUTTONS':
        testTemplate = {
          name: 'test_auth_multiple_buttons',
          language: 'en_US',
          category: 'AUTHENTICATION',
          components: [
            { type: 'BODY', text: 'Test' },
            { type: 'BUTTONS', buttons: [
              { type: 'OTP', otp_type: 'copy_code', text: 'Button 1' },
              { type: 'OTP', otp_type: 'copy_code', text: 'Button 2' }
            ]}
          ]
        };
        break;
        
      case 'AUTH_NO_OTP_BUTTON':
        testTemplate = {
          name: 'test_auth_no_otp',
          language: 'en_US',
          category: 'AUTHENTICATION',
          components: [
            { type: 'BODY', text: 'Test' },
            { type: 'BUTTONS', buttons: [
              { type: 'URL', text: 'Visit', url: 'https://example.com' }
            ]}
          ]
        };
        break;
        
      default:
        console.log(`Unknown error code: ${errorCode}`);
        return;
    }
    
    const result = MetaTemplateValidator.validateTemplate(testTemplate);
    const hasExpectedError = result.errors.some(error => error.code === errorCode);
    
    console.log(`  Result: ${hasExpectedError ? 'PASS' : 'FAIL'}`);
    if (hasExpectedError) {
      const error = result.errors.find(e => e.code === errorCode);
      console.log(`  Error Message: ${error?.message}`);
    } else {
      console.log(`  Expected error ${errorCode} not found`);
      console.log(`  Actual errors: ${result.errors.map(e => e.code).join(', ')}`);
    }
  }
}

// Export test data for manual testing
export {
  validMarketingTemplate,
  validUtilityTemplate,
  validAuthTemplate,
  invalidAuthTemplate,
  templateWithInvalidName,
  templateWithUnsupportedLanguage,
  templateWithTooManyButtons,
  templateWithLongBody,
  templateWithoutBody
};

export default ValidationTestSuite;

