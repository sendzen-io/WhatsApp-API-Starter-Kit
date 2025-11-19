// Export the PlaygroundContainer component and its types
export { default as PlaygroundContainer } from './components/playground/PlaygroundContainer';
export type { 
  PlaygroundContainerProps,
  IWABAService,
  ITemplateService,
  MessageTemplate,
  WABAPhoneNumber,
  WABADetails,
  ProjectDetails,
  WABADetailsResponse,
  APIKeyResponse
} from './types/services';

// Export code generators
export * from './utils/codeGenerators';

// Export template preview component
export { WhatsAppTemplatePreview } from './components/template-preview';

// Export playground components
export * from './components/playground/components';

// Export request body generators
export { 
  generateTemplateRequestJSON,
  generateTemplateRequestBody,
  generateRequestBody
} from './components/playground/utils/requestBodyGenerators';
export type {
  PlaygroundConfig,
  WABAOption
} from './components/playground/utils/requestBodyGenerators';

// Export syntax highlighter
export { default as SyntaxHighlighter } from './components/playground/SyntaxHighlighter';

