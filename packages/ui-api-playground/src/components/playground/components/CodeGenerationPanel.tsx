'use client';

import React, { useMemo } from 'react';
import { Box, BoxContent, BoxHeader, BoxTitle } from '@workspace/ui-core/components/box';
import { Button } from '@workspace/ui-core/components/button';
import { Checkbox } from '@workspace/ui-core/components/checkbox';
import { Label } from '@workspace/ui-core/components/label';
import { Copy, Code2 } from 'lucide-react';
import SyntaxHighlighter from '../SyntaxHighlighter';
import { getSyntaxLanguage } from '../../../utils/codeGenerators';

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

interface CodeGenerationPanelProps {
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  generateCode: (language: string) => string;
  copied: boolean;
  handleCopyCode: () => void;
  showAuthToken: boolean;
  setShowAuthToken: (show: boolean) => void;
}

export const CodeGenerationPanel: React.FC<CodeGenerationPanelProps> = ({
  selectedLanguage,
  setSelectedLanguage,
  generateCode,
  copied,
  handleCopyCode,
  showAuthToken,
  setShowAuthToken
}) => {
  // Memoize the generated code to ensure it updates when generateCode function changes
  const code = useMemo(() => generateCode(selectedLanguage), [generateCode, selectedLanguage]);

  return (
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
        
        {/* Show Auth Token Checkbox */}
        <div className="flex items-center space-x-2 pt-2 pb-2 border-b border-border">
          <Checkbox
            id="show-auth-token"
            checked={showAuthToken}
            onCheckedChange={(checked) => setShowAuthToken(checked === true)}
          />
          <Label htmlFor="show-auth-token" className="text-sm cursor-pointer">
            Show auth token
          </Label>
        </div>
        
        {/* Generated Code */}
        <div className="text-sm code-content flex-1 overflow-y-auto">
          <SyntaxHighlighter 
            code={code} 
            language={getSyntaxLanguage(selectedLanguage)}
            className="h-full"
          />
        </div>
      </BoxContent>
    </Box>
  );
};

