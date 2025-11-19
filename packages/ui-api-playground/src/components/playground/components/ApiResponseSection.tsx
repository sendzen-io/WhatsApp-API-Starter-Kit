'use client';

import React from 'react';
import { Box, BoxContent, BoxHeader, BoxTitle } from '@workspace/ui-core/components/box';
import { Button } from '@workspace/ui-core/components/button';
import { Badge } from '@workspace/ui-core/components/badge';
import { Check, Play, FileText } from 'lucide-react';
import { PlaygroundConfig } from '../utils/requestBodyGenerators';

interface ApiResponseSectionProps {
  isLoading: boolean;
  showResponse: boolean;
  apiResponse: any;
  apiError: string | null;
  requestDuration: number | null;
  handleTestApiCall: () => void;
  config: PlaygroundConfig;
}

export const ApiResponseSection: React.FC<ApiResponseSectionProps> = ({
  isLoading,
  showResponse,
  apiResponse,
  apiError,
  requestDuration,
  handleTestApiCall,
  config
}) => {
  return (
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
  );
};

