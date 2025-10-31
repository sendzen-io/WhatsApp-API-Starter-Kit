/**
 * File Upload Service for Template Management
 * Implements the 3-step API process for file uploads
 */

export interface FileUploadParams {
  fileName: string;
  fileType: string;
  fileLength: number;
  wabaId: string;
}

export interface UploadSessionResponse {
  uploadSession: string;
  fileId?: string;
}

export interface FileUploadResult {
  success: boolean;
  fileId?: string;
  uploadSession?: string;
  error?: string;
}

export class FileUploadService {
  private baseUrl: string;
  private appId: string | null = null;
  private partnerConfig: { partner_id: string; meta_app_id: string; meta_partner_config_id: string } | null = null;

  constructor(baseUrl: string = 'https://api.sendzen.io') {
    this.baseUrl = baseUrl;
  }

  /**
   * Helper function to extract error detail from error messages that may contain JSON
   */
  private extractErrorDetail(errorMessage: string): string {
    try {
      // Try to parse JSON from the error message
      // Look for JSON object in the message (e.g., "400 - {...}")
      const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const errorData = JSON.parse(jsonStr);
        
        // Try to get detail first, then message, then error.detail, then error.message
        if (errorData.error?.detail) {
          return errorData.error.detail;
        }
        if (errorData.error?.message) {
          return errorData.error.message;
        }
        if (errorData.detail) {
          return errorData.detail;
        }
        if (errorData.message) {
          return errorData.message;
        }
      }
    } catch (parseError) {
      // If JSON parsing fails, return the original message
    }
    
    return errorMessage;
  }

  /**
   * Step 1: Get app ID from partner config
   * This should be called during onboarding, but we'll implement it here for completeness
   */
  private async getAppId(): Promise<string> {
    if (this.appId) {
      return this.appId;
    }
    let locationHost = window.location.hostname;
    if(locationHost === 'localhost'){
        locationHost = 'app.sendzen.io';
    }else{
        locationHost = 'app.sendzen.io';
    }
    try {
      // Get partner config to retrieve app ID
      const response = await fetch(`${this.baseUrl}/v1/partner/config/${encodeURIComponent(locationHost)}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to get partner config: ${response.status}`);
      }

      const data = await response.json();
      this.partnerConfig = data.data;
      this.appId = data.data?.meta_app_id || null;
      
      if (!this.appId) {
        throw new Error('No app ID found in partner config');
      }
      
      return this.appId;
    } catch (error) {
      throw new Error(`Failed to get app ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Step 2: Create upload session
   * POST /v1/{appId}/uploads
   */
  private async createUploadSession(params: FileUploadParams): Promise<UploadSessionResponse> {
    const appId = await this.getAppId();
    console.log('appId', appId);
    
    const queryParams = new URLSearchParams({
      file_name: params.fileName,
      file_type: params.fileType,
      file_length: params.fileLength.toString(),
    });

    const requestBody = {
      waba_id: params.wabaId,
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/${appId}/uploads?${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'file_offset': '0'
        },
        credentials: 'include', // Use HttpOnly cookies for authentication
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorDetail = this.extractErrorDetail(errorText);
        throw new Error(errorDetail);
      }

      // Check if response has content before trying to parse JSON
      const responseText = await response.text();
      console.log('Upload session response text:', responseText);
      
      let data: any = {};
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
          console.log('Upload session response data:', data);
        } catch (parseError) {
          throw new Error(`Invalid JSON response from upload session creation: ${responseText}`);
        }
      } else {
        throw new Error('Empty response from upload session creation');
      }
      
      const uploadSession = data.data?.id || data.upload_session || data.uploadSession;
      if (!uploadSession) {
        throw new Error('No upload session ID found in response');
      }
      
      return {
        uploadSession,
        fileId: data.data?.file_id || data.file_id || data.fileId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Extract clean error detail if the error message contains JSON
      const cleanError = this.extractErrorDetail(errorMessage);
      throw new Error(cleanError);
    }
  }

  /**
   * Step 3: Upload file data
   * POST /v1/{whatsappBusinessAccountId}/{uploadSession}
   */
  private async uploadFileData(
    whatsappBusinessAccountId: string,
    uploadSession: string,
    file: File,
    fileOffset: number = 0
  ): Promise<FileUploadResult> {
    try {
    
      const arrayBuffer = await file.arrayBuffer();
      
      const response = await fetch(`${this.baseUrl}/v1/${whatsappBusinessAccountId}/${uploadSession}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'file_offset': fileOffset.toString(),
        },
        credentials: 'include', // Use HttpOnly cookies for authentication
        body: arrayBuffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorDetail = this.extractErrorDetail(errorText);
        throw new Error(errorDetail);
      }

      // Check if response has content before trying to parse JSON
      const responseText = await response.text();
      console.log('File upload response text:', responseText);
      
      let data: any = {};
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
          console.log('File upload response data:', data);
        } catch (parseError) {
          console.warn('Response is not valid JSON, treating as successful upload');
          // If response is not JSON but status is 200, consider it successful
          return {
            success: true,
            fileId: undefined, // No file ID available
          };
        }
      }
      
      return {
        success: true,
        fileId: data.data?.h || data.data?.file_id || data.file_id || data.fileId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Extract clean error detail if the error message contains JSON
      const cleanError = this.extractErrorDetail(errorMessage);
      return {
        success: false,
        error: cleanError,
      };
    }
  }

  /**
   * Main upload method that orchestrates the 3-step process
   */
  async uploadFile(file: File, wabaId: string | null = null): Promise<FileUploadResult> {
    try {
      // In open source mode, WABA functionality is not available
      if (!wabaId) {
        return {
          success: false,
          error: 'WABA functionality is not available in open source mode. Please use direct file URLs instead of uploading files.',
        };
      }

      // Validate file type
      const allowedTypes = ['pdf', 'jpeg', 'jpg', 'png', 'mp4'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        return {
          success: false,
          error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        };
      }

      // Determine MIME type
      const mimeTypeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'png': 'image/png',
        'mp4': 'video/mp4',
      };

      const fileType = mimeTypeMap[fileExtension] || file.type;

      // Step 1: Get app ID (cached)
      await this.getAppId();

      // Step 2: Create upload session
      const uploadParams: FileUploadParams = {
        fileName: file.name,
        fileType: fileType,
        fileLength: file.size,
        wabaId: wabaId,
      };

      const uploadSessionResponse = await this.createUploadSession(uploadParams);
      
      if (!uploadSessionResponse.uploadSession) {
        return {
          success: false,
          error: 'Failed to create upload session - no session ID returned',
        };
      }

      // Step 3: Upload file data
      const uploadResult = await this.uploadFileData(
        wabaId, // Using wabaId as whatsappBusinessAccountId
        uploadSessionResponse.uploadSession,
        file
      );

      return uploadResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during upload';
      // Extract clean error detail if the error message contains JSON
      const cleanError = this.extractErrorDetail(errorMessage);
      return {
        success: false,
        error: cleanError,
      };
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSizes = {
      'pdf': 100 * 1024 * 1024, // 100 MB
      'jpeg': 5 * 1024 * 1024,  // 5 MB
      'jpg': 5 * 1024 * 1024,   // 5 MB
      'png': 5 * 1024 * 1024,   // 5 MB
      'mp4': 16 * 1024 * 1024,  // 16 MB
    };

    const allowedTypes = ['pdf', 'jpeg', 'jpg', 'png', 'mp4'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    const maxSize = maxSizes[fileExtension as keyof typeof maxSizes];
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File is too large. Maximum size for ${fileExtension.toUpperCase()} files is ${maxSize / 1024 / 1024}MB`,
      };
    }

    return { isValid: true };
  }
}

// Export a singleton instance
export const fileUploadService = new FileUploadService();
