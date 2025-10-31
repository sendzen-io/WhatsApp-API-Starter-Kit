"use client";

import React, { useState, useCallback, useEffect } from "react";
import type {
  CreateTemplatePayload,
  HeaderComponent,
  HeaderMediaComponent,
  BodyComponent,
  FooterComponent,
  TemplateComponent,
  ButtonsComponent,
  TemplateButton,
} from "../types/templateTypes";
import { Button } from "@workspace/ui-core/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@workspace/ui-core/components/card";
import { Input } from "@workspace/ui-core/components/input";
import { Label } from "@workspace/ui-core/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui-core/components/select";
import { Textarea } from "@workspace/ui-core/components/textarea";
import { Separator } from "@workspace/ui-core/components/separator";
import { PlusCircle, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui-core/components/dropdown-menu";
import AuthenticationTemplateForm from "./AuthenticationTemplateForm";
import { AuthTemplateComponent } from "../types/templateTypes";
import { SUPPORTED_LANGUAGES } from "../lib/languages";
import HeaderComponentEditor from "./HeaderComponentEditor";
import { useToast } from "@workspace/ui-core/hooks/use-toast";
import { useTemplateValidation } from "../hooks/useTemplateValidation";
import { Alert, AlertDescription } from "@workspace/ui-core/components/alert";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface CreateTemplateUIProps {
  onCancel: () => void;
  onSubmit: (template: CreateTemplatePayload) => Promise<void>;
  dictionary?: any; // Will be properly typed when passed from TemplateManager
  onFileUpload?: (file: File) => Promise<string>;
  isLoading?: boolean;
}

interface MetaDisplayError {
  title: string;
  message: string;
}

/**
 * Extract "error_user_title: error_user_msg" from Meta related error object.
 */
function getMetaDisplayError(err: any): MetaDisplayError | null {
  debugger;
  const tryParse = (s?: string) => {
    if (!s) return null;
    try {
      const obj = JSON.parse(s);
      return obj && obj.error ? obj.error : null;
    } catch {
      return null;
    }
  };

  // 1) JSON string in details
  const fromDetails = tryParse(err?.details);
  // 2) JSON string in data.error.detail
  const fromDataDetail = tryParse(err?.data?.error?.detail);
  // 3) Embedded JSON in message like: "Error from META: {...}"
  const fromMessage = (() => {
    const msg = err?.message;
    if (typeof msg !== "string") return null;
    const brace = msg.indexOf("{");
    if (brace < 0) return null;
    return tryParse(msg.slice(brace));
  })();

  const meta =
    fromDetails ??
    fromDataDetail ??
    fromMessage;

  if (!meta) return null;

  const title =
    meta.error_user_title ??
    "META Error";

  const message =
    meta.error_user_msg ??
    meta.message ??
    "Unknown error";

  return { title, message };
}

function formatMetaDisplay(err: any): string {
  const m = getMetaDisplayError(err);
  return m ? `${m.title}: ${m.message}` : "Unknown error";
}

const CreateTemplateUI: React.FC<CreateTemplateUIProps> = ({
  onCancel,
  onSubmit,
  dictionary,
  onFileUpload,
  isLoading = false,
}) => {
  // Use dictionary with fallback to English text
  const dict = dictionary?.createTemplate || {
    title: "Create New Template",
    description: "Fill in the details to create a new message template.",
    templateName: "Template Name",
    templateNamePlaceholder: "e.g. order_confirmation",
    templateNameHelp: "Lowercase letters, numbers, and underscores only.",
    language: "Language",
    languagePlaceholder: "Select a language",
    category: "Category",
    categoryPlaceholder: "Select a category",
    categories: {
      marketing: "Marketing",
      utility: "Utility",
      authentication: "Authentication",
    },
    components: "Components",
    addHeader: "Add Header",
    addFooter: "Add Footer",
    addButtons: "Add Buttons",
    body: "Body",
    footer: "Footer",
    buttons: "Buttons",
    buttonText: "Button Text",
    buttonTextPlaceholder: "Enter button text",
    buttonUrl: "URL",
    buttonUrlPlaceholder: "https://example.com",
    buttonPhone: "Phone Number",
    buttonPhonePlaceholder: "+1234567890",
    removeComponent: "Remove",
    validation: {
      pleaseFixIssues: "Please fix the following issues:",
      templateSuggestions: "Template suggestions:",
      templateStructureGood: "Template structure looks good! Ready to create.",
      validationError: "Validation Error",
      fillRequiredFields: "Please fill in all required fields before creating the template.",
      invalidCategory: "Invalid template category.",
      templateValidationFailed: "Template Validation Failed",
      fixIssuesBeforeCreating: "Please fix the following issues before creating the template:",
    },
    loading: {
      creatingTemplate: "Creating Template...",
      pleaseWait: "Please wait while we process your template",
    },
    cancel: "Cancel",
    createTemplate: "Create Template",
  };
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en_US");
  const [category, setCategory] = useState<
    "MARKETING" | "UTILITY" | "AUTHENTICATION"
  >("MARKETING");
  const [parameterFormat, setParameterFormat] = useState<"NAMED" | "POSITIONAL">("NAMED");

  const [components, setComponents] = useState<TemplateComponent[]>([
    { type: "BODY", text: "" },
  ]);
  const [authComponents, setAuthComponents] = useState<AuthTemplateComponent[]>([
    { type: "BODY" }
  ]);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [isSubmittedOnce, setIsSubmittedOnce] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const { validateTemplate, isValid, errors: validationErrors, warnings, userErrors, userWarnings, errorMessage, clearValidation } = useTemplateValidation();

  // Function to detect parameter format from template text
  const detectParameterFormat = (text: string): "NAMED" | "POSITIONAL" => {
    if (!text) return "NAMED"; // Default to named if no text
    
    // Check for positional parameters ({{1}}, {{2}}, etc.)
    const positionalMatches = text.match(/{{(\d+)}}/g);
    // Check for named parameters ({{first_name}}, {{order_number}}, etc.)
    const namedMatches = text.match(/{{(\w+)}}/g);
    
    // If we find positional parameters, use positional format
    if (positionalMatches && positionalMatches.length > 0) {
      return "POSITIONAL";
    }
    
    // If we find named parameters, use named format
    if (namedMatches && namedMatches.length > 0) {
      return "NAMED";
    }
    
    // Default to named if no parameters found
    return "NAMED";
  };

  // Real-time validation
  useEffect(() => {
    if (name && language && category) {
      // Auto-detect parameter format from body text
      const bodyComponent = components.find(c => c.type === 'BODY') as BodyComponent | undefined;
      const detectedFormat = bodyComponent?.text ? detectParameterFormat(bodyComponent.text) : "NAMED";
      setParameterFormat(detectedFormat);

      let payload: CreateTemplatePayload;
      switch (category) {
        case "MARKETING":
          payload = { name, language, category, parameter_format: detectedFormat.toLowerCase() as "named" | "positional", components };
          break;
        case "UTILITY":
          payload = { name, language, category, parameter_format: detectedFormat.toLowerCase() as "named" | "positional", components };
          break;
        case "AUTHENTICATION":
          payload = { name, language, category, components: authComponents };
          break;
        default:
          return;
      }
      validateTemplate(payload);
    } else {
      clearValidation();
    }
  }, [name, language, category, components, authComponents, validateTemplate, clearValidation]);

  const handleCategoryChange = (
    value: "MARKETING" | "UTILITY" | "AUTHENTICATION"
  ) => {
    setCategory(value);
    // Clear API errors when user makes changes
    if (apiErrors.length > 0) {
      setApiErrors([]);
    }
    if (value === "AUTHENTICATION") {
      setComponents([]);
      setAuthComponents([{ type: "BODY" }]);
    } else {
      setComponents([{ type: "BODY", text: "" }]);
      setAuthComponents([]);
    }
  };

  const updateComponent = (
    index: number,
    updatedComponent: TemplateComponent
  ) => {
    setComponents((prev) =>
      prev.map((c, i) => (i === index ? updatedComponent : c))
    );
  };

  const addComponent = (type: "HEADER" | "FOOTER" | "BUTTONS") => {
    const hasComponent = components.some((c) => c.type === type);
    if (hasComponent) return;

    let newComponent: TemplateComponent;

    switch (type) {
      case "HEADER":
        newComponent = { type: "HEADER", format: "TEXT", text: "" };
        // Add header to the beginning
        setComponents((prev) => [newComponent, ...prev]);
        break;
      case "FOOTER":
        newComponent = { type: "FOOTER", text: "" };
        const bodyIndex = components.findIndex((c) => c.type === "BODY");
        setComponents((prev) => [
          ...prev.slice(0, bodyIndex + 1),
          newComponent,
          ...prev.slice(bodyIndex + 1),
        ]);
        break;
      case "BUTTONS":
        newComponent = { type: "BUTTONS", buttons: [] };
        setComponents((prev) => [...prev, newComponent]);
        break;
    }
  };

  const removeComponent = (index: number) => {
    const component = components[index];
    if (!component || component.type === "BODY") return; // Body is required
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = useCallback(() => {
    const newErrors: Record<string, any> = {};

    // Validate Template Name
    if (!name) {
      newErrors.name = "Template name is required.";
    } else if (!/^[a-z0-9_]+$/.test(name)) {
      newErrors.name = "Only lowercase letters, numbers, and underscores are allowed.";
    }

    // Validate Language
    if (!language) {
      newErrors.language = "Language is required.";
    }

    if (category === "AUTHENTICATION") {
      if (!authComponents.some(c => c.type === 'BODY')) {
        newErrors.auth_body = "Authentication templates must have a body component.";
      }
    } else {
      const bodyComponent = components.find(c => c.type === 'BODY') as BodyComponent;
      if (!bodyComponent || !bodyComponent.text.trim()) {
        newErrors.body_0 = "Body text is required.";
      }

      components.forEach((component, index) => {
        switch (component.type) {
          case "HEADER":
            const headerComponent = component as HeaderComponent;
            if (headerComponent.format === "TEXT") {
              if (!headerComponent.text || !headerComponent.text.trim()) {
                newErrors[`header_${index}`] = "Header text is required.";
              } else if (headerComponent.text.length > 60) {
                newErrors[`header_${index}`] = "Header text cannot exceed 60 characters.";
              }
            } else if (headerComponent.format !== "LOCATION") {
              // For image, video, document formats, check if media URL is provided
              if (headerComponent.format === "IMAGE" || headerComponent.format === "VIDEO" || headerComponent.format === "DOCUMENT") {
                const mediaComponent = headerComponent as any;
                if (!mediaComponent.example?.header_handle?.[0] || !mediaComponent.example.header_handle[0].trim()) {
                  newErrors[`header_${index}`] = "Media URL is required for this header type.";
                }
              }
            }
            break;
          case "BODY":
            if (!component.text || !component.text.trim()) {
              newErrors[`body_${index}`] = "Body text is required.";
            } else if (component.text.length > 1024) {
              newErrors[`body_${index}`] = "Body text cannot exceed 1024 characters.";
            }
            break;
          case "FOOTER":
            const footerComponent = component as FooterComponent;
            if (!footerComponent.text || !footerComponent.text.trim()) {
              newErrors[`footer_${index}`] = "Footer text is required.";
            } else if (footerComponent.text.length > 60) {
              newErrors[`footer_${index}`] = "Footer text cannot exceed 60 characters.";
            }
            break;
          case "BUTTONS":
            const buttonsComponent = component as ButtonsComponent;
            
            // Check if buttons exist
            if (buttonsComponent.buttons.length === 0) {
              newErrors[`buttons_${index}`] = "Add at least one button or remove the Buttons component.";
            }
            
            // Count button types
            const quickReplyCount = buttonsComponent.buttons.filter(b => b.type === 'QUICK_REPLY').length;
            const urlCount = buttonsComponent.buttons.filter(b => b.type === 'URL').length;
            const phoneCount = buttonsComponent.buttons.filter(b => b.type === 'PHONE_NUMBER').length;
            const totalButtonCount = buttonsComponent.buttons.length;
            
            // WhatsApp Button Total Limit Validation
            if (totalButtonCount > 10) {
              newErrors[`buttons_${index}`] = "Maximum 10 buttons allowed per template.";
            }
            
            // WhatsApp Button Type Limits Validation
            if (quickReplyCount > 10) {
              newErrors[`buttons_${index}`] = "Maximum 10 Quick Reply buttons allowed per template.";
            }
            if (urlCount > 2) {
              newErrors[`buttons_${index}`] = "Maximum 2 URL buttons allowed per template.";
            }
            if (phoneCount > 1) {
              newErrors[`buttons_${index}`] = "Maximum 1 Phone Number button allowed per template.";
            }
            
            // WhatsApp Button Ordering Validation: Buttons of the same type must be grouped together
            // Valid: QR, QR, QR, URL, URL, CALL
            // Valid: URL, URL, CALL, QR, QR
            // Invalid: QR, URL, QR (interrupted QR group)
            if (buttonsComponent.buttons.length > 0) {
              const buttonTypes = buttonsComponent.buttons.map(b => {
                if (b.type === 'QUICK_REPLY') return 'QR';
                if (b.type === 'URL') return 'URL';
                return 'CALL';
              });
              
              let transitions = 0;
              for (let i = 1; i < buttonTypes.length; i++) {
                if (buttonTypes[i] !== buttonTypes[i - 1]) {
                  transitions++;
                }
              }
              
              // With 3 button types (QR, URL, CALL), max valid transitions is 2
              // Example: QR group -> URL group -> CALL group = 2 transitions
              if (transitions > 2) {
                newErrors[`buttons_${index}`] = "Invalid button order. Buttons of the same type must be grouped together. Example: [QR, QR, URL, URL, CALL] is valid, but [QR, URL, QR] is invalid.";
              }
            }
            
            // Individual button field validation
            buttonsComponent.buttons.forEach((button, btnIndex) => {
              // Button Text Validation (required, max 25 chars)
              if ('text' in button) {
                if (!button.text || !button.text.trim()) {
                  newErrors[`button_${index}_${btnIndex}_text`] = "Button text is required.";
                } else if (button.text.length > 25) {
                  newErrors[`button_${index}_${btnIndex}_text`] = "Button text cannot exceed 25 characters.";
                }
              }

              // URL Button Validation
              if (button.type === "URL") {
                if (!button.url || !button.url.trim()) {
                  newErrors[`button_${index}_${btnIndex}_url`] = "URL is required.";
                } else if (button.url.length > 2000) {
                  newErrors[`button_${index}_${btnIndex}_url`] = "URL cannot exceed 2000 characters.";
                }
              }
              
              // Phone Number Button Validation
              else if (button.type === "PHONE_NUMBER") {
                if (!button.phone_number || !button.phone_number.trim()) {
                  newErrors[`button_${index}_${btnIndex}_phone`] = "Phone number is required.";
                } else if (button.phone_number.length > 20) {
                  newErrors[`button_${index}_${btnIndex}_phone`] = "Phone number cannot exceed 20 characters.";
                }
              }
            });
            break;
        }
      });
    }

    return newErrors;
  }, [name, language, category, components, authComponents]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const newErrors = validate();
      const isValid = Object.keys(newErrors).length === 0;
      setIsFormValid(isValid);

      if (isSubmittedOnce) {
        setErrors(newErrors);
      }
    }, 300); // Debounce validation

    return () => {
      clearTimeout(handler);
    };
  }, [validate, isSubmittedOnce]);

  const focusOnFirstError = (errors: Record<string, any>) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;

    // Map error keys to element IDs
    const errorElementMap: Record<string, string> = {
      name: 'template-name',
      language: 'template-language',
      body_0: 'body-textarea',
    };

    // Find the first error element to focus on
    for (const errorKey of errorKeys) {
      let elementId = errorElementMap[errorKey];
      
      if (!elementId) {
        // Handle component-specific errors
        if (errorKey.startsWith('header_')) {
          const headerIndex = errorKey.split('_')[1];
          elementId = `header-text-${headerIndex}`;
        } else if (errorKey.startsWith('footer_')) {
          const footerIndex = errorKey.split('_')[1];
          elementId = `footer-text-${footerIndex}`;
        } else if (errorKey.startsWith('buttons_')) {
          const buttonsIndex = errorKey.split('_')[1];
          elementId = `buttons-${buttonsIndex}`;
        } else if (errorKey.startsWith('button_')) {
          const parts = errorKey.split('_');
          const componentIndex = parts[1];
          const buttonIndex = parts[2];
          const fieldType = parts[3];
          elementId = `btn-${fieldType}-${buttonIndex}`;
        }
      }

      if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
          break;
        }
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmittedOnce(true);
    const newErrors = validate();
    const isFormValid = Object.keys(newErrors).length === 0;
    setErrors(newErrors);

    if (!isFormValid) {
      // Store validation errors instead of showing toast
      setApiErrors([dict.validation.fillRequiredFields]);
      
      // Focus on the first error element
      focusOnFirstError(newErrors);
      return;
    }

    // Create payload based on category
    let payload: CreateTemplatePayload;
    
    // Auto-detect parameter format from body text for final payload
    const bodyComponent = components.find(c => c.type === 'BODY') as BodyComponent | undefined;
    const finalDetectedFormat = bodyComponent?.text ? detectParameterFormat(bodyComponent.text) : "NAMED";
    
    switch (category) {
      case "MARKETING":
        payload = { name, language, category, parameter_format: finalDetectedFormat.toLowerCase() as "named" | "positional", components };
        break;
      case "UTILITY":
        payload = { name, language, category, parameter_format: finalDetectedFormat.toLowerCase() as "named" | "positional", components };
        break;
      case "AUTHENTICATION":
        payload = { name, language, category, components: authComponents };
        break;
      default:
        // Store error instead of showing toast
        setApiErrors([dict.validation.invalidCategory]);
        return;
    }

    // Validate with Meta requirements
    const metaValidation = validateTemplate(payload);
    
    if (!metaValidation.isValid) {
      // Store Meta validation errors instead of showing toast
      const metaErrors = [];
      if (metaValidation.errors && metaValidation.errors.length > 0) {
        metaErrors.push(...metaValidation.errors.map((error: any) => error.message || error));
      }
      if (metaValidation.userErrors && metaValidation.userErrors.length > 0) {
        metaErrors.push(...metaValidation.userErrors.map((error: any) => error.message || error));
      }
      if (metaErrors.length === 0) {
        metaErrors.push(dict.validation.fixIssuesBeforeCreating);
      }
      setApiErrors(metaErrors);
      
      // Focus on the first error element
      focusOnFirstError(newErrors);
      return;
    }

    // If validation passes, submit the template
    setApiErrors([]); // Clear any previous API errors
    
    try {
      await onSubmit(payload);
      
      // Show success toast message
      toast({
        title: dict.webhook?.template?.createdSuccessfully || "Template created successfully!",
        description: dict.webhook?.template?.sentForApproval || "Your template has been submitted and is now pending approval from Meta.",
        duration: 5000,
      });
      
    } catch (error) {
      let errorMessage = formatMetaDisplay(error);
      setApiErrors([errorMessage]);
    }
  };

  const handleAuthFormChange = useCallback((newAuthComponents: AuthTemplateComponent[], isValid: boolean) => {
    setAuthComponents(newAuthComponents);
    // You might want to use the `isValid` flag to control the submit button's state
    // For now, we'll just update the components and let the main validation handle it
  }, []);

  const renderBody = (component: BodyComponent, index: number) => {
    const handleBodyChange = (newText: string) => {
      // Clear API errors when user makes changes
      if (apiErrors.length > 0) {
        setApiErrors([]);
      }
      
      // Auto-detect parameter format from the new text
      const detectedFormat = detectParameterFormat(newText);
      setParameterFormat(detectedFormat);

      let updatedComponent: BodyComponent = {
        ...component,
        text: newText,
        example: { ...component.example },
      };

      if (detectedFormat === "NAMED") {
        // Handle named parameters ({{first_name}})
        const foundVariables = Array.from(
          new Set(newText.match(/{{\w+}}/g) || [])
        ).map((v) => v.replace(/{|}/g, ""));

        const existingExamples = component.example?.body_text_named_params || [];
        const newExamples = foundVariables.map((name) => {
          const existing = existingExamples.find((ex) => ex.param_name === name);
          return existing || { param_name: name, example: "" };
        });

        updatedComponent.example = {
          ...updatedComponent.example,
          body_text_named_params: newExamples,
        };

        // Clean up positional examples if they exist
        if (updatedComponent.example?.body_text) {
          delete updatedComponent.example.body_text;
        }

        if (newExamples.length === 0) {
          delete updatedComponent.example?.body_text_named_params;
        }
      } else {
        // Handle positional parameters ({{1}}, {{2}})
        const foundVariables = Array.from(
          new Set(newText.match(/{{(\d+)}}/g) || [])
        ).map((v) => v.replace(/{|}/g, ""));

        // Generate proper example values for positional parameters
        const existingExamples = component.example?.body_text?.[0] || [];
        const newExamples = foundVariables.length > 0 ? [
          foundVariables.map((paramNum, index) => {
            // Try to preserve existing example values
            const existingValue = existingExamples[index];
            return existingValue || ""; // Use existing value or empty string
          })
        ] : [[]];

        updatedComponent.example = {
          ...updatedComponent.example,
          body_text: newExamples,
        };

        // Clean up named examples if they exist
        if (updatedComponent.example?.body_text_named_params) {
          delete updatedComponent.example.body_text_named_params;
        }

        if (foundVariables.length === 0) {
          delete updatedComponent.example?.body_text;
        }
      }

      // Clean up empty example object
      if (
        updatedComponent.example &&
        Object.keys(updatedComponent.example).length === 0
      ) {
        delete updatedComponent.example;
      }

      updateComponent(index, updatedComponent);
    };

    const handleExampleChange = (param_name: string, value: string) => {
      if (parameterFormat === "NAMED") {
        if (!component.example?.body_text_named_params) return;

        const newExamples = component.example.body_text_named_params.map((ex) =>
          ex.param_name === param_name ? { ...ex, example: value } : ex
        );

        updateComponent(index, {
          ...component,
          example: {
            ...component.example,
            body_text_named_params: newExamples,
          },
        });
      } else {
        // For positional parameters, we need to update the body_text array
        if (!component.example?.body_text) return;

        const paramIndex = parseInt(param_name) - 1; // Convert {{1}} to index 0
        const currentExamples = component.example.body_text[0] || [];
        const newExamples = [...currentExamples];
        
        // Ensure the array is long enough
        while (newExamples.length <= paramIndex) {
          newExamples.push("");
        }
        
        newExamples[paramIndex] = value;

        updateComponent(index, {
          ...component,
          example: {
            ...component.example,
            body_text: [newExamples],
          },
        });
      }
    };

    return (
        <Card key={index}>
            <CardHeader>
                <CardTitle>Body</CardTitle>
                <CardDescription>
                  The main message content. 
                  {parameterFormat === "NAMED" 
                    ? "Use named variables like {`{{variable_name}}`}. (Required)"
                    : "Use positional variables like {`{{1}}`}, {`{{2}}`}. (Required)"
                  }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    id="body-textarea"
                    name="body-textarea"
                    placeholder="Enter your message body here..."
                    style={{ minHeight: '150px', maxHeight: '300px' }}
                    rows={5}
                    maxLength={1024}
                    value={component.text}
                    onChange={e => handleBodyChange(e.target.value)}
                    disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground mt-1">Max length: {component.text.length}/1024 characters</p>
                {errors[`body_${index}`] && <p className="text-sm text-destructive mt-1">{errors[`body_${index}`]}</p>}
                {/* Named Parameters Examples */}
                {(parameterFormat === "NAMED" && component.example?.body_text_named_params && component.example.body_text_named_params.length > 0) && (
                    <div className="mt-4 space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium">Example Body Variables</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                        {component.example.body_text_named_params.map((example, i) => (
                            <div key={i} className="space-y-2 mb-2">
                                <Label htmlFor={`body-var-${example.param_name}`}>Variable {`{{${example.param_name}}}`}</Label>
                                <Input
                                    id={`body-var-${example.param_name}`}
                                    placeholder={`Example for {{${example.param_name}}}`}
                                    value={example.example || ''}
                                    onChange={e => handleExampleChange(example.param_name, e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        ))}
                        </div>
                    </div>
                )}

                {/* Positional Parameters Examples */}
                {(parameterFormat === "POSITIONAL" && component.example?.body_text && component.example.body_text[0] && component.example.body_text[0].length > 0) && (
                    <div className="mt-4 space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium">Example Body Variables</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                        {component.example.body_text[0].map((example, i) => (
                            <div key={i} className="space-y-2 mb-2">
                                <Label htmlFor={`body-var-${i + 1}`}>Variable {`{{${i + 1}}}`}</Label>
                                <Input
                                    id={`body-var-${i + 1}`}
                                    placeholder={`Example for {{${i + 1}}}`}
                                    value={example || ''}
                                    onChange={e => handleExampleChange((i + 1).toString(), e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
  };

  const renderFooter = (component: FooterComponent, index: number) => (
    <Card key={index}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Footer</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeComponent(index)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        <CardDescription>Add an optional short line of text to the bottom of your message.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          id={`footer-text-${index}`}
          placeholder="Enter footer text"
          value={component.text}
          onChange={(e) =>
            updateComponent(index, { ...component, text: e.target.value })
          }
          disabled={isLoading}
        />
        {errors[`footer_${index}`] && <p className="text-sm text-destructive mt-1">{errors[`footer_${index}`]}</p>}
      </CardContent>
    </Card>
  );

  const renderButtons = (component: ButtonsComponent, pIndex: number) => {
    const updateButtons = (buttons: TemplateButton[]) => {
      updateComponent(pIndex, { ...component, buttons });
    };

    const addButton = (type: TemplateButton["type"]) => {
      let newButton: TemplateButton;
      if (type === "URL") newButton = { type: "URL", text: "", url: "" };
      else if (type === "PHONE_NUMBER")
        newButton = { type: "PHONE_NUMBER", text: "", phone_number: "" };
      else newButton = { type: "QUICK_REPLY", text: "" };
      
      // Smart insertion: Automatically place new button in the correct group to maintain sequence
      const buttons = component.buttons;
      
      // Define button type order (QR → URL → CALL)
      const getTypeOrder = (btnType: string) => {
        if (btnType === "QUICK_REPLY") return 0;
        if (btnType === "URL") return 1;
        return 2; // PHONE_NUMBER
      };
      
      let insertIndex = buttons.length; // Default: add at the end
      
      if (buttons.length === 0) {
        // No buttons yet, just add it
        insertIndex = 0;
      } else {
        // Strategy: Always find the group of the same type and insert at the end of that group
        let foundGroup = false;
        
        for (let i = 0; i < buttons.length; i++) {
          // If we found a button of the same type, insert at the end of that group
          if (buttons[i] && buttons[i]?.type === type) {
            let j = i;
            while (j < buttons.length && buttons[j] && buttons[j]?.type === type) {
              j++;
            }
            insertIndex = j;
            foundGroup = true;
            break;
          }
        }
        
        // If we didn't find any buttons of this type, insert at the appropriate position based on type order
        if (!foundGroup) {
          const newTypeOrder = getTypeOrder(type);
          
          for (let i = 0; i < buttons.length; i++) {
            if (!buttons[i]) continue;
            const currentTypeOrder = getTypeOrder(buttons[i]?.type || "");
            
            // If current button has higher order (comes later), insert before it
            if (currentTypeOrder > newTypeOrder) {
              insertIndex = i;
              break;
            }
          }
          // If we never found a higher order button, insertIndex remains buttons.length (at end)
        }
      }
      
      // Insert the button at the calculated position
      const newButtons: TemplateButton[] = [...buttons];
      newButtons.splice(insertIndex, 0, newButton);
      updateButtons(newButtons);
    };

    const removeButton = (btnIndex: number) => {
      updateButtons(component.buttons.filter((_, i) => i !== btnIndex));
    };

    const updateButton = (btnIndex: number, updatedButton: TemplateButton) => {
      updateButtons(
        component.buttons.map((b, i) => (i === btnIndex ? updatedButton : b))
      );
    };

    const swapButtons = (index1: number, index2: number) => {
      const newButtons = [...component.buttons];
      const temp = newButtons[index1];
      const button2 = newButtons[index2];
      
      if (temp === undefined || button2 === undefined) return;
      
      // If both buttons are the same type, swapping won't change grouping - always allow
      if (temp.type === button2.type) {
        newButtons[index1] = button2;
        newButtons[index2] = temp;
        updateButtons(newButtons);
        return;
      }
      
      // Different types: Swap entire groups to maintain valid grouping
      // Step 1: Find which groups the buttons belong to
      const findGroupBounds = (index: number) => {
        const button = component.buttons[index];
        if (!button) return { start: index, end: index };
        const type = button.type;
        let start = index;
        let end = index;
        
        while (start > 0 && component.buttons[start - 1]?.type === type) {
          start--;
        }
        while (end < component.buttons.length - 1 && component.buttons[end + 1]?.type === type) {
          end++;
        }
        return { start, end };
      };
      
      const group1 = findGroupBounds(index1);
      const group2 = findGroupBounds(index2);
      
      // Step 2: Swap the entire groups
      const resultButtons: TemplateButton[] = [];
      
      // Determine which group comes first
      if (group1.start < group2.start) {
        // Group1 before Group2: [..., group1, ..., group2, ...] -> [..., group2, ..., group1, ...]
        resultButtons.push(...component.buttons.slice(0, group1.start));
        resultButtons.push(...component.buttons.slice(group2.start, group2.end + 1));
        if (group1.end + 1 < group2.start) {
          resultButtons.push(...component.buttons.slice(group1.end + 1, group2.start));
        }
        resultButtons.push(...component.buttons.slice(group1.start, group1.end + 1));
        resultButtons.push(...component.buttons.slice(group2.end + 1));
      } else {
        // Group2 before Group1: [..., group2, ..., group1, ...] -> [..., group1, ..., group2, ...]
        resultButtons.push(...component.buttons.slice(0, group2.start));
        resultButtons.push(...component.buttons.slice(group1.start, group1.end + 1));
        if (group2.end + 1 < group1.start) {
          resultButtons.push(...component.buttons.slice(group2.end + 1, group1.start));
        }
        resultButtons.push(...component.buttons.slice(group2.start, group2.end + 1));
        resultButtons.push(...component.buttons.slice(group1.end + 1));
      }
      
      updateButtons(resultButtons);
    };

    const hasQuickReply = component.buttons.some(
      (b) => b.type === "QUICK_REPLY"
    );
    const hasUrl = component.buttons.some((b) => b.type === "URL");
    const hasPhone = component.buttons.some((b) => b.type === "PHONE_NUMBER");
    const quickReplyCount = component.buttons.filter(
      (b) => b.type === "QUICK_REPLY"
    ).length;
    const urlCount = component.buttons.filter((b) => b.type === "URL").length;
    const phoneCount = component.buttons.filter(
      (b) => b.type === "PHONE_NUMBER"
    ).length;
    const totalButtonCount = component.buttons.length;

    return (
      <Card key={pIndex} id={`buttons-${pIndex}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <CardTitle>Buttons</CardTitle>
              <CardDescription className="mt-1">
                <p className="text-xs text-muted-foreground">
                  Maximum 10 buttons total. Quick Reply (max 10), URL (max 2), Phone (max 1). Buttons automatically group by type. Swapping moves entire button groups to maintain proper sequence.
                </p>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add a Button
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => addButton("QUICK_REPLY")}
                    disabled={quickReplyCount >= 10 || totalButtonCount >= 10}
                  >
                    Quick Reply {quickReplyCount > 0 && `(${quickReplyCount}/10)`}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => addButton("URL")}
                    disabled={urlCount >= 2 || totalButtonCount >= 10}
                  >
                    Visit Website {urlCount > 0 && `(${urlCount}/2)`}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => addButton("PHONE_NUMBER")}
                    disabled={phoneCount >= 1 || totalButtonCount >= 10}
                  >
                    Call Phone Number {phoneCount > 0 && `(1/1)`}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeComponent(pIndex)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
           {errors[`buttons_${pIndex}`] && <p className="text-sm text-destructive mt-2">{errors[`buttons_${pIndex}`]}</p>}
        </CardHeader>
        {component.buttons.length > 0 && <CardContent className="space-y-4">
          {component.buttons.map((button, index) => {
            const otherButtons = component.buttons.filter(
              (_, i) => i !== index
            );

            const currentQuickReplyCount = component.buttons.filter((b) => b.type === "QUICK_REPLY").length;
            
            // Check if buttons are properly grouped (same types are contiguous)
            const hasProperGrouping = () => {
              if (component.buttons.length === 0) return true;
              const buttonTypes = component.buttons.map(b => b.type === 'QUICK_REPLY' ? 'QR' : (b.type === 'URL' ? 'URL' : 'CALL'));
              let transitions = 0;
              for (let i = 1; i < buttonTypes.length; i++) {
                if (buttonTypes[i] !== buttonTypes[i - 1]) {
                  transitions++;
                }
              }
              // Valid grouping: transitions should be at most the number of distinct groups - 1
              // If all types are properly grouped, we should have minimal transitions
              return transitions <= 2; // Allow: QR group, URL group, CALL group = 2 transitions max
            };
            
            // Simulate changing the current button type and check if it maintains proper grouping
            const wouldMaintainGrouping = (newType: string) => {
              const simulatedButtons = [...component.buttons];
              simulatedButtons[index] = { ...button, type: newType } as any;
              
              const buttonTypes = simulatedButtons.map(b => b.type === 'QUICK_REPLY' ? 'QR' : (b.type === 'URL' ? 'URL' : 'CALL'));
              let transitions = 0;
              for (let i = 1; i < buttonTypes.length; i++) {
                if (buttonTypes[i] !== buttonTypes[i - 1]) {
                  transitions++;
                }
              }
              // Max transitions for 3 button types is 2 (e.g., QR -> URL -> CALL)
              return transitions <= 2;
            };
            
            const disableQuickReply = !wouldMaintainGrouping('QUICK_REPLY') || currentQuickReplyCount >= 10;
            const disableUrl = !wouldMaintainGrouping('URL') || urlCount >= 2;
            const disablePhone = !wouldMaintainGrouping('PHONE_NUMBER') || phoneCount >= 1;

            return (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">Button {index + 1}</Label>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        title="Swap with previous button"
                        onClick={() => swapButtons(index, index - 1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === component.buttons.length - 1}
                        title="Swap with next button"
                        onClick={() => swapButtons(index, index + 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeButton(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor={`btn-type-${index}`}>Button Type</Label>
                        <Select value={button.type} onValueChange={(value) => {
                           const currentText = 'text' in button ? (button as any).text : '';
                           if (value === 'URL') updateButton(index, { type: 'URL', text: currentText, url: '' });
                           else if (value === 'PHONE_NUMBER') updateButton(index, { type: 'PHONE_NUMBER', text: currentText, phone_number: '' });
                           else if (value === 'QUICK_REPLY') updateButton(index, { type: 'QUICK_REPLY', text: currentText });
                        }}>
                           <SelectTrigger id={`btn-type-${index}`}><SelectValue/></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="QUICK_REPLY" disabled={disableQuickReply}>Quick Reply</SelectItem>
                               <SelectItem value="URL" disabled={disableUrl}>Visit Website (URL)</SelectItem>
                               <SelectItem value="PHONE_NUMBER" disabled={disablePhone}>Call Phone Number</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>

                    {'text' in button && (
                        <div className="space-y-2">
                            <Label htmlFor={`btn-text-${index}`}>Button Text</Label>
                            <Input id={`btn-text-${index}`} placeholder="Eg. View details" value={(button as any).text} onChange={e => updateButton(index, {...(button as any), text: e.target.value})} />
                            {errors[`button_${pIndex}_${index}_text`] && <p className="text-sm text-destructive mt-1">{errors[`button_${pIndex}_${index}_text`]}</p>}
                        </div>
                    )}
                </div>
                
                {button.type === 'URL' && (() => {
                    const isDynamic = button.url.endsWith('{{1}}');
                    const baseUrl = isDynamic ? button.url.slice(0, -5) : button.url;

                    return (
                      <div className="space-y-3">
                        <Select
                          value={isDynamic ? "dynamic" : "static"}
                          onValueChange={(value) => {
                            const newUrl =
                              value === "dynamic"
                                ? "https://example.com/{{1}}"
                                : "https://example.com";
                            const newExample =
                              value === "dynamic"
                                ? ["example-value"]
                                : undefined;
                            updateButton(index, {
                              ...button,
                              url: newUrl,
                              example: newExample,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="static">Static URL</SelectItem>
                            <SelectItem value="dynamic">Dynamic URL</SelectItem>
                          </SelectContent>
                        </Select>

                        {!isDynamic ? (
                          <div>
                            <Input
                              placeholder="https://example.com"
                              value={button.url}
                              onChange={(e) =>
                                updateButton(index, {
                                  ...button,
                                  url: e.target.value,
                                })
                              }
                            />
                            {errors[`button_${pIndex}_${index}_url`] && <p className="text-sm text-destructive mt-1">{errors[`button_${pIndex}_${index}_url`]}</p>}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>URL Structure</Label>
                            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                              <Input
                                className="bg-background"
                                placeholder="Base URL"
                                value={baseUrl}
                                onChange={(e) =>
                                  updateButton(index, {
                                    ...button,
                                    url: e.target.value.replace(/\/+$/, '') + "/{{1}}",
                                  })
                                }                                
                              />
                              <span className="p-2 bg-muted rounded-md text-muted-foreground text-sm font-mono shrink-0">{`{{1}}`}</span>
                            </div>
                            <div className="pt-2 space-y-2">
                              <Label>Example Value for {`{{1}}`}</Label>
                              <Input
                                placeholder="e.g., product-123"
                                onChange={(e) =>
                                  updateButton(index, {
                                    ...button,
                                    example: [e.target.value],
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {button.type === 'PHONE_NUMBER' && (
                    <div className="mt-4 space-y-2">
                        <Label>Phone Number</Label>
                        <Input placeholder="Enter a valid phone number" value={button.phone_number} onChange={e => updateButton(index, {...button, phone_number: e.target.value})} />
                        {errors[`button_${pIndex}_${index}_phone`] && <p className="text-sm text-destructive mt-1">{errors[`button_${pIndex}_${index}_phone`]}</p>}
                    </div>
                )}
              </Card>
            );
          })}
        </CardContent>}
      </Card>
    );
  };

  return (
    <div className="p-4 sm:p-8">
      <Card className="max-w-4xl mx-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">{dict.loading.creatingTemplate}</p>
              <p className="text-sm text-muted-foreground">{dict.loading.pleaseWait}</p>
            </div>
          </div>
        )}
        <CardHeader>
          <CardTitle>{dict.title}</CardTitle>
          <CardDescription>
            {dict.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-6 space-y-2">
                <Label htmlFor="template-name">{dict.templateName}</Label>
                <Input
                  id="template-name"
                  placeholder={dict.templateNamePlaceholder}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value.replace(/[^a-z0-9_]/g, ""));
                    // Clear API errors when user makes changes
                    if (apiErrors.length > 0) {
                      setApiErrors([]);
                    }
                  }}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  {dict.templateNameHelp}
                </p>
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>
              <div className="col-span-3 space-y-2">
                <Label htmlFor="template-language">{dict.language}</Label>
                <Select value={language} onValueChange={(value) => {
                  setLanguage(value);
                  // Clear API errors when user makes changes
                  if (apiErrors.length > 0) {
                    setApiErrors([]);
                  }
                }} disabled={isLoading}>
                  <SelectTrigger id="template-language">
                    <SelectValue placeholder={dict.languagePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name} ({lang.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.language && <p className="text-sm text-destructive mt-1">{errors.language}</p>}
              </div>
              <div className="col-span-3 space-y-2">
                <Label htmlFor="template-category">{dict.category}</Label>
                <Select value={category} onValueChange={handleCategoryChange} disabled={isLoading}>
                  <SelectTrigger id="template-category">
                    <SelectValue placeholder={dict.categoryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">{dict.categories.marketing}</SelectItem>
                    <SelectItem value="UTILITY">{dict.categories.utility}</SelectItem>
                    <SelectItem value="AUTHENTICATION">
                      {dict.categories.authentication}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
              </div>
            </div>
          </div>

          <Separator />

          {category !== "AUTHENTICATION" ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{dict.components}</h3>
                <div className="flex items-center gap-2">
                  {!components.some((c) => c.type === "HEADER") && (
                    <Button variant="outline" onClick={() => addComponent("HEADER")} disabled={isLoading}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {dict.addHeader}
                    </Button>
                  )}
                  {!components.some((c) => c.type === "FOOTER") && (
                    <Button variant="outline" onClick={() => addComponent("FOOTER")} disabled={isLoading}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {dict.addFooter}
                    </Button>
                  )}
                  {!components.some((c) => c.type === "BUTTONS") && (
                    <Button variant="outline" onClick={() => addComponent("BUTTONS")} disabled={isLoading}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {dict.addButtons}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {components.map((component, index) => {
                  switch (component.type) {
                    case "HEADER":
                      return <HeaderComponentEditor key={index} component={component as HeaderComponent} index={index} updateComponent={updateComponent} removeComponent={removeComponent} onFileUpload={onFileUpload} errors={errors} />;
                    case "BODY":
                      return renderBody(component as BodyComponent, index);
                    case "FOOTER":
                      return renderFooter(component as FooterComponent, index);
                    case "BUTTONS":
                      return renderButtons(
                        component as ButtonsComponent,
                        index
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          ) : (
            <AuthenticationTemplateForm onChange={handleAuthFormChange} dictionary={dict} />
          )}

          {/* Meta Validation Alert - Show API errors and user-facing errors */}
          {(apiErrors.length > 0 || userErrors.length > 0 || userWarnings.length > 0) && (
            <Alert variant={apiErrors.length > 0 || userErrors.length > 0 ? "destructive" : "default"}>
              {apiErrors.length > 0 || userErrors.length > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {apiErrors.length > 0 || userErrors.length > 0 ? dict.validation.pleaseFixIssues : dict.validation.templateSuggestions}
                  </div>
                  <div className="space-y-1">
                    {/* API Errors */}
                    {apiErrors.map((error, index) => (
                      <div key={`api-error-${index}`} className="text-sm text-red-600 dark:text-red-400">
                        • {error}
                      </div>
                    ))}
                    {/* Validation Errors */}
                    {userErrors.map((error, index) => (
                      <div key={`validation-error-${index}`} className="text-sm">
                        • {error.message}
                      </div>
                    ))}
                    {/* Warnings */}
                    {userWarnings.map((warning, index) => (
                      <div key={`warning-${index}`} className="text-sm">
                        • {warning.message}
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {isValid && apiErrors.length === 0 && userErrors.length === 0 && userWarnings.length === 0 && name && language && category && (
            category === "AUTHENTICATION" 
              ? authComponents.some(c => c.type === 'BODY')
              : components.some(c => c.type === 'BODY' && c.text && c.text.trim())
          ) && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {dict.validation.templateStructureGood}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {dict.cancel}
          </Button>
          <Button 
            variant="success" 
            onClick={handleSubmit} 
            disabled={userErrors.length > 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {dict.loading.creatingTemplate}
              </>
            ) : (
              dict.createTemplate
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateTemplateUI;


