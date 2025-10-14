import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui-core/components/card";
import { Button } from "@workspace/ui-core/components/button";
import { Badge } from "@workspace/ui-core/components/badge";
import { 
  AlertCircle, 
  RefreshCw, 
  ShieldX, 
  Key, 
  WifiOff, 
  ServerCrash,
  HelpCircle,
  ExternalLink,
  Copy,
  CheckCircle
} from "lucide-react";

export interface ErrorDetails {
  type: 'unauthorized' | 'network' | 'server' | 'validation' | 'unknown';
  message: string;
  statusCode?: number;
  isEmbedded?: boolean;
  accessToken?: string;
}

interface TemplateErrorUIProps {
  errorDetails: ErrorDetails;
  onRetry: () => void;
}

const ErrorIcon = ({ type }: { type: ErrorDetails['type'] }) => {
  const iconProps = { className: "w-6 h-6" };
  
  switch (type) {
    case 'unauthorized':
      return <ShieldX {...iconProps} className="w-6 h-6 text-red-500" />;
    case 'network':
      return <WifiOff {...iconProps} className="w-6 h-6 text-orange-500" />;
    case 'server':
      return <ServerCrash {...iconProps} className="w-6 h-6 text-red-600" />;
    case 'validation':
      return <AlertCircle {...iconProps} className="w-6 h-6 text-yellow-500" />;
    default:
      return <HelpCircle {...iconProps} className="w-6 h-6 text-gray-500" />;
  }
};

const ErrorTitle = ({ type }: { type: ErrorDetails['type'] }) => {
  switch (type) {
    case 'unauthorized':
      return "Access Denied";
    case 'network':
      return "Connection Error";
    case 'server':
      return "Server Error";
    case 'validation':
      return "Invalid Request";
    default:
      return "Something Went Wrong";
  }
};

const ErrorDescription = ({ details }: { details: ErrorDetails; }) => {
  switch (details.type) {
    case 'unauthorized':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {details.isEmbedded 
              ? "Your access token is invalid or has expired. Please check your authentication credentials."
              : "You don't have permission to access this resource. Please contact your administrator."
            }
          </p>
          {details.isEmbedded && details.accessToken && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Key className="w-4 h-4" />
                Access Token Information
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded border flex-1 truncate">
                  {details.accessToken.substring(0, 20)}...
                </code>
              </div>
            </div>
          )}
        </div>
      );
    case 'network':
      return (
        <p className="text-sm text-muted-foreground">
          Unable to connect to the server. Please check your internet connection and try again.
        </p>
      );
    case 'server':
      return (
        <p className="text-sm text-muted-foreground">
          The server encountered an error while processing your request. Please try again later.
        </p>
      );
    case 'validation':
      return (
        <p className="text-sm text-muted-foreground">
          The request contains invalid data. Please check your input and try again.
        </p>
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
      );
  }
};

const ErrorActions = ({ details, onRetry }: { 
  details: ErrorDetails; 
  onRetry: () => void; 
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button variant="secondary" onClick={onRetry} className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
      
      {details.type === 'unauthorized' && details.isEmbedded && (
        <Button variant="outline" className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Get New Token
        </Button>
      )}
      
      <Button variant="ghost" className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4" />
        Contact Support
      </Button>
    </div>
  );
};

const TemplateErrorUI: React.FC<TemplateErrorUIProps> = ({ 
  errorDetails, 
  onRetry, 
}) => {
  
  return (
    <div className="space-y-8 template-client-container">

      {/* Error Card */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <ErrorIcon type={errorDetails.type} />
            <div className="flex-1">
              <CardTitle className="text-lg text-destructive">
                <ErrorTitle type={errorDetails.type} />
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className="text-destructive border-destructive/30"
                >
                  {errorDetails.type.toUpperCase()}
                </Badge>
                {errorDetails.statusCode && (
                  <Badge variant="secondary">
                    Status: {errorDetails.statusCode}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <ErrorDescription details={errorDetails} />
          
          {/* Technical Details */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <AlertCircle className="w-4 h-4" />
              Technical Details
            </div>
            <code className="text-xs text-muted-foreground break-all">
              {errorDetails.message}
            </code>
          </div>
          
          <ErrorActions details={errorDetails} onRetry={onRetry} />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Need Help?
              </h3>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• Check your internet connection</p>
                <p>• Verify your access token is valid and not expired</p>
                <p>• Contact your system administrator for assistance</p>
                <p>• Review the API documentation for troubleshooting</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateErrorUI;
