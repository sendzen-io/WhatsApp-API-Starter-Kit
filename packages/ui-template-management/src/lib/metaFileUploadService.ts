/**
 * Meta Graph API File Upload Service
 * Implements Meta's Resumable Upload API for direct file uploads
 * Based on: https://developers.facebook.com/docs/graph-api/guides/upload/
 */

export interface MetaUploadSession {
  id: string;
  file_offset?: number;
}

export interface MetaUploadResult {
  h: string; // File handle
}

export interface MetaFileUploadResult {
  success: boolean;
  fileHandle?: string;
  error?: string;
}

export class MetaFileUploadService {
  private baseUrl: string = 'https://graph.facebook.com/v24.0';
  private appId: string;
  private accessToken: string;

  constructor(appId: string, accessToken: string) {
    this.appId = appId;
    this.accessToken = accessToken;
  }

  /**
   * Step 1: Start an upload session
   * POST /<APP_ID>/uploads
   */
  private async startUploadSession(
    fileName: string,
    fileLength: number,
    fileType: string
  ): Promise<MetaUploadSession> {
    const params = new URLSearchParams({
      file_name: fileName,
      file_length: fileLength.toString(),
      file_type: fileType,
      access_token: this.accessToken,
    });

    console.log(`[Meta API] Starting upload session for ${fileName} (${fileLength} bytes, ${fileType})`);
    console.log(`[Meta API] Request URL: ${this.baseUrl}/${this.appId}/uploads?${params}`);

    const response = await fetch(`${this.baseUrl}/${this.appId}/uploads?${params}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Meta API] Upload session failed: ${response.status} - ${errorText}`);
      throw new Error(`Failed to start upload session: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Meta API] Upload session created:`, data);
    
    if (!data.id) {
      throw new Error('No upload session ID returned from Meta API');
    }

    return data;
  }

  /**
   * Step 2: Upload file data
   * POST /upload:<UPLOAD_SESSION_ID>
   */
  private async uploadFileData(
    uploadSessionId: string,
    file: File,
    fileOffset: number = 0
  ): Promise<MetaUploadResult> {
    const arrayBuffer = await file.arrayBuffer();
    
    console.log(`[Meta API] Uploading file data for session ${uploadSessionId} (offset: ${fileOffset})`);
    console.log(`[Meta API] Request URL: ${this.baseUrl}/upload:${uploadSessionId}`);
    
    const response = await fetch(`${this.baseUrl}/upload:${uploadSessionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `OAuth ${this.accessToken}`,
        'file_offset': fileOffset.toString(),
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Meta API] File upload failed: ${response.status} - ${errorText}`);
      throw new Error(`File upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Meta API] File upload completed:`, data);
    
    if (!data.h) {
      throw new Error('No file handle returned from Meta API');
    }

    return data;
  }

  /**
   * Resume an interrupted upload
   * GET /upload:<UPLOAD_SESSION_ID>
   */
  private async resumeUpload(uploadSessionId: string): Promise<MetaUploadSession> {
    const response = await fetch(`${this.baseUrl}/upload:${uploadSessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `OAuth ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to resume upload: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Main upload method that orchestrates the Meta upload process
   */
  async uploadFile(file: File): Promise<MetaFileUploadResult> {
    try {
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

      // Step 1: Start upload session
      const uploadSession = await this.startUploadSession(
        file.name,
        file.size,
        fileType
      );

      // Step 2: Upload file data
      const uploadResult = await this.uploadFileData(
        uploadSession.id,
        file,
        uploadSession.file_offset || 0
      );

      return {
        success: true,
        fileHandle: uploadResult.h,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during upload',
      };
    }
  }

  /**
   * Upload file with resume capability
   * This method can resume interrupted uploads
   */
  async uploadFileWithResume(file: File, uploadSessionId?: string): Promise<MetaFileUploadResult> {
    try {
      let sessionId = uploadSessionId;
      let fileOffset = 0;

      // If we have an existing session, try to resume
      if (sessionId) {
        try {
          const resumeData = await this.resumeUpload(sessionId);
          sessionId = resumeData.id;
          fileOffset = resumeData.file_offset || 0;
        } catch (error) {
          console.warn('Failed to resume upload, starting new session:', error);
          sessionId = undefined;
          fileOffset = 0;
        }
      }

      // If no session or resume failed, start new session
      if (!sessionId) {
        const allowedTypes = ['pdf', 'jpeg', 'jpg', 'png', 'mp4'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (!fileExtension || !allowedTypes.includes(fileExtension)) {
          return {
            success: false,
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          };
        }

        const mimeTypeMap: Record<string, string> = {
          'pdf': 'application/pdf',
          'jpeg': 'image/jpeg',
          'jpg': 'image/jpeg',
          'png': 'image/png',
          'mp4': 'video/mp4',
        };

        const fileType = mimeTypeMap[fileExtension] || file.type;
        const uploadSession = await this.startUploadSession(file.name, file.size, fileType);
        sessionId = uploadSession.id;
      }

      // Upload file data
      const uploadResult = await this.uploadFileData(sessionId, file, fileOffset);

      return {
        success: true,
        fileHandle: uploadResult.h,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during upload',
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

// Factory function to create Meta upload service
export function createMetaUploadService(appId: string, accessToken: string): MetaFileUploadService {
  return new MetaFileUploadService(appId, accessToken);
}
