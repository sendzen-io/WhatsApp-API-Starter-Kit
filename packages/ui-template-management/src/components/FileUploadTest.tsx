/**
 * Test component to demonstrate file upload functionality
 * This can be used to test the 3-step API process
 */

import React, { useState } from 'react';
import { Button } from '@workspace/ui-core/components/button';
import { Input } from '@workspace/ui-core/components/input';
import { Label } from '@workspace/ui-core/components/label';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui-core/components/card';
import { fileUploadService, FileUploadService } from '../lib/fileUploadService';
import { useWabaId } from '../hooks/useWabaId';
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';

export function FileUploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const wabaId = useWabaId();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const validation = FileUploadService.validateFile(selectedFile);
      if (validation.isValid) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        setUploadResult({ success: false, message: validation.error || 'Invalid file' });
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const result = await fileUploadService.uploadFile(file, wabaId);
      
      if (result.success) {
        setUploadResult({ 
          success: true, 
          message: `File uploaded successfully! File ID: ${result.fileId}` 
        });
      } else {
        setUploadResult({ 
          success: false, 
          message: result.error || 'Upload failed' 
        });
      }
    } catch (error) {
      setUploadResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          File Upload Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-file">Select File</Label>
          <Input
            id="test-file"
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.jpeg,.jpg,.png,.mp4"
            disabled={isUploading}
          />
          <p className="text-sm text-muted-foreground">
            Supported formats: PDF, JPEG, JPG, PNG, MP4
          </p>
        </div>

        {file && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected file:</p>
            <p className="text-sm text-muted-foreground">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}

        {!wabaId && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              WABA functionality is not available in open source mode. File upload will not work.
            </p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </>
          )}
        </Button>

        {uploadResult && (
          <div className={`p-3 rounded-md flex items-center gap-2 ${
            uploadResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {uploadResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <p className={`text-sm ${
              uploadResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {uploadResult.message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
