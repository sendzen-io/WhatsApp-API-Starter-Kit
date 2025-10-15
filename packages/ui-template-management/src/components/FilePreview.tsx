"use client";

import React from 'react';
import { Card, CardContent } from '@workspace/ui-core/components/card';
import { Button } from '@workspace/ui-core/components/button';
import { X, FileText, Image, Video, File } from 'lucide-react';
import { Box, BoxHeader } from '@workspace/ui-core/components/box';

interface FilePreviewProps {
  file: File;
  fileId?: string;
  onRemove?: () => void;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ 
  file, 
  fileId, 
  onRemove, 
  className = "" 
}) => {
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-8 w-8 text-purple-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPreview = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="relative">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-full h-32 object-cover rounded-md"
          />
          {onRemove && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      );
    } else if (file.type.startsWith('video/')) {
      return (
        <div className="relative">
          <video
            src={URL.createObjectURL(file)}
            className="w-full h-32 object-cover rounded-md"
            controls
          />
          {onRemove && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      );
    } else {
      // Document or other file types
      return (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)} • {file.type}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {fileId && (
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                Uploaded
              </div>
            )}
            {onRemove && (
              <Button
                variant="destructive"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <Box className={`${className}`}>
      <BoxHeader className="p-3">
        <div className="space-y-2">
          {/* Show header info only for images and videos */}
          {(file.type.startsWith('image/') || file.type.startsWith('video/')) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getFileIcon()}
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                </div>
              </div>
              {fileId && (
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  Uploaded
                </div>
              )}
            </div>
          )}
          
          {renderPreview()}
        </div>
      </BoxHeader>
    </Box>
  );
};

export default FilePreview;
