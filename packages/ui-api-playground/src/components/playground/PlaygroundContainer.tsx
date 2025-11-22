'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@workspace/ui-core/components/button';
import { Input } from '@workspace/ui-core/components/input';
import { Label } from '@workspace/ui-core/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui-core/components/select';
import { Checkbox } from '@workspace/ui-core/components/checkbox';
import { Textarea } from '@workspace/ui-core/components/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@workspace/ui-core/components/accordion';
import { Badge } from '@workspace/ui-core/components/badge';
import { Box, BoxContent, BoxHeader, BoxTitle } from '@workspace/ui-core/components/box';
import { Skeleton } from '@workspace/ui-core/components/skeleton';
import { Code, Settings, User, MessageSquare, Phone, FileText, ArchiveIcon, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { PlaygroundContainerProps, MessageTemplate } from '../../types/services';
import { 
  generateCurlCode, 
  generateJavaScriptCode, 
  generatePythonCode, 
  generatePHPCode, 
  generateJavaCode, 
  generateCSharpCode, 
  generateRubyCode, 
  generateGoCode
} from '../../utils/codeGenerators';
import { WhatsAppTemplatePreview } from '../template-preview';
import { 
  generateRequestBody as generateRequestBodyUtil
} from './utils/requestBodyGenerators';
import { 
  validateMediaUrl,
  validateApiCall,
  ALLOWED_EXTENSIONS
} from './utils/validation';
import {
  getCurrentMediaType,
  getProcessedMessageContent,
  extractTemplatePlaceholders,
  getTemplateMessageContent
} from './utils/templateHelpers';
import { ApiRequestSection } from './components/ApiRequestSection';
import { ApiResponseSection } from './components/ApiResponseSection';
import { CodeGenerationPanel } from './components/CodeGenerationPanel';

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



export default function PlaygroundContainer({ 
  wabaService, 
  templateService,
  apiEndpoint = 'facebook', // Default to Facebook Graph API for API Playground
  dictionary
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
  const [showAuthToken, setShowAuthToken] = useState(false);
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

    // Extract placeholders using helper function
    const newPlaceholders = extractTemplatePlaceholders(template);
    const messageContent = getTemplateMessageContent(template);

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
      const selectedTemplate = facebookTemplates.find(t => t.id === config.selectedTemplate);
      const mediaType = getCurrentMediaType(selectedTemplate);
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
  const getProcessedMessageContentLocal = () => {
    return getProcessedMessageContent(config.messageContent, config.templatePlaceholders);
  };

  const generateCode = (language: string, config: PlaygroundConfig) => {
    const endpointUrl = apiEndpoint === 'sendzen' 
      ? 'https://api.sendzen.io/v1/messages'
      : `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;
    const requestBody = generateRequestBody(config);
    const actualToken = apiEndpoint === 'sendzen' 
      ? (config.selectedWaba 
          ? apiKeys[config.selectedWaba] || '' 
          : '')
      : config.accessToken;
    
    // Use placeholder if token is hidden or not available
    const token = showAuthToken 
      ? (actualToken || "your_access_token_here")
      : "[AuthToken]";

    switch (language) {
      case 'javascript':
        return generateJavaScriptCode(endpointUrl, requestBody, token, apiEndpoint);
      case 'python':
        return generatePythonCode(endpointUrl, requestBody, token, apiEndpoint);
      case 'php':
        return generatePHPCode(endpointUrl, requestBody, token, apiEndpoint);
      case 'java':
        return generateJavaCode(endpointUrl, requestBody, token, apiEndpoint);
      case 'csharp':
        return generateCSharpCode(endpointUrl, requestBody, token, apiEndpoint);
      case 'ruby':
        return generateRubyCode(endpointUrl, requestBody, token, apiEndpoint);
      case 'go':
        return generateGoCode(endpointUrl, requestBody, token, apiEndpoint);
      case 'curl':
        return generateCurlCode(endpointUrl, requestBody, token, apiEndpoint);
      default:
        return '// Select a programming language to generate code';
    }
  };

  const generateRequestBody = (config: PlaygroundConfig) => {
    const selectedTemplate = facebookTemplates.find(t => t.id === config.selectedTemplate);
    return generateRequestBodyUtil(config, selectedTemplate, wabaOptions, facebookTemplates, apiEndpoint);
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


  const handleTestApiCall = async () => {
    // Clear previous validation errors
    setApiValidationErrors({});
    
    // Validate all required fields before making API call
    const validation = validateApiCall(config, facebookTemplates);
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
          <ApiRequestSection 
            apiEndpoint={apiEndpoint}
            config={config}
            generateRequestBody={generateRequestBody}
          />
          <ApiResponseSection
            isLoading={isLoading}
            showResponse={showResponse}
            apiResponse={apiResponse}
            apiError={apiError}
            requestDuration={requestDuration}
            handleTestApiCall={handleTestApiCall}
            config={config}
            dictionary={dictionary}
          />
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
                    getProcessedMessageContent={getProcessedMessageContentLocal}
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
                                    const selectedTemplate = facebookTemplates.find(t => t.id === config.selectedTemplate);
                                    const mediaType = getCurrentMediaType(selectedTemplate);
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
                                const selectedTemplate = facebookTemplates.find(t => t.id === config.selectedTemplate);
                                const mediaType = getCurrentMediaType(selectedTemplate);
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
          <CodeGenerationPanel
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            generateCode={useMemo(() => (lang: string) => generateCode(lang, config), [config, apiEndpoint, wabaOptions, facebookTemplates, apiKeys, showAuthToken])}
            copied={copied}
            handleCopyCode={handleCopyCode}
            showAuthToken={showAuthToken}
            setShowAuthToken={setShowAuthToken}
          />
        </div>
        
      </div>
    </div>
  );
}

