// Service interfaces for Playground Container
// These interfaces define the contract that service implementations must follow

export interface MessageTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  components: Array<{
    type: string;
    format?: string;
    text?: string;
    buttons?: Array<{
      type: string;
      text?: string;
      url?: string;
      phone_number?: string;
    }>;
    example?: {
      header_handle?: string[];
    };
  }>;
}

export interface WABAPhoneNumber {
  phoneNumberId: string;
  phoneNumber: string;
  numberStatus?: string | null;
}

export interface WABADetails {
  wabaId: string;
  wabaBusinessName: string;
  setupMode: string;
  phoneNumbers: WABAPhoneNumber[];
}

export interface ProjectDetails {
  projectId: string;
  projectName: string;
  wabas: WABADetails[];
}

export interface WABADetailsResponse {
  projects: ProjectDetails[];
}

export interface APIKeyResponse {
  apiKey: string;
}

// Service interface definitions
export interface IWABAService {
  getWABADetails(accessToken?: string): Promise<WABADetailsResponse>;
  getAPIKey(projectId: string): Promise<APIKeyResponse>;
  // New methods for step-by-step flow (API Playground only)
  getBusinesses?(accessToken: string): Promise<Array<{id: string, name: string}>>;
  getWABAsForBusiness?(businessId: string, accessToken: string): Promise<Array<{
    wabaId: string;
    wabaBusinessName: string;
    phoneNumbers: Array<{
      phoneNumberId: string;
      phoneNumber: string;
      numberStatus: string;
    }>;
  }>>;
}

export interface ITemplateService {
  getMessageTemplates(wabaId: string, accessToken?: string): Promise<MessageTemplate[]>;
}

// Props interface for PlaygroundContainer
export interface PlaygroundContainerProps {
  wabaService: IWABAService;
  templateService: ITemplateService;
  apiEndpoint?: 'sendzen' | 'facebook'; // 'sendzen' for product, 'facebook' for api-playground
  dictionary?: {
    apiResponse?: {
      activityLogNote?: string;
      activityLogLink?: string;
      activityLogNoteSuffix?: string;
    };
  };
}

