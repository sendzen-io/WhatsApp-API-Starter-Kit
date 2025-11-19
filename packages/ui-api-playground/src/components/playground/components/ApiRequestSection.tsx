'use client';

import React, { useState } from 'react';
import { Box, BoxContent, BoxHeader, BoxTitle } from '@workspace/ui-core/components/box';
import { Label } from '@workspace/ui-core/components/label';
import { Badge } from '@workspace/ui-core/components/badge';
import { Button } from '@workspace/ui-core/components/button';
import { Airplay, Copy, Check } from 'lucide-react';
import { PlaygroundConfig } from '../utils/requestBodyGenerators';

interface ApiRequestSectionProps {
  apiEndpoint: 'sendzen' | 'facebook';
  config: PlaygroundConfig;
  generateRequestBody: (config: PlaygroundConfig) => any;
}

export const ApiRequestSection: React.FC<ApiRequestSectionProps> = ({
  apiEndpoint,
  config,
  generateRequestBody
}) => {
  const [copied, setCopied] = useState(false);
  const endpointUrl = apiEndpoint === 'sendzen' 
    ? 'https://api.sendzen.io/v1/messages'
    : `https://graph.facebook.com/v21.0/${config.phoneNumberId || '{phone_number_id}'}/messages`;

  const requestBody = generateRequestBody(config);
  const requestBodyJson = JSON.stringify(requestBody, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(requestBodyJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
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
              <Badge variant="success" className="bg-green-100 text-green-800">
                POST
              </Badge>
              <span className="text-sm font-mono text-foreground">
                {endpointUrl}
              </span>
            </div>
          </div>
        </div>
        
        {/* Request JSON Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Request JSON</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>
          </div>
          <div className="bg-background/30 border-2 border-dotted border-border/50 p-3 rounded-lg max-h-[150px] overflow-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-muted-foreground">
              {requestBodyJson}
            </pre>
          </div>
        </div>
      </BoxContent>
    </Box>
  );
};

