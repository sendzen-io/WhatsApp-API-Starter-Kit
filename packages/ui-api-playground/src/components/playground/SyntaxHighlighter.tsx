'use client';

import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
// Import CSS dynamically to avoid SSR issues
import 'prismjs/themes/prism-tomorrow.css';

// Preload JavaScript highlighting for immediate availability
import 'prismjs/components/prism-javascript';

// Import Prism components statically to avoid SSR issues
// Import markup-templating first as it's required by PHP
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-bash';

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  className?: string;
}

export default function SyntaxHighlighter({ code, language, className = '' }: SyntaxHighlighterProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isHighlighting, setIsHighlighting] = useState(false);

  // Map language names to Prism language identifiers
  const getPrismLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      javascript: 'javascript',
      python: 'python',
      php: 'php',
      java: 'java',
      csharp: 'csharp',
      ruby: 'ruby',
      go: 'go',
      curl: 'bash', // cURL uses bash syntax
    };
    return languageMap[lang] || 'javascript';
  };

  const prismLanguage = getPrismLanguage(language);

  useEffect(() => {
    setIsHighlighting(true);
    
    try {
      // Check if the language is available in Prism
      if (Prism.languages && Prism.languages[prismLanguage]) {
        // Apply syntax highlighting directly to the code
        const highlighted = Prism.highlight(code, Prism.languages[prismLanguage], prismLanguage);
        setHighlightedCode(highlighted);
      } else {
        // Fallback to plain text if language not available
        console.warn(`Language ${prismLanguage} not available in Prism`);
        setHighlightedCode(code);
      }
    } catch (error) {
      console.error('Error highlighting code:', error);
      // Fallback to plain text
      setHighlightedCode(code);
    } finally {
      setIsHighlighting(false);
    }
  }, [code, prismLanguage]);

  return (
    <pre className={`text-sm font-mono whitespace-pre p-3 m-0 h-full bg-gray-900 text-gray-100 overflow-scroll language-javascript ${className}`} style={{ margin:0 }}>
      <code ref={codeRef} className={`language-${prismLanguage}`}>
        {isHighlighting ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
              <p className="text-xs">Highlighting code...</p>
            </div>
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: highlightedCode || code }} />
        )}
      </code>
    </pre>
  );
}
