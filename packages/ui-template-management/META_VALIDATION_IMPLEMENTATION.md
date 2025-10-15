# Meta WhatsApp Business API Template Validation System

## Overview

This implementation provides comprehensive validation for WhatsApp Business API template creation, ensuring compliance with Meta's requirements before making API calls. The system prevents common errors like the one you encountered:

```json
{
    "message": "Error from META",
    "error": {
        "code": "BAD_REQUEST",
        "detail": "{\"error\":{\"message\":\"Invalid parameter\",\"type\":\"OAuthException\",\"code\":100,\"error_subcode\":2388148,\"is_transient\":false,\"error_user_title\":\"Unsupported message template button configuration\",\"error_user_msg\":\"Message templates in the AUTHENTICATION category must have exactly one button, which must be of the OTP type. Other button types, creating a template without a button or creating a template with more than one button are not supported in this category.\",\"fbtrace_id\":\"AAj7k6hR9QQb4jNSdt_DVMZ\"}}"
    }
}
```

## Key Features

### 1. **Comprehensive Validation Service** (`metaTemplateValidator.ts`)
- **Template Name Validation**: Ensures unique, valid naming conventions
- **Language Support**: Validates against Meta's supported language codes
- **Category-Specific Rules**: Different validation rules for MARKETING, UTILITY, and AUTHENTICATION templates
- **Component Validation**: Validates headers, body, footer, and buttons
- **Button Configuration**: Ensures proper button types and configurations
- **Character Limits**: Enforces Meta's character limits for all text fields

### 2. **Real-Time Validation Hook** (`useTemplateValidation.ts`)
- Provides reactive validation state management
- Integrates seamlessly with React components
- Returns validation results, errors, and warnings

### 3. **Payload Transformation** (`payloadTransformer.ts`)
- Converts internal template format to Meta API format
- Handles case sensitivity (lowercase → uppercase)
- Ensures proper field mapping

### 4. **Enhanced UI Components** (`CreateTemplateUI.tsx`)
- Real-time validation feedback
- User-friendly error messages
- Visual indicators for validation status
- Prevents submission when validation fails

## Validation Rules Implemented

### **AUTHENTICATION Templates**
- ✅ Must have exactly one OTP button
- ✅ Cannot have multiple buttons
- ✅ Cannot have non-OTP buttons
- ✅ OTP button must specify `otp_type` (one_tap, zero_tap, copy_code)
- ✅ One-tap and zero-tap buttons must have `supported_apps`
- ✅ Zero-tap buttons must have `zero_tap_terms_accepted: true`

### **MARKETING Templates**
- ✅ Must have a body component
- ✅ Can have up to 3 buttons
- ✅ Supports headers, footers, and various button types

### **UTILITY Templates**
- ✅ Must have a body component
- ✅ Can have up to 3 buttons
- ✅ Supports headers, footers, and various button types

### **General Rules**
- ✅ Template name: 1-512 characters, alphanumeric + underscores only
- ✅ Language: Must be from Meta's supported language list
- ✅ Header text: Max 60 characters
- ✅ Body text: Max 1024 characters
- ✅ Footer text: Max 60 characters
- ✅ Button text: Max 25 characters
- ✅ URL: Max 2000 characters
- ✅ Phone number: Max 20 characters

## Usage Example

```typescript
import { useTemplateValidation } from '../hooks/useTemplateValidation';

function CreateTemplate() {
  const { validateTemplate, isValid, errors, warnings } = useTemplateValidation();
  
  const handleSubmit = (payload: CreateTemplatePayload) => {
    const validation = validateTemplate(payload);
    
    if (!validation.isValid) {
      // Show errors to user
      console.log('Validation failed:', validation.errors);
      return;
    }
    
    // Proceed with API call
    createTemplate(payload);
  };
  
  return (
    <div>
      {/* Template creation form */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errors.map(error => error.message).join(', ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

## Error Prevention

The system prevents these common Meta API errors:

1. **AUTHENTICATION Button Configuration**: Ensures exactly one OTP button
2. **Invalid Template Names**: Validates naming conventions
3. **Unsupported Languages**: Checks against Meta's language list
4. **Character Limit Exceeded**: Enforces all text limits
5. **Missing Required Components**: Ensures body components exist
6. **Invalid Button Types**: Validates button configurations
7. **Duplicate Button Types**: Prevents duplicate button types in same component

## Integration Points

### **Template Services**
- `apps/template-management/lib/api/TemplateService.ts` - Updated to use payload transformer
- `apps/product/lib/api/TemplateServices.ts` - Can be updated similarly

### **UI Components**
- `packages/ui-template-management/src/components/CreateTemplateUI.tsx` - Enhanced with validation
- Real-time validation feedback
- Disabled submit button when validation fails

## Testing

The system includes comprehensive test cases in `validationDemo.ts`:

- ✅ Valid marketing template
- ✅ Invalid authentication template (wrong button type)
- ✅ Valid authentication template
- ✅ Template with invalid name
- ✅ Template with too many buttons

## Benefits

1. **Prevents API Errors**: Catches validation issues before API calls
2. **Better User Experience**: Real-time feedback and clear error messages
3. **Reduced Support Tickets**: Users get immediate feedback on issues
4. **Compliance**: Ensures templates meet Meta's requirements
5. **Maintainability**: Centralized validation logic

## Next Steps

1. **Deploy**: Integrate the validation system into your template creation flow
2. **Test**: Run the validation demo to see it in action
3. **Monitor**: Track validation errors to identify common user mistakes
4. **Extend**: Add more validation rules as Meta updates their requirements

This implementation will significantly reduce the "Invalid parameter" errors you're experiencing by catching issues before they reach Meta's API.

