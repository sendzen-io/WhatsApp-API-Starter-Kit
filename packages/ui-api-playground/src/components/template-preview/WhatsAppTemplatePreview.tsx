'use client';

import React from 'react';
import NextImage from 'next/image';
import { Image, Video, FileText as FileTextIcon } from 'lucide-react';
import { MessageTemplate } from '../../types/services';

type FacebookTemplate = MessageTemplate;

interface WhatsAppTemplatePreviewProps {
  template: FacebookTemplate | undefined;
  placeholders: Record<string, string>;
  getProcessedMessageContent: () => string;
  showDetailed?: boolean;
}

export const WhatsAppTemplatePreview = ({ 
  template, 
  placeholders, 
  getProcessedMessageContent,
  showDetailed = true
}: WhatsAppTemplatePreviewProps) => {
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
    </div>
  );
};

