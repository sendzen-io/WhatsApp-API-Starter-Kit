"use client";

import React, { useState, useCallback, useEffect } from "react";
import type {
  CreateTemplatePayload,
  HeaderComponent,
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
import { PlusCircle, Trash2, ChevronUp, ChevronDown } from "lucide-react";
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

interface CreateTemplateUIProps {
  onCancel: () => void;
  onSubmit: (template: CreateTemplatePayload) => void;
  dictionary?: any; // Add a proper dictionary type later
  onFileUpload?: (file: File) => Promise<string>;
}

const CreateTemplateUI: React.FC<CreateTemplateUIProps> = ({
  onCancel,
  onSubmit,
  dictionary,
  onFileUpload,
}) => {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState<
    "MARKETING" | "UTILITY" | "AUTHENTICATION"
  >("MARKETING");

  const [components, setComponents] = useState<TemplateComponent[]>([
    { type: "body", text: "" },
  ]);
  const [authComponents, setAuthComponents] = useState<AuthTemplateComponent[]>(
    []
  );
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [isSubmittedOnce, setIsSubmittedOnce] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const handleCategoryChange = (
    value: "MARKETING" | "UTILITY" | "AUTHENTICATION"
  ) => {
    setCategory(value);
    if (value === "AUTHENTICATION") {
      setComponents([]);
      setAuthComponents([{ type: "body" }]);
    } else {
      setComponents([{ type: "body", text: "" }]);
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

  const addComponent = (type: "header" | "footer" | "buttons") => {
    const hasComponent = components.some((c) => c.type === type);
    if (hasComponent) return;

    let newComponent: TemplateComponent;

    switch (type) {
      case "header":
        newComponent = { type: "header", format: "text", text: "" };
        // Add header to the beginning
        setComponents((prev) => [newComponent, ...prev]);
        break;
      case "footer":
        newComponent = { type: "footer", text: "" };
        const bodyIndex = components.findIndex((c) => c.type === "body");
        setComponents((prev) => [
          ...prev.slice(0, bodyIndex + 1),
          newComponent,
          ...prev.slice(bodyIndex + 1),
        ]);
        break;
      case "buttons":
        newComponent = { type: "buttons", buttons: [] };
        setComponents((prev) => [...prev, newComponent]);
        break;
    }
  };

  const removeComponent = (index: number) => {
    if (components[index].type === "body") return; // Body is required
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
      if (!authComponents.some(c => c.type === 'body')) {
        newErrors.auth_body = "Authentication templates must have a body component.";
      }
    } else {
      const bodyComponent = components.find(c => c.type === 'body') as BodyComponent;
      if (!bodyComponent || !bodyComponent.text) {
        newErrors.body_0 = "Body text is required.";
      }

      components.forEach((component, index) => {
        switch (component.type) {
          case "header":
              if (component.format === "text" && component.text.length > 60) {
                newErrors[`header_${index}`] = "Header text cannot exceed 60 characters.";
              }
              break;
          case "body":
            if (component.text.length > 1024) {
              newErrors[`body_${index}`] = "Body text cannot exceed 1024 characters.";
            }
            break;
          case "footer":
            if (component.text.length > 60) {
              newErrors[`footer_${index}`] = "Footer text cannot exceed 60 characters.";
            }
            break;
          case "buttons":
            if (component.buttons.length === 0) {
              newErrors[`buttons_${index}`] = "Add at least one button or remove the Buttons component.";
            } else if (component.buttons.length > 10) {
              newErrors[`buttons_${index}`] = "You can add a maximum of 10 buttons.";
            }
            
            const buttonTypes = component.buttons.map(b => b.type === 'quick_reply' ? 'QR' : 'OTHER');
            let transitions = 0;
            for (let i = 1; i < buttonTypes.length; i++) {
              if (buttonTypes[i] !== buttonTypes[i - 1]) {
                transitions++;
              }
            }
            if (transitions > 1) {
              newErrors[`buttons_${index}`] = "Invalid button order. Quick Reply buttons must be grouped together.";
            }
            
            component.buttons.forEach((button, btnIndex) => {
              if ('text' in button && !button.text) {
                newErrors[`button_${index}_${btnIndex}_text`] = "Button text is required.";
              } else if ('text' in button && button.text.length > 25) {
                newErrors[`button_${index}_${btnIndex}_text`] = "Button text cannot exceed 25 characters.";
              }

              if (button.type === "url") {
                if (!button.url) {
                  newErrors[`button_${index}_${btnIndex}_url`] = "URL is required.";
                } else if (button.url.length > 2000) {
                  newErrors[`button_${index}_${btnIndex}_url`] = "URL cannot exceed 2000 characters.";
                }
              } else if (button.type === "phone_number") {
                if (!button.phone_number) {
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

  const handleSubmit = () => {
    setIsSubmittedOnce(true);
    const newErrors = validate();
    const isValid = Object.keys(newErrors).length === 0;
    setErrors(newErrors);

    if (!isValid) {
      return;
    }

    if (category === "MARKETING" || category === "UTILITY") {
      const body = components.find((c) => c.type === "body") as BodyComponent;
      if (!body || !body.text) {
        // This case is handled by validateComponents, but as a fallback:
        alert("Body text is required.");
        return;
      }
    }

    switch (category) {
      case "MARKETING":
        onSubmit({ name, language, category, components });
        break;
      case "UTILITY":
        onSubmit({ name, language, category, components });
        break;
      case "AUTHENTICATION":
        onSubmit({ name, language, category, components: authComponents });
        break;
    }
  };

  const handleAuthFormChange = useCallback((newAuthComponents: AuthTemplateComponent[], isValid: boolean) => {
    setAuthComponents(newAuthComponents);
    // You might want to use the `isValid` flag to control the submit button's state
    // For now, we'll just update the components and let the main validation handle it
  }, []);

  const renderBody = (component: BodyComponent, index: number) => {
    const handleBodyChange = (newText: string) => {
      const foundVariables = Array.from(
        new Set(newText.match(/{{\w+}}/g) || [])
      ).map((v) => v.replace(/{|}/g, ""));

      const existingExamples = component.example?.body_text_named_params || [];
      const newExamples = foundVariables.map((name) => {
        const existing = existingExamples.find((ex) => ex.param_name === name);
        return existing || { param_name: name, example: "" };
      });

      const updatedComponent: BodyComponent = {
        ...component,
        text: newText,
        example: {
          ...component.example,
          body_text_named_params: newExamples,
        },
      };

      if (newExamples.length === 0) {
        delete updatedComponent.example?.body_text_named_params;
        if (
          updatedComponent.example &&
          Object.keys(updatedComponent.example).length === 0
        ) {
          delete updatedComponent.example;
        }
      }

      updateComponent(index, updatedComponent);
    };

    const handleExampleChange = (param_name: string, value: string) => {
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
    };

    return (
        <Card key={index}>
            <CardHeader>
                <CardTitle>Body</CardTitle>
                <CardDescription>The main message content. Use named variables like {`{{variable_name}}`}. (Required)</CardDescription>
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
                />
                <p className="text-sm text-muted-foreground mt-1">Max length: {component.text.length}/1024 characters</p>
                {errors[`body_${index}`] && <p className="text-sm text-destructive mt-1">{errors[`body_${index}`]}</p>}
                {(component.example?.body_text_named_params && component.example.body_text_named_params.length > 0) && (
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
          placeholder="Enter footer text"
          value={component.text}
          onChange={(e) =>
            updateComponent(index, { ...component, text: e.target.value })
          }
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
      if (type === "url") newButton = { type: "url", text: "", url: "" };
      else if (type === "phone_number")
        newButton = { type: "phone_number", text: "", phone_number: "" };
      else newButton = { type: "quick_reply", text: "" };
      updateButtons([...component.buttons, newButton]);
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
      newButtons[index1] = newButtons[index2];
      newButtons[index2] = temp;
      updateButtons(newButtons);
    };

    const hasQuickReply = component.buttons.some(
      (b) => b.type === "quick_reply"
    );
    const hasUrl = component.buttons.some((b) => b.type === "url");
    const hasPhone = component.buttons.some((b) => b.type === "phone_number");
    const quickReplyCount = component.buttons.filter(
      (b) => b.type === "quick_reply"
    ).length;
    const urlCount = component.buttons.filter((b) => b.type === "url").length;
    const phoneCount = component.buttons.filter(
      (b) => b.type === "phone_number"
    ).length;

    return (
      <Card key={pIndex}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Buttons</CardTitle>
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
                    onClick={() => addButton("quick_reply")}
                    disabled={quickReplyCount >= 10 || component.buttons.length >= 10}
                  >
                    Quick Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => addButton("url")}
                    disabled={urlCount >= 2 || component.buttons.length >= 10}
                  >
                    Visit Website
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => addButton("phone_number")}
                    disabled={phoneCount >= 1 || component.buttons.length >= 10}
                  >
                    Call Phone Number
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

            const disableQuickReply =
              otherButtons.some(
                (b) => b.type === "url" || b.type === "phone_number"
              ) ||
              (component.buttons.filter((b) => b.type === "quick_reply")
                .length >= 3 &&
                button.type !== "quick_reply");

            const disableUrl =
              otherButtons.some((b) => b.type === "quick_reply") ||
              otherButtons.some((b) => b.type === "url");

            const disablePhone =
              otherButtons.some((b) => b.type === "quick_reply") ||
              otherButtons.some((b) => b.type === "phone_number");

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
                           if (value === 'url') updateButton(index, { type: 'url', text: currentText, url: '' });
                           else if (value === 'phone_number') updateButton(index, { type: 'phone_number', text: currentText, phone_number: '' });
                           else if (value === 'quick_reply') updateButton(index, { type: 'quick_reply', text: currentText });
                        }}>
                           <SelectTrigger id={`btn-type-${index}`}><SelectValue/></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="quick_reply" disabled={disableQuickReply}>Quick Reply</SelectItem>
                               <SelectItem value="url" disabled={disableUrl}>Visit Website (URL)</SelectItem>
                               <SelectItem value="phone_number" disabled={disablePhone}>Call Phone Number</SelectItem>
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
                
                {button.type === 'url' && (() => {
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

                {button.type === 'phone_number' && (
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
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Template</CardTitle>
          <CardDescription>
            Fill in the details to create a new message template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g. order_confirmation"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-z0-9_]/g, ""))}
              />
              <p className="text-sm text-muted-foreground">
                Lowercase letters, numbers, and underscores only.
              </p>
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="template-language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="template-language">
                    <SelectValue placeholder="Select a language" />
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
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="template-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="UTILITY">Utility</SelectItem>
                    <SelectItem value="AUTHENTICATION">
                      Authentication
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {category !== "AUTHENTICATION" ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Components</h3>
                <div className="flex items-center gap-2">
                  {!components.some((c) => c.type === "header") && (
                    <Button variant="outline" onClick={() => addComponent("header")}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Header
                    </Button>
                  )}
                  {!components.some((c) => c.type === "footer") && (
                    <Button variant="outline" onClick={() => addComponent("footer")}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Footer
                    </Button>
                  )}
                  {!components.some((c) => c.type === "buttons") && (
                    <Button variant="outline" onClick={() => addComponent("buttons")}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Buttons
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {components.map((component, index) => {
                  switch (component.type) {
                    case "header":
                      return <HeaderComponentEditor key={index} component={component as HeaderComponent} index={index} updateComponent={updateComponent} removeComponent={removeComponent} onFileUpload={onFileUpload} errors={errors} />;
                    case "body":
                      return renderBody(component as BodyComponent, index);
                    case "footer":
                      return renderFooter(component as FooterComponent, index);
                    case "buttons":
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
            <AuthenticationTemplateForm onChange={handleAuthFormChange} />
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit} disabled={!isFormValid}>
            Create Template
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateTemplateUI;
