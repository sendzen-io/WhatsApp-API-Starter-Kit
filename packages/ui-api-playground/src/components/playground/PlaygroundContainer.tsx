'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import NextImage from 'next/image';
import { Button } from '@workspace/ui-core/components/button';
import { Input } from '@workspace/ui-core/components/input';
import { Label } from '@workspace/ui-core/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui-core/components/select';
import { Checkbox } from '@workspace/ui-core/components/checkbox';
import { Textarea } from '@workspace/ui-core/components/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@workspace/ui-core/components/accordion';
import { Badge } from '@workspace/ui-core/components/badge';
import { Box, BoxContent, BoxDescription, BoxHeader, BoxTitle } from '@workspace/ui-core/components/box';
import { Skeleton } from '@workspace/ui-core/components/skeleton';
import { Copy, Check, ChevronDown, Code, Settings, User, MessageSquare, Phone, Play, FileText, Terminal, Clipboard, ChevronLeft, ChevronRight, Archive, Code2, CodeIcon, Airplay, ArchiveIcon, Loader2, AlertCircle, RefreshCw, Image, Video, FileText as FileTextIcon, ExternalLink, Copy as CopyIcon } from 'lucide-react';
import SyntaxHighlighter from './SyntaxHighlighter';
import { PlaygroundContainerProps, MessageTemplate } from '../../types/services';

// Use the MessageTemplate interface from types
type FacebookTemplate = MessageTemplate;

interface WABAOption {
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

interface PlaygroundConfig {
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

// Skeleton Components for Playground Loading States
const FacebookTemplatesSkeleton = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TemplateDetailsSkeleton = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-20 w-full" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </div>
);


const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript (Node.js)', icon: '🟨' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'php', label: 'PHP', icon: '🐘' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'csharp', label: 'C# (.NET)', icon: '🔷' },
  { value: 'ruby', label: 'Ruby', icon: '💎' },
  { value: 'go', label: 'Go', icon: '🐹' },
  { value: 'curl', label: 'cURL', icon: '🌐' },
];

// WABA options will be loaded dynamically from the API

// Media file extension validation constants
const ALLOWED_EXTENSIONS = {
  IMAGE: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
  VIDEO: ['mp4', 'mov', 'avi', 'mkv', '3gp'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx']
};

// Media validation functions
const getFileExtension = (url: string): string => {
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

const validateMediaUrl = (url: string, mediaType: string): { isValid: boolean; error?: string } => {
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

// Facebook-style Template Preview Component
const WhatsAppTemplatePreview = ({ 
  template, 
  placeholders, 
  getProcessedMessageContent,
  showDetailed = true
}: { 
  template: FacebookTemplate | undefined;
  placeholders: Record<string, string>;
  getProcessedMessageContent: () => string;
  showDetailed?: boolean;
}) => {
  if (!template) return null;

  const getMediaIcon = (format: string) => {
    switch (format?.toLowerCase()) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileTextIcon className="h-4 w-4" />;
      default: return <FileTextIcon className="h-4 w-4" />;
    }
  };

  const renderHeader = () => {
    const headerComponent = template.components.find(c => c.type === 'HEADER');
    if (!headerComponent) return null;

    if (headerComponent.format === 'TEXT' && headerComponent.text) {
      // Text header
      const headerText = headerComponent.text
        .replace(/\{\{(\d+)\}\}/g, (match, num) => {
          const placeholderKey = `header_param_${num}`;
          return placeholders[placeholderKey] || match;
        })
        .replace(/\{\{([A-Za-z_][\w]*)\}\}/g, (match, name) => {
          const placeholderKey = `header_param_${name}`;
          return placeholders[placeholderKey] || match;
        });

      return (
        <div className="p-3 pb-2">
          <div className="text-sm font-semibold text-foreground">{headerText}</div>
        </div>
      );
    } else if (headerComponent.format && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format)) {
      // Media header
      const mediaUrl = placeholders['header_media_url'] || 
                      headerComponent.example?.header_handle?.[0] || 
                      `https://via.placeholder.com/300x200/25D366/FFFFFF?text=${headerComponent.format}`;

      return (
        <div className="relative">
          <div className="aspect-video bg-gray-200 flex items-center justify-center rounded-t-lg">
            {headerComponent.format === 'IMAGE' ? (
              <NextImage 
                src={mediaUrl} 
                alt="Template media" 
                fill
                className="object-cover rounded-t-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.nextElementSibling) {
                    target.nextElementSibling.classList.remove('hidden');
                    target.nextElementSibling.classList.add('flex', 'items-center', 'justify-center');
                  }
                }}
              />
            ) : headerComponent.format === 'VIDEO' ? (
              <video 
                src={mediaUrl} 
                className="w-full h-full object-cover rounded-t-lg"
                controls={false}
                onError={(e) => {
                  const target = e.target as HTMLVideoElement;
                  target.style.display = 'none';
                  if (target.nextElementSibling) {
                    target.nextElementSibling.classList.remove('hidden');
                    target.nextElementSibling.classList.add('flex', 'items-center', 'justify-center');
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-t-lg">
                <FileTextIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="hidden absolute inset-0 bg-gray-100 rounded-t-lg">
              <div className="text-center">
                {getMediaIcon(headerComponent.format)}
                <div className="text-sm text-gray-500 mt-1">
                  {headerComponent.format?.toLowerCase()} preview
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderBody = () => {
    const bodyComponent = template.components.find(c => c.type === 'BODY');
    if (!bodyComponent?.text) return null;

    const bodyText = bodyComponent.text
      .replace(/\{\{(\d+)\}\}/g, (match, num) => {
        const placeholderKey = `body_param_${num}`;
        return placeholders[placeholderKey] || match;
      })
      .replace(/\{\{([A-Za-z_][\w]*)\}\}/g, (match, name) => {
        const placeholderKey = `body_param_${name}`;
        return placeholders[placeholderKey] || match;
      });

    return (
      <div className="px-3 pb-2">
        <div className="mt-3 text-sm whitespace-pre-wrap leading-relaxed text-foreground">
          {bodyText.split(/(\{\{[^}]+\}\})/).map((part, index) => {
            if (part.startsWith('{{') && part.endsWith('}}')) {
              return (
                <span key={index} className="bg-yellow-100 text-yellow-800 px-1 rounded text-sm">
                  {part}
                </span>
              );
            }
            return part;
          })}
        </div>
      </div>
    );
  };

  const renderButtons = () => {
    const buttonComponent = template.components.find(c => c.type === 'BUTTONS');
    if (!buttonComponent?.buttons) return null;

    return (
      <div className="px-0">
        {/* Separator line above buttons */}
        <div className="border-t border-border"></div>
        
        {buttonComponent.buttons.map((button, index) => {
          let buttonText = button.text;
          let buttonUrl = button.url;
          let buttonPhone = button.phone_number;

          // Replace dynamic parameters in button text/URL/phone
          if (buttonText) {
            buttonText = buttonText
              .replace(/\{\{(\d+)\}\}/g, (match, num) => {
                const placeholderKey = `button_${index}_param_${num}`;
                return placeholders[placeholderKey] || match;
              })
              .replace(/\{\{([A-Za-z_][\w]*)\}\}/g, (match, name) => {
                const placeholderKey = `button_${index}_param_${name}`;
                return placeholders[placeholderKey] || match;
              });
          }

          if (buttonUrl) {
            buttonUrl = buttonUrl
              .replace(/\{\{(\d+)\}\}/g, (match, num) => {
                const placeholderKey = `button_${index}_param_${num}`;
                return placeholders[placeholderKey] || match;
              })
              .replace(/\{\{([A-Za-z_][\w]*)\}\}/g, (match, name) => {
                const placeholderKey = `button_${index}_param_${name}`;
                return placeholders[placeholderKey] || match;
              });
          }

          if (buttonPhone) {
            buttonPhone = buttonPhone
              .replace(/\{\{(\d+)\}\}/g, (match, num) => {
                const placeholderKey = `button_${index}_param_${num}`;
                return placeholders[placeholderKey] || match;
              })
              .replace(/\{\{([A-Za-z_][\w]*)\}\}/g, (match, name) => {
                const placeholderKey = `button_${index}_param_${name}`;
                return placeholders[placeholderKey] || match;
              });
          }

          return (
            <div key={index}>
              {/* Button with separator line */}
              <button
                className="flex justify-center w-full items-center gap-3 px-3 py-3 text-sm font-medium transition-colors hover:bg-muted/50 text-blue-600"
              >
                <span>{buttonText}</span>
              </button>
              
              {/* Separator line between buttons (except for last button) */}
              {index < (buttonComponent.buttons?.length || 0) - 1 && (
                <div className="border-t border-border"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!showDetailed) {
    // Simple preview - just show the text content
    return (
      <div className="border rounded-lg shadow-sm overflow-hidden bg-background border-border">
        <div className="p-3">
          <div className="text-sm whitespace-pre-wrap text-foreground">
            {getProcessedMessageContent().split(/(\{\{[^}]+\}\})/).map((part, index) => {
              if (part.startsWith('{{') && part.endsWith('}}')) {
                return (
                  <span key={index} className="bg-yellow-100 text-yellow-800 px-1 rounded text-sm">
                    {part}
                  </span>
                );
              }
              return part;
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden bg-background border-border">
      {/* Template content */}
      {renderHeader()}
      {renderBody()}
      {renderButtons()}
      
      {/* Timestamp */}
      <div className="px-3 pb-3 text-right">
        <span className="text-sm text-muted-foreground">
          10:47
        </span>
      </div>
    </div>
  );
};

// Facebook Templates will be fetched dynamically

// Template content will be fetched based on apiEndpoint configuration

export default function PlaygroundContainer({ 
  wabaService, 
  templateService,
  apiEndpoint = 'facebook' // Default to Facebook Graph API for API Playground
}: PlaygroundContainerProps) {
  const [config, setConfig] = useState<PlaygroundConfig>({
    accessToken: '',
    recipientPhone: '+',
    selectedBusiness: '',
    selectedWaba: '',
    selectedTemplate: '',
    messageContent: '',
    templatePlaceholders: {},
    wabaId: '',
    phoneNumberId: '',
    isSessionMessage: false,
    sessionMessageText: '',
    sessionMessagePreviewUrl: false,
  });

  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [copied, setCopied] = useState(false);
  const [facebookTemplates, setFacebookTemplates] = useState<FacebookTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [wabaOptions, setWabaOptions] = useState<WABAOption[]>([]);
  const [wabaLoading, setWabaLoading] = useState(false);
  const [wabaError, setWabaError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [projectApiKeyCache, setProjectApiKeyCache] = useState<Record<string, string>>({});
  const autoSelectEnabledRef = useRef(true); // Track if we should auto-select first template
  
  // New state for step-by-step flow (API Playground only)
  const [businesses, setBusinesses] = useState<Array<{id: string, name: string}>>([]);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [businessesError, setBusinessesError] = useState<string | null>(null);
  const [wabasForBusiness, setWabasForBusiness] = useState<Array<{
    wabaId: string;
    wabaBusinessName: string;
    phoneNumbers: Array<{
      phoneNumberId: string;
      phoneNumber: string;
      numberStatus: string;
    }>;
  }>>([]);
  const [wabasForBusinessLoading, setWabasForBusinessLoading] = useState(false);
  const [wabasForBusinessError, setWabasForBusinessError] = useState<string | null>(null);

  // Helper function to get API key for a project (with caching)
  const getProjectApiKey = useCallback(async (projectId: string): Promise<string> => {
    if (projectApiKeyCache[projectId]) {
      return projectApiKeyCache[projectId];
    }
    
    try {
      const apiKeyData = await wabaService.getAPIKey(projectId);
      const apiKey = apiKeyData.apiKey;
      
      // Cache the API key
      setProjectApiKeyCache(prev => ({
        ...prev,
        [projectId]: apiKey
      }));
      
      return apiKey;
    } catch (error) {
      console.warn(`Failed to fetch API key for project ${projectId}:`, error);
      return '';
    }
  }, [projectApiKeyCache, wabaService]);

  // Fetch businesses (API Playground only)
  const fetchBusinesses = useCallback(async () => {
    if (apiEndpoint !== 'facebook' || !config.accessToken) {
      return;
    }

    setBusinessesLoading(true);
    setBusinessesError(null);

    try {
      if (wabaService.getBusinesses) {
        const businessesList = await wabaService.getBusinesses(config.accessToken);
        setBusinesses(businessesList);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setBusinessesError(error instanceof Error ? error.message : 'Failed to fetch businesses');
      setBusinesses([]);
    } finally {
      setBusinessesLoading(false);
    }
  }, [config.accessToken, apiEndpoint, wabaService]);

  // Fetch WABAs for selected business (API Playground only)
  const fetchWABAsForBusiness = useCallback(async (businessId: string) => {
    if (apiEndpoint !== 'facebook' || !config.accessToken) {
      return;
    }

    setWabasForBusinessLoading(true);
    setWabasForBusinessError(null);

    try {
      if (wabaService.getWABAsForBusiness) {
        const wabasList = await wabaService.getWABAsForBusiness(businessId, config.accessToken);
        setWabasForBusiness(wabasList);
      }
    } catch (error) {
      console.error('Error fetching WABAs for business:', error);
      setWabasForBusinessError(error instanceof Error ? error.message : 'Failed to fetch WABAs');
      setWabasForBusiness([]);
    } finally {
      setWabasForBusinessLoading(false);
    }
  }, [config.accessToken, apiEndpoint, wabaService]);

  // Fetch WABA details and API keys
  // Optimized to fetch API key once per project instead of per phone number
  const fetchWABADetails = useCallback(async () => {
    setWabaLoading(true);
    setWabaError(null);

    try {
      // For API Playground (Facebook Graph API), require access token
      if (apiEndpoint === 'facebook' && !config.accessToken) {
        setWabaError('Facebook Access Token is required');
        setWabaLoading(false);
        return;
      }

      // Fetch WABA details (pass access token for API playground, ignored in product)
      const wabaDetails = await wabaService.getWABADetails(config.accessToken);
      
      // Transform WABA details into options
      const options: WABAOption[] = [];
      const newApiKeys: Record<string, string> = {};
      const projectApiKeys: Record<string, string> = {}; // Cache API keys per project

      for (const project of wabaDetails.projects) {
        // Fetch API key once per project (not per phone number)
        let projectApiKey = '';
        
        // Check if we already have this project's API key cached
        if (projectApiKeyCache[project.projectId]) {
          projectApiKey = projectApiKeyCache[project.projectId] || '';
        } else {
          try {
            const apiKeyData = await wabaService.getAPIKey(project.projectId);
            projectApiKey = apiKeyData.apiKey;
            projectApiKeys[project.projectId] = projectApiKey;
            // Cache the API key for future use
            setProjectApiKeyCache(prev => ({
              ...prev,
              [project.projectId]: projectApiKey
            }));
          } catch (error) {
            console.warn(`Failed to fetch API key for project ${project.projectId}:`, error);
          }
        }

        for (const waba of project.wabas) {
          for (const phoneNumber of waba.phoneNumbers) {
            const optionValue = `${project.projectId}-${waba.wabaId}-${phoneNumber.phoneNumberId}`;
            
            options.push({
              value: optionValue,
              label: `🏢 ${waba.wabaBusinessName} (${phoneNumber.phoneNumber})`,
              businessName: waba.wabaBusinessName,
              phone: phoneNumber.phoneNumber,
              status: phoneNumber.numberStatus || 'unknown',
              templates: 0, // Will be updated when templates are fetched
              wabaId: waba.wabaId,
              phoneId: phoneNumber.phoneNumberId,
              projectId: project.projectId,
              projectName: project.projectName,
              setupMode: waba.setupMode
            });

            // Use the cached project API key for all phone numbers in this project
            newApiKeys[optionValue] = projectApiKey;
          }
        }
      }

      setWabaOptions(options);
      setApiKeys(newApiKeys);

      // Auto-select first WABA if none selected
      if (options.length > 0 && !config.selectedWaba) {
        const firstOption = options[0];
        if (firstOption) {
          setConfig(prev => ({
            ...prev,
            selectedWaba: firstOption.value,
            wabaId: firstOption.wabaId,
            accessToken: newApiKeys[firstOption.value] || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching WABA details:', error);
      setWabaError(error instanceof Error ? error.message : 'Failed to fetch WABA details');
      setWabaOptions([]);
    } finally {
      setWabaLoading(false);
    }
  }, [config.selectedWaba, config.accessToken, apiEndpoint, projectApiKeyCache, wabaService]);

  // Fetch message templates using Facebook Graph API
  const fetchMessageTemplates = useCallback(async () => {
    if (!config.wabaId) {
      setTemplatesError('WABA ID is required');
      return;
    }

    // For API Playground (Facebook Graph API), require access token
    if (apiEndpoint === 'facebook' && !config.accessToken) {
      setTemplatesError('Facebook Access Token is required');
      return;
    }

    setTemplatesLoading(true);
    setTemplatesError(null);

    try {
      // Use the TemplateService to fetch templates (pass access token for API playground, ignored in product)
      const templates = await templateService.getMessageTemplates(config.wabaId, config.accessToken);
      
      setFacebookTemplates(templates);
      
      // Update template count in WABA options
      setWabaOptions(prev => prev.map(option => 
        option.wabaId === config.wabaId 
          ? { ...option, templates: templates.length }
          : option
      ));
    } catch (error) {
      console.error('Error fetching message templates:', error);
      setTemplatesError(error instanceof Error ? error.message : 'Failed to fetch templates');
      setFacebookTemplates([]);
      // Clear template selection and placeholders when fetching fails
      setConfig(prev => ({
        ...prev,
        selectedTemplate: '',
        templatePlaceholders: {}
      }));
      autoSelectEnabledRef.current = true; // Reset auto-select for next fetch
    } finally {
      setTemplatesLoading(false);
    }
  }, [config.wabaId, config.accessToken, apiEndpoint, templateService]);

  // Handle template selection change
  const handleTemplateChange = useCallback((templateId: string) => {
    const template = facebookTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Extract text content from template components and collect all placeholders
    let messageContent = '';
    const newPlaceholders: Record<string, string> = {};
    
    let hasMediaHeader = false;
    
    template.components.forEach(component => {
      
      // Get body text for display
      if (component.type === 'BODY' && component.text) {
        messageContent = component.text;
      }
      
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
        newPlaceholders[key] = '1234';
      });
    }

    // Clear validation errors when template changes
    setValidationErrors({});

    setConfig(prev => ({
      ...prev,
      selectedTemplate: templateId,
      messageContent,
      templatePlaceholders: newPlaceholders
    }));
  }, [facebookTemplates]);

  // Load data on component mount and when access token changes
  useEffect(() => {
    if (apiEndpoint === 'facebook') {
      // For API Playground (Facebook Graph API), require access token
      if (config.accessToken) {
        fetchBusinesses();
      } else {
        // Clear all data when no access token
        setBusinesses([]);
        setWabasForBusiness([]);
        setWabaOptions([]);
        setFacebookTemplates([]);
        autoSelectEnabledRef.current = true; // Reset auto-select
      }
    } else {
      // For Product project (SendZen API), fetch immediately (uses existing auth)
      fetchWABADetails();
    }
  }, [config.accessToken, apiEndpoint, fetchBusinesses, fetchWABADetails]);

  // Fetch WABAs when business is selected (API Playground only)
  useEffect(() => {
    if (apiEndpoint === 'facebook' && config.selectedBusiness) {
      fetchWABAsForBusiness(config.selectedBusiness);
      // Clear previous selections
      setConfig(prev => ({
        ...prev,
        selectedWaba: '',
        selectedTemplate: '',
        wabaId: '',
        phoneNumberId: '',
        templatePlaceholders: {}
      }));
      setFacebookTemplates([]);
      autoSelectEnabledRef.current = true; // Enable auto-select for new business
    }
  }, [config.selectedBusiness, apiEndpoint, fetchWABAsForBusiness]);

  // Get selected WABA for use in effects (Product project)
  const selectedWaba = wabaOptions.find(w => w.value === config.selectedWaba);

  // Get selected WABA from new flow (API Playground)
  const selectedWabaFromBusiness = wabasForBusiness.find(w => w.wabaId === config.wabaId);

  // Load templates when WABA is selected
  useEffect(() => {
    if (config.wabaId) {
      // Clear previous template selection when WABA changes
      setConfig(prev => ({
        ...prev,
        selectedTemplate: '',
        templatePlaceholders: {}
      }));
      // Enable auto-select for new templates
      autoSelectEnabledRef.current = true;
      fetchMessageTemplates();
    }
  }, [config.wabaId, fetchMessageTemplates]);

  // Auto-select first template if none selected
  useEffect(() => {
    if (facebookTemplates.length > 0 && !config.selectedTemplate && autoSelectEnabledRef.current) {
      const firstTemplate = facebookTemplates[0];
      if (firstTemplate) {
        autoSelectEnabledRef.current = false; // Disable auto-select after first selection
        handleTemplateChange(firstTemplate.id);
      }
    }
  }, [facebookTemplates, config.selectedTemplate, handleTemplateChange]);

  // Get media type for current template
  const getCurrentMediaType = (): string => {
    const selectedTemplate = facebookTemplates.find(t => t.id === config.selectedTemplate);
    if (!selectedTemplate) return '';
    
    const headerComponent = selectedTemplate.components.find(c => c.type === 'HEADER');
    return headerComponent?.format || '';
  };

  // Handle placeholder value change with validation
  const handlePlaceholderChange = (placeholder: string, value: string) => {
    // Clear previous validation error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[placeholder];
      return newErrors;
    });

    // Clear API validation error for this field
    setApiValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[placeholder];
      return newErrors;
    });

    // Validate media URL if it's a header_media_url placeholder
    if (placeholder === 'header_media_url' && value.trim()) {
      const mediaType = getCurrentMediaType();
      if (mediaType && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(mediaType)) {
        const validation = validateMediaUrl(value, mediaType);
        if (!validation.isValid && validation.error) {
          setValidationErrors(prev => ({
            ...prev,
            [placeholder]: validation.error!
          }));
        }
      }
    }

    setConfig(prev => ({
      ...prev,
      templatePlaceholders: {
        ...prev.templatePlaceholders,
        [placeholder]: value
      }
    }));
  };

  // Get processed message content with placeholder replacements
  const getProcessedMessageContent = () => {
    let content = config.messageContent;
    Object.entries(config.templatePlaceholders).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return content;
  };

  // Generate WhatsApp Template Request JSON
  const generateTemplateRequestJSON = () => {
    const selectedTemplate = facebookTemplates.find(t => t.id === config.selectedTemplate);
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
                const value = config.templatePlaceholders[key] || match;
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
            const mediaUrl = config.templatePlaceholders['header_media_url'] || 
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
                const value = config.templatePlaceholders[key] || match;
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
                  const value = config.templatePlaceholders[key] || "123456";
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
              } else if (button.type === 'PHONE_NUMBER' && button.phone_number) {
                // Support positional and named parameters in phone number
                const phoneToken = button.phone_number.match(/\{\{([^}]+)\}\}/);
                if (phoneToken && phoneToken[1]) {
                  const inner = phoneToken[1];
                  const isNumber = /^\d+$/.test(inner);
                  const key = `button_${buttonIndex}_param_${inner}`;
                  const value = config.templatePlaceholders[key] || "+123456";
                  templateComponents.push({
                    type: "button",
                    sub_type: "phone_number",
                    index: buttonIndex,
                    parameters: [{
                      type: "text",
                      text: value,
                      ...(isNumber ? {} : { parameter_name: inner })
                    }]
                  });
                }
              } else if (button.type === 'COPY_CODE') {
                // Copy code button supports positional and named parameter in text
                const codeToken = button.text?.match(/\{\{([^}]+)\}\}/);
                if (codeToken && codeToken[1]) {
                  const inner = codeToken[1];
                  const isNumber = /^\d+$/.test(inner);
                  const key = `button_${buttonIndex}_param_${inner}`;
                  const value = config.templatePlaceholders[key] || "123456";
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
              } else if (button.type === 'QUICK_REPLY') {
                // Quick reply buttons with payload
                templateComponents.push({
                  type: "button",
                  sub_type: "quick_reply",
                  index: buttonIndex,
                  parameters: [{
                    type: "text",
                    text: "PAYLOAD"
                  }]
                });
              }
            });
          }
          break;
      }
    });

    return templateComponents.length > 0 ? templateComponents : null;
  };

  // Generate template-based request body
  const generateTemplateRequestBody = (config: PlaygroundConfig) => {
    const currentSelectedWaba = wabaOptions.find(w => w.value === config.selectedWaba);
    const selectedTemplate = facebookTemplates.find(t => t.id === config.selectedTemplate);
    const templateComponents = generateTemplateRequestJSON();

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

    const generateCode = (language: string, config: PlaygroundConfig) => {
      const endpointUrl = apiEndpoint === 'sendzen' 
        ? 'https://api.sendzen.io/v1/messages'
        : `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;
    const requestBody = generateRequestBody(config);

    switch (language) {
      case 'javascript':
        return generateJavaScriptCode(endpointUrl, requestBody, config.accessToken);
      case 'python':
        return generatePythonCode(endpointUrl, requestBody, config.accessToken);
      case 'php':
        return generatePHPCode(endpointUrl, requestBody, config.accessToken);
      case 'java':
        return generateJavaCode(endpointUrl, requestBody, config.accessToken);
      case 'csharp':
        return generateCSharpCode(endpointUrl, requestBody, config.accessToken);
      case 'ruby':
        return generateRubyCode(endpointUrl, requestBody, config.accessToken);
      case 'go':
        return generateGoCode(endpointUrl, requestBody, config.accessToken);
      case 'curl':
        return generateCurlCode(endpointUrl, requestBody, config.accessToken);
      default:
        return '// Select a programming language to generate code';
    }
  };

  const generateRequestBody = (config: PlaygroundConfig) => {
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
      const templateBody = generateTemplateRequestBody(config);
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

  // Map selected language to SyntaxHighlighter language keys
  const getSyntaxLanguage = (lang: string) => {
    if (lang === 'curl') return 'bash';
    if (lang === 'csharp') return 'csharp';
    return lang;
  };

  const generateJavaScriptCode = (url: string, body: any, token: string) => {
    const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
    return `// ${apiName} Integration - JavaScript (Node.js)
const axios = require('axios');

const sendMessage = async () => {
  try {
    const response = await axios.post('${url}', ${JSON.stringify(body, null, 4)}, {
      headers: {
        'Authorization': 'Bearer ${token}',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    throw error;
  }
};

// Call the function
sendMessage();`;
  };

  const generatePythonCode = (url: string, body: any, token: string) => {
    const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
    return `# ${apiName} Integration - Python
import requests
import json

def send_message():
    url = '${url}'
    headers = {
        'Authorization': f'Bearer ${token}',
        'Content-Type': 'application/json'
    }
    data = ${JSON.stringify(body, null, 4)}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        print('Message sent successfully:', response.json())
        return response.json()
    except requests.exceptions.RequestException as e:
        print('Error sending message:', e)
        if hasattr(e, 'response') and e.response is not None:
            print('Response:', e.response.text)
        raise

# Call the function
send_message()`;
  };

  const generatePHPCode = (url: string, body: any, token: string) => {
    const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
    return `<?php
 // ${apiName} Integration - PHP
function sendMessage() {
    $url = '${url}';
    $data = ${JSON.stringify(body, null, 4)};
    
    $options = [
        'http' => [
            'header' => [
                "Authorization: Bearer ${token}",
                "Content-Type: application/json"
            ],
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        throw new Exception('Error sending message');
    }
    
    $response = json_decode($result, true);
    echo "Message sent successfully: " . json_encode($response) . "\\n";
    return $response;
}

// Call the function
try {
    sendMessage();
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}
?>`;
  };

  const generateJavaCode = (url: string, body: any, token: string) => {
    const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
    return `// ${apiName} Integration - Java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse.BodyHandlers;
import com.fasterxml.jackson.databind.ObjectMapper;

 public class ${apiEndpoint === 'sendzen' ? 'SendZenAPI' : 'FacebookGraphAPI'} {
    private static final String API_URL = "${url}";
    private static final String ACCESS_TOKEN = "${token}";
    
    public static void main(String[] args) {
        try {
            sendMessage();
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
    
    public static void sendMessage() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String requestBody = mapper.writeValueAsString(${JSON.stringify(body, null, 8)});
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_URL))
            .header("Authorization", "Bearer " + ACCESS_TOKEN)
            .header("Content-Type", "application/json")
            .POST(BodyPublishers.ofString(requestBody))
            .build();
            
        HttpResponse<String> response = client.send(request, BodyHandlers.ofString());
        
        if (response.statusCode() == 200) {
            System.out.println("Message sent successfully: " + response.body());
        } else {
            System.err.println("Error sending message: " + response.body());
        }
    }
}`;
  };

  const generateCSharpCode = (url: string, body: any, token: string) => {
    const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
    return `// ${apiName} Integration - C# (.NET)
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

 public class ${apiEndpoint === 'sendzen' ? 'SendZenAPI' : 'FacebookGraphAPI'}
{
    private static readonly string ApiUrl = "${url}";
    private static readonly string AccessToken = "${token}";
    
    public static async Task Main(string[] args)
    {
        try
        {
            await SendMessageAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
    
    public static async Task SendMessageAsync()
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {AccessToken}");
        
        var requestBody = ${JSON.stringify(body, null, 8)};
        var json = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions { WriteIndented = true });
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        try
        {
            var response = await client.PostAsync(ApiUrl, content);
            var responseContent = await response.Content.ReadAsStringAsync();
            
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Message sent successfully: {responseContent}");
            }
            else
            {
                Console.WriteLine($"Error sending message: {responseContent}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}`;
  };

  const generateRubyCode = (url: string, body: any, token: string) => {
    const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
    return `# ${apiName} Integration - Ruby
require 'net/http'
require 'json'
require 'uri'

def send_message
  uri = URI('${url}')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri)
  request['Authorization'] = 'Bearer ${token}'
  request['Content-Type'] = 'application/json'
  request.body = ${JSON.stringify(body, null, 2)}.to_json
  
  response = http.request(request)
  
  if response.code == '200'
    puts "Message sent successfully: #{response.body}"
  else
    puts "Error sending message: #{response.body}"
  end
  
  JSON.parse(response.body)
rescue => e
  puts "Error: #{e.message}"
end

# Call the function
send_message`;
  };

  const generateGoCode = (url: string, body: any, token: string) => {
    const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
    return `// ${apiName} Integration - Go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func sendMessage() error {
    url := "${url}"
    token := "${token}"
    
    data := ${JSON.stringify(body, null, 4)}
    jsonData, err := json.Marshal(data)
    if err != nil {
        return fmt.Errorf("error marshaling data: %v", err)
    }
    
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    if err != nil {
        return fmt.Errorf("error creating request: %v", err)
    }
    
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return fmt.Errorf("error making request: %v", err)
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return fmt.Errorf("error reading response: %v", err)
    }
    
    if resp.StatusCode == http.StatusOK {
        fmt.Printf("Message sent successfully: %s\\n", string(body))
    } else {
        fmt.Printf("Error sending message: %s\\n", string(body))
    }
    
    return nil
}

func main() {
    if err := sendMessage(); err != nil {
        fmt.Printf("Error: %v\\n", err)
    }
}`;
  };

  const generateCurlCode = (url: string, body: any, token: string) => {
    const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
    return `# ${apiName} Integration - cURL
curl -X POST '${url}' \\
  -H 'Authorization: Bearer ${token}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}'`;
  };

  const handleCopyCode = async () => {
    const code = generateCode(selectedLanguage, config);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code to clipboard:', err);
    }
  };

  const [showResponse, setShowResponse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [requestDuration, setRequestDuration] = useState<number | null>(null);
  const [apiValidationErrors, setApiValidationErrors] = useState<Record<string, string>>({});
  const [showDetailedPreview, setShowDetailedPreview] = useState(true);
  
  // Refs for auto-focus functionality
  const recipientPhoneRef = useRef<HTMLInputElement>(null);
  const templateSelectRef = useRef<HTMLButtonElement>(null);
  const placeholderRefs = useRef<Record<string, HTMLInputElement>>({});

  // Validation functions for API call
  const validateMobileNumber = (phone: string): { isValid: boolean; error?: string } => {
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

  const validateTemplate = (templateId: string): { isValid: boolean; error?: string } => {
    if (!templateId.trim()) {
      return { isValid: false, error: 'Please select a message template' };
    }
    
    const template = facebookTemplates.find(t => t.id === templateId);
    if (!template) {
      return { isValid: false, error: 'Selected template not found' };
    }
    
    return { isValid: true };
  };

  const validateTemplatePlaceholders = (placeholders: Record<string, string>): { isValid: boolean; errors: Record<string, string> } => {
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

  const validateApiCall = (): { isValid: boolean; errors: Record<string, string> } => {
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
      const templateValidation = validateTemplate(config.selectedTemplate);
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

  const handleTestApiCall = async () => {
    // Clear previous validation errors
    setApiValidationErrors({});
    
    // Validate all required fields before making API call
    const validation = validateApiCall();
    if (!validation.isValid) {
      setApiValidationErrors(validation.errors);
      setShowResponse(true);
      setApiError('Please fix the validation errors below before making the API call');
      
      // Auto-focus the first field with an error
      setTimeout(() => {
        const firstErrorField = Object.keys(validation.errors)[0];
        if (firstErrorField) {
          let elementToFocus = null;
          
          // Try different selectors based on field type
          if (firstErrorField === 'recipientPhone') {
            elementToFocus = recipientPhoneRef.current;
          } else if (firstErrorField === 'selectedTemplate') {
            elementToFocus = templateSelectRef.current;
          } else if (firstErrorField === 'sessionMessageText') {
            elementToFocus = document.getElementById('session-message-text');
          } else {
            // For placeholder fields
            elementToFocus = placeholderRefs.current[firstErrorField];
          }
          
          if (elementToFocus) {
            elementToFocus.focus();
            elementToFocus.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
      
      return;
    }
    
    setIsLoading(true);
    setShowResponse(false);
    setApiError(null);
    setApiResponse(null);
    setRequestDuration(null);
    
    // Record start time
    const startTime = performance.now();
    
    try {
      const requestBody = generateRequestBody(config);
      
       const endpointUrl = apiEndpoint === 'sendzen' 
         ? 'https://api.sendzen.io/v1/messages'
         : `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;
       
       const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      
      // Record end time and calculate duration
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      setRequestDuration(duration);
      
      if (response.ok) {
        setApiResponse({
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          headers: {
            'content-type': response.headers.get('content-type'),
            'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
          }
        });
      } else {
        setApiError(`HTTP ${response.status}: ${responseData.message || response.statusText}`);
        setApiResponse({
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        });
      }
      
      setShowResponse(true);
    } catch (error) {
      // Record end time even for errors
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      setRequestDuration(duration);
      
      console.error('API call failed:', error);
      setApiError(error instanceof Error ? error.message : 'Network error occurred');
      setApiResponse({
        status: 0,
        statusText: 'Network Error',
        data: { error: 'Failed to connect to API' },
      });
      setShowResponse(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-background overflow-hidden">
      {/* Main Grid */}
      <div className="playground-grid flex flex-row items-stretch h-full gap-2 relative w-full">
        
        {/* Column 1: API Request */}
        <div className="flex flex-col flex-1 min-w-0 gap-2 h-full">
          {/* API Request Section */}
          <Box className="flex flex-col flex-shrink-0 shadow-sm hover:shadow-md transition-shadow border rounded-lg">
            <BoxHeader className="pb-3">
              <BoxTitle className="text-base flex items-center gap-2 text-foreground">
                <div className="h-4 w-4 rounded flex items-center justify-center">
                  <Airplay className="w-4 h-4 text-primary" />
                </div>  
                API Request
              </BoxTitle>
            </BoxHeader>
            
            <BoxContent className="space-y-2">
              <div className="space-y-2">
                <Label>API Endpoint</Label>
                <div className="bg-background/30 border-2 border-dotted border-border/50 p-3 rounded-lg max-h-[150px] overflow-auto">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      POST
                    </Badge>
                    <span className="text-sm font-mono text-foreground">
                       {apiEndpoint === 'sendzen' 
                         ? 'https://api.sendzen.io/v1/messages'
                         : `https://graph.facebook.com/v21.0/${config.phoneNumberId || '{phone_number_id}'}/messages`}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Request JSON Section */}
              <div className="space-y-2">
                <Label>Request JSON</Label>
                <div className="bg-background/30 border-2 border-dotted border-border/50 p-3 rounded-lg max-h-[150px] overflow-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words text-muted-foreground">
                    {JSON.stringify(generateRequestBody(config), null, 2)}
                  </pre>
                </div>
              </div>

            </BoxContent>
          </Box>

          {/* API Response Section */}
          <Box className="flex flex-col flex-1 min-h-0 shadow-sm hover:shadow-md transition-shadow border rounded-lg">
            <BoxHeader className="pb-3">
              <BoxTitle className="text-base flex items-center gap-2 text-foreground">
                <div className="h-4 w-4 rounded flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                API Response
              </BoxTitle>
            </BoxHeader>
            
            <BoxContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {isLoading ? (
                <div className="response-loading flex items-center justify-center h-full">
                  <div className="loading-content text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm">Sending API request...</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">⏱️ Measuring response time</p>
                  </div>
                </div>
              ) : showResponse ? (
                <div className="response-content space-y-2">
                  <div className="response-header flex items-center gap-2 flex-wrap">
                    <Badge className={`text-sm ${
                      apiResponse?.status >= 200 && apiResponse?.status < 300
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-red-100 text-red-800 hover:bg-red-100'
                    }`}>
                      {apiResponse?.status || 'Error'} {apiResponse?.statusText}
                    </Badge>
                    <span className="text-sm text-muted-foreground">POST /v1/messages</span>
                    {requestDuration !== null && (
                      <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                        ⚡ {requestDuration}ms
                      </Badge>
                    )}
                  </div>
                  
                  {apiError && (
                    <div className="error-message bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-sm text-red-800 font-medium">Error:</p>
                      <p className="text-sm text-red-700">{apiError}</p>
                    </div>
                  )}
                  
                  <div className="response-json-container flex-1 overflow-auto max-h-32">
                    <pre className="bg-muted p-2 rounded text-sm font-mono overflow-x-auto border border-border">
                      {JSON.stringify(apiResponse?.data || { error: 'No response data' }, null, 2)}
                    </pre>
                  </div>
                  
                </div>
              ) : (
                <div className="response-placeholder flex items-center justify-center h-full">
                  <div className="placeholder-content text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click &quot;Test API Call&quot; to see the response here</p>
                  </div>
                </div>
              )}
              
              {/* Test API Call Button */}
              {(config.selectedTemplate || config.isSessionMessage) && (
                <div className="mt-2 pt-2 border-t border-border">
                  <Button 
                    onClick={handleTestApiCall} 
                    variant="success"
                    className="w-full" 
                    size="sm"
                    disabled={isLoading}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {isLoading ? 'Sending...' : 'Test API Call'}
                  </Button>
                </div>
              )}
            </BoxContent>
          </Box>
        </div>
        
        {/* Column 2: Configuration */}
        <div className="flex flex-col flex-1 min-w-0 gap-2 h-full">
          <Box className="flex flex-col h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow border rounded-lg">
            <BoxHeader className="pb-3 w-full !grid-cols-1 !auto-rows-auto">
            <BoxTitle className="text-base flex items-center gap-2 text-foreground w-full !leading-normal">
              <div className="h-4 w-4 rounded flex items-center justify-center flex-shrink-0">
                <ArchiveIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="whitespace-nowrap">Configuration</span>
            </BoxTitle>
            </BoxHeader>
            
            <BoxContent className="flex-1 min-h-0 overflow-y-auto space-y-3 w-full">
              {/* Access Token Section - Only show for API Playground (Facebook Graph API) */}
              {apiEndpoint === 'facebook' && (
                <div className="access-token-section">
                  <div className="space-y-2">
                    <Label htmlFor="access-token">Facebook Access Token</Label>
                    <Input
                      id="access-token"
                      type="password"
                      value={config.accessToken}
                      onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                      placeholder="your_facebook_access_token_here"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your Facebook access token from{' '}
                      <a 
                        href="https://developers.facebook.com/tools/explorer/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Facebook Graph API Explorer
                      </a>
                    </p>
                  </div>
                </div>
              )}
              
              {/* Business Selection (API Playground only) */}
              {apiEndpoint === 'facebook' && (
                <div className="config-section">
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-2 whitespace-nowrap">
                    <Settings className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Business Account</span>
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="business-select">Select Business</Label>
                    <Select
                      value={config.selectedBusiness}
                      onValueChange={(value) => {
                        setConfig(prev => ({ 
                          ...prev, 
                          selectedBusiness: value,
                          selectedWaba: '',
                          selectedTemplate: '',
                          wabaId: '',
                          phoneNumberId: '',
                          templatePlaceholders: {}
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full" disabled={businessesLoading}>
                        <SelectValue placeholder={
                          businessesLoading ? "Loading businesses..." :
                          businesses.length === 0 
                            ? (!config.accessToken ? "Enter Facebook Access Token first" : "No businesses available")
                            : "Select a business"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {businessesError && (
                      <p className="text-xs text-red-600">{businessesError}</p>
                    )}
                  </div>
                </div>
              )}

              {/* WhatsApp Account */}
              <div className="config-section">
                <h3 className="flex items-center gap-2 text-base font-semibold mb-2 whitespace-nowrap">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>WhatsApp Account</span>
                </h3>
                <div className="space-y-2">
                  {wabaLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : wabaError ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{wabaError}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchWABADetails}
                        className="w-full"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry Loading WABAs
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={config.selectedWaba}
                      onValueChange={async (value) => {
                        if (apiEndpoint === 'facebook') {
                          // For API Playground: value format is "wabaId-phoneNumberId"
                          const [wabaId, phoneNumberId] = value.split('-');
                          autoSelectEnabledRef.current = true; // Enable auto-select for new WABA selection
                          setConfig(prev => ({ 
                            ...prev, 
                            selectedWaba: value,
                            wabaId: wabaId || '',
                            phoneNumberId: phoneNumberId || '',
                            selectedTemplate: '', // Clear template selection
                            templatePlaceholders: {} // Clear placeholders
                          }));
                        } else {
                          // For Product project: existing logic
                          const selectedWaba = wabaOptions.find(w => w.value === value);
                          let accessToken = apiKeys[value] || '';
                          
                          // If we don't have the API key cached, fetch it
                          if (!accessToken && selectedWaba?.projectId) {
                            accessToken = await getProjectApiKey(selectedWaba.projectId);
                          }
                          
                          autoSelectEnabledRef.current = true; // Enable auto-select for new WABA selection
                          setConfig(prev => ({ 
                            ...prev, 
                            selectedWaba: value,
                            wabaId: selectedWaba?.wabaId || '',
                            accessToken: accessToken,
                            selectedTemplate: '', // Clear template selection
                            templatePlaceholders: {} // Clear placeholders
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full" disabled={apiEndpoint === 'facebook' ? wabasForBusinessLoading : wabaLoading}>
                        <SelectValue placeholder={
                          apiEndpoint === 'facebook' ? (
                            wabasForBusinessLoading ? "Loading WABAs..." :
                            wabasForBusiness.length === 0 
                              ? (!config.selectedBusiness ? "Select a business first" : "No WABAs available")
                              : "Select a WABA"
                          ) : (
                            wabaLoading ? "Loading WABAs..." :
                            wabaOptions.length === 0 
                              ? "No WABAs available"
                              : "Select a WABA"
                          )
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {apiEndpoint === 'facebook' ? (
                          wabasForBusiness.map((waba) => (
                            waba.phoneNumbers.map((phone) => (
                              <SelectItem key={`${waba.wabaId}-${phone.phoneNumberId}`} value={`${waba.wabaId}-${phone.phoneNumberId}`}>
                                <div className="flex items-center gap-2">
                                  <span>{waba.wabaBusinessName} ({phone.phoneNumber})</span>
                                  <Badge variant="outline" className="text-sm">
                                    {phone.numberStatus}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                          )).flat()
                        ) : (
                          wabaOptions.map((waba, index) => (
                            <SelectItem key={index} value={waba.value}>
                              <div className="flex items-center gap-2">
                                <span>{waba.label}</span>
                                <Badge variant="outline" className="text-sm">
                                  {waba.setupMode}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              
              {selectedWaba && (
                <div className="mt-2">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="waba-details">
                      <AccordionTrigger className="text-sm py-2 hover:no-underline">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span>WABA Details</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm pt-2 pb-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Business Name:</span>
                          <span className="font-medium text-foreground">{selectedWaba.businessName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium text-foreground">{selectedWaba.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Project:</span>
                          <span className="font-medium text-foreground">{selectedWaba.projectName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Setup Mode:</span>
                          <Badge variant="outline" className="text-sm px-1 py-0">
                            {selectedWaba.setupMode}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="secondary" className={`text-sm px-1 py-0 ${
                            selectedWaba.status === 'CONNECTED' ? 'text-green-600' : 
                            selectedWaba.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedWaba.status === 'CONNECTED' ? '✓ Connected' : 
                             selectedWaba.status === 'PENDING' ? '⏳ Pending' : '✗ Disconnected'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">WABA ID:</span>
                          <span className="font-mono text-sm text-foreground">{selectedWaba.wabaId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone ID:</span>
                          <span className="font-mono text-sm text-foreground">{selectedWaba.phoneId}</span>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              </div>
              
              <hr className="border-border" />
            
              {/* Recipient Details */}
              <div className="config-section">
                <h3 className="flex items-center gap-2 text-base font-semibold mb-2 whitespace-nowrap">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span>Recipient Details</span>
                </h3>
                <div className="space-y-2">
                  <Input
                    ref={recipientPhoneRef}
                    id="recipient-phone"
                    value={config.recipientPhone}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, recipientPhone: e.target.value }));
                      // Clear API validation error for recipient phone
                      setApiValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.recipientPhone;
                        return newErrors;
                      });
                    }}
                    placeholder="+1234567890"
                    className={`w-full ${
                      apiValidationErrors.recipientPhone 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : ''
                    }`}
                  />
                  {apiValidationErrors.recipientPhone && (
                    <div className="flex items-start gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{apiValidationErrors.recipientPhone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <hr className="border-border" />
              
              {/* Message Type Toggle */}
              <div className="config-section">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="session-message-toggle"
                    checked={config.isSessionMessage}
                    onCheckedChange={(checked) => {
                      setConfig(prev => ({ 
                        ...prev, 
                        isSessionMessage: checked === true,
                        selectedTemplate: checked === true ? '' : prev.selectedTemplate,
                        templatePlaceholders: checked === true ? {} : prev.templatePlaceholders,
                      }));
                      // Clear API validation errors when toggling
                      setApiValidationErrors(prev => {
                        const newErrors = { ...prev };
                        if (checked === true) {
                          delete newErrors.selectedTemplate;
                          Object.keys(newErrors).forEach(key => {
                            if (key.startsWith('header_param_') || key.startsWith('body_param_') || key.startsWith('button_') || key === 'header_media_url') {
                              delete newErrors[key];
                            }
                          });
                        } else {
                          delete newErrors.sessionMessageText;
                        }
                        return newErrors;
                      });
                    }}
                  />
                  <Label htmlFor="session-message-toggle" className="text-sm font-medium cursor-pointer">
                    Send Session Message (Text Message)
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {config.isSessionMessage 
                    ? 'Session messages are free-form text messages that can be sent within a 24-hour window after the user contacts you. They don\'t require template approval.'
                    : 'Template messages are pre-approved message formats. Toggle above to switch to session messages.'}
                </p>
              </div>

              {/* Session Message Input */}
              {config.isSessionMessage && (
                <div className="config-section mb-4">
                  <Label htmlFor="session-message-text" className="text-sm font-medium mb-2 block">
                    Session Message Text
                  </Label>
                  <Textarea
                    id="session-message-text"
                    value={config.sessionMessageText}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, sessionMessageText: e.target.value }));
                      // Clear API validation error for session message text
                      setApiValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.sessionMessageText;
                        return newErrors;
                      });
                    }}
                    placeholder="Enter your session message text here..."
                    className={`w-full min-h-[100px] ${
                      apiValidationErrors.sessionMessageText 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : ''
                    }`}
                    maxLength={4096}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      {apiValidationErrors.sessionMessageText && (
                        <div className="flex items-start gap-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{apiValidationErrors.sessionMessageText}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {config.sessionMessageText.length} / 4096 characters
                    </span>
                  </div>
                  
                  {/* Preview URL Toggle */}
                  <div className="flex items-center space-x-2 mt-3">
                    <Checkbox
                      id="session-preview-url"
                      checked={config.sessionMessagePreviewUrl}
                      onCheckedChange={(checked) => {
                        setConfig(prev => ({ ...prev, sessionMessagePreviewUrl: checked === true }));
                      }}
                    />
                    <Label htmlFor="session-preview-url" className="text-sm font-medium cursor-pointer">
                      Enable Preview URL
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    When enabled, URLs in the message will be shown with a preview card
                  </p>
                </div>
              )}

              <hr className="border-border" />
              {/* Message Template */}
              {!config.isSessionMessage && (
                <React.Fragment>
                <div className="config-section">
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-2 whitespace-nowrap">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span>Message Templates</span>
                  {templatesError && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchMessageTemplates}
                      className="ml-auto h-6 px-2 text-sm"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                </h3>
                <div className="space-y-2 mb-2">
                  {templatesLoading ? (
                    <FacebookTemplatesSkeleton />
                  ) : templatesError ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{templatesError}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchMessageTemplates}
                        className="w-full"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry Loading Templates
                      </Button>
                    </div>
                  ) : (
                    <>
                      {config.wabaId && facebookTemplates.length === 0 ? (
                        // Empty state when WABA has no templates
                        <div className="border-2 border-dashed border-border rounded-lg p-6 space-y-4 mt-4">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className="relative">
                              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                <MessageSquare className="w-3 h-3 text-primary" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-base font-semibold text-foreground">
                                No Templates Found
                              </h4>
                              <p className="text-sm text-muted-foreground max-w-md">
                                {apiEndpoint === 'sendzen' 
                                  ? "This WABA doesn't have any approved message templates yet. Click 'Create Template' to create your first template."
                                  : "This WABA doesn't have any approved message templates yet. Create templates in Meta's Business Manager or via the Template Management page."}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (apiEndpoint === 'sendzen') {
                                    // Product context: navigate to our template creation page
                                    window.location.href = '/templates/create';
                                  } else {
                                    // API Playground context: open Meta Business Manager
                                    window.open('https://business.facebook.com/wa/manage/message-templates/', '_blank');
                                  }
                                }}
                                className="gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                {apiEndpoint === 'sendzen' ? 'Create Template' : 'Create in Meta'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Select
                            value={config.selectedTemplate}
                            onValueChange={(value) => {
                              handleTemplateChange(value);
                          // Clear API validation error for template selection
                          setApiValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.selectedTemplate;
                            return newErrors;
                          });
                        }}
                        disabled={templatesLoading || facebookTemplates.length === 0}
                      >
                        <SelectTrigger 
                          ref={templateSelectRef}
                          className={`w-full ${
                            apiValidationErrors.selectedTemplate 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                              : ''
                          }`}
                        >
                          <SelectValue placeholder={
                            templatesLoading ? "Loading templates..." : 
                            facebookTemplates.length === 0 
                              ? (apiEndpoint === 'facebook' && !config.accessToken 
                                  ? "Enter Facebook Access Token first" 
                                  : !config.wabaId 
                                    ? "Select a WABA first"
                                    : "No templates available")
                              : "Select a template"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {facebookTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <span>{template.name}</span>
                                <Badge variant="outline" className="text-sm">
                                  {template.category}
                                </Badge>
                                <Badge variant="secondary" className="text-sm">
                                  {template.status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {apiValidationErrors.selectedTemplate && (
                        <div className="flex items-start gap-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{apiValidationErrors.selectedTemplate}</span>
                        </div>
                      )}
                      <hr className="border-border my-4" />
                        </>
                      )}
                    </>
                  )}
                </div>
                </div>
              
              {/* WhatsApp Template Preview */}
              {config.selectedTemplate && facebookTemplates.length > 0 && (
                <div className="template-preview mb-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2 whitespace-nowrap">
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span>Template Preview</span>
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDetailedPreview(!showDetailedPreview)}
                      className="h-6 px-2 text-sm"
                    >
                      {showDetailedPreview ? 'Simple' : 'Detailed'}
                    </Button>
                  </div>
                  
                  {/* WhatsApp-style preview */}
                  <WhatsAppTemplatePreview 
                    template={facebookTemplates.find(t => t.id === config.selectedTemplate)}
                    placeholders={config.templatePlaceholders}
                    getProcessedMessageContent={getProcessedMessageContent}
                    showDetailed={showDetailedPreview}
                  />
                  
                  {/* Template Details */}
                  {(() => {
                    const selectedTemplate = facebookTemplates.find(t => t.id === config.selectedTemplate);
                    return selectedTemplate ? (
                      <div className="mt-3 p-2 bg-muted/50 border border-border rounded">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Template ID:</span>
                            <span className="font-mono text-foreground">{selectedTemplate.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Language:</span>
                            <span className="text-foreground">{selectedTemplate.language}</span>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Placeholder Editor - Only show when template is selected and templates loaded successfully */}
              {config.selectedTemplate && 
               facebookTemplates.length > 0 &&
               !templatesLoading && 
               !templatesError && 
               Object.keys(config.templatePlaceholders).length > 0 && (
                <>
              <hr className="border-border my-4" />
                <div className="placeholder-editor">
                  <h5 className="text-base flex items-center gap-2 text-text-primary font-medium mb-2 whitespace-nowrap">
                    <Code className="h-4 w-4 flex-shrink-0" />
                    <span>Edit Placeholder Values</span>
                  </h5>
                  <div className="placeholder-inputs space-y-2">
                    {Object.entries(config.templatePlaceholders).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={`placeholder-${key}`} className="text-muted-foreground flex items-center gap-2">
                          {key === 'header_media_url' ? (
                            <>
                              <FileText className="h-3 w-3" />
                              Header Media URL
                            </>
                          ) : key.startsWith('header_param_') ? (
                            <>
                              <Code className="h-3 w-3" />
                              Header Parameter {key.replace('header_param_', '')} Value
                            </>
                          ) : key.startsWith('body_param_') ? (
                            <>
                              <Code className="h-3 w-3" />
                              Body Parameter {key.replace('body_param_', '')} Value
                            </>
                          ) : key.startsWith('button_') ? (
                            <>
                              <Code className="h-3 w-3" />
                              Button {key.match(/button_(\d+)_param_(\d+)/)?.[1]} Parameter {key.match(/button_(\d+)_param_(\d+)/)?.[2]} Value
                            </>
                          ) : (
                            <>
                              <Code className="h-3 w-3" />
                              Parameter {key.replace('param_', '')} Value
                            </>
                          )}
                        </Label>
                        <div className="space-y-1">
                          <Input
                            ref={(el) => {
                              if (el) {
                                placeholderRefs.current[key] = el;
                              }
                            }}
                            id={`placeholder-${key}`}
                            value={value}
                            onChange={(e) => handlePlaceholderChange(key, e.target.value)}
                            placeholder={
                              key === 'header_media_url' 
                                ? (() => {
                                    const mediaType = getCurrentMediaType();
                                    const allowedExts = ALLOWED_EXTENSIONS[mediaType as keyof typeof ALLOWED_EXTENSIONS];
                                    return allowedExts 
                                      ? `Enter ${mediaType.toLowerCase()} URL (.${allowedExts.join(', .')})`
                                      : 'Enter media URL (image/video/document)';
                                  })()
                                : key.startsWith('header_param_') 
                                ? `Enter value for header parameter ${key.replace('header_param_', '')}`
                                : key.startsWith('body_param_') 
                                ? `Enter value for body parameter ${key.replace('body_param_', '')}`
                                : key.startsWith('button_') 
                                ? `Enter value for button ${key.match(/button_(\d+)_param_(\d+)/)?.[1]} parameter ${key.match(/button_(\d+)_param_(\d+)/)?.[2]}`
                                : `Enter value for parameter ${key.replace('param_', '')}`
                            }
                            maxLength={key === 'header_media_url' ? 500 : 50}
                            className={`w-full ${
                              validationErrors[key] || apiValidationErrors[key]
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                : ''
                            }`}
                          />
                          {(validationErrors[key] || apiValidationErrors[key]) && (
                            <div className="flex items-start gap-1 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{validationErrors[key] || apiValidationErrors[key]}</span>
                            </div>
                          )}
                          {key === 'header_media_url' && !validationErrors[key] && !apiValidationErrors[key] && (
                            <div className="text-sm text-muted-foreground">
                              {(() => {
                                const mediaType = getCurrentMediaType();
                                const allowedExts = ALLOWED_EXTENSIONS[mediaType as keyof typeof ALLOWED_EXTENSIONS];
                                return allowedExts 
                                  ? `Supported ${mediaType.toLowerCase()} formats: ${allowedExts.join(', ')}`
                                  : 'Supported formats will be shown based on template type';
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
              )}
              </React.Fragment>
              )}
            </BoxContent>
          </Box>
        </div>
        
        {/* Column 3: Programming Language */}
        <div className="flex flex-col flex-1 min-w-0 gap-2 h-full">
          <Box className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow border rounded-lg">
            <BoxHeader className="pb-3">
              <div className="flex items-center justify-between">
                <BoxTitle className="text-base flex items-center gap-2 text-foreground">
                  <div className="h-4 w-4 rounded flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-primary" />
                  </div>
                  Programming Language
                </BoxTitle>
                <Button onClick={handleCopyCode} variant="outline" size="sm" className="flex items-center gap-1 h-7 px-2">
                  <Copy className="h-3 w-3" />
                  <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
            </BoxHeader>
            
            <BoxContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {/* Language Tabs */}
              <div className="language-tabs">
                <div className="language-tabs flex flex-wrap gap-1">
                  {PROGRAMMING_LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      className={`language-tab flex items-center gap-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 min-w-fit ${
                        selectedLanguage === lang.value
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      }`}
                      type="button"
                      onClick={(e) => { e.preventDefault(); setSelectedLanguage(lang.value); }}
                      data-language={lang.value}
                    >
                      <span className="language-icon text-sm">{lang.icon}</span>
                      <span className="language-name text-sm truncate">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Generated Code */}
              <div className="text-sm code-content flex-1 overflow-y-auto">
                <SyntaxHighlighter 
                  code={generateCode(selectedLanguage, config)} 
                  language={getSyntaxLanguage(selectedLanguage)}
                  className="h-full"
                />
              </div>
            </BoxContent>
          </Box>
        </div>
        
      </div>
    </div>
  );
}

