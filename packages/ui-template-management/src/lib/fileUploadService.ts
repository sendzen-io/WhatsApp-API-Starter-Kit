/**
 * File Upload Service for Template Management
 * Implements the 3-step API process for file uploads
 * Uses dependency injection for API calls to work with the app's authenticated API client
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

export interface PartnerConfig {
  partner_id: string;
  meta_app_id: string;
  meta_partner_config_id: string;
}

// Types for injectable API functions
export type GetPartnerConfigFn = (locationHost: string) => Promise<PartnerConfig>;

export interface CreateUploadSessionParams {
  appId: string;
  fileName: string;
  fileType: string;
  fileLength: number;
  wabaId: string;
}

export interface CreateUploadSessionResponse {
  id: string;
  file_id?: string;
}

export type CreateUploadSessionFn = (params: CreateUploadSessionParams) => Promise<CreateUploadSessionResponse>;

export interface UploadFileDataParams {
  wabaId: string;
  uploadSession: string;
  fileData: ArrayBuffer;
  fileOffset?: number;
}

export interface UploadFileDataResponse {
  h?: string;
  file_id?: string;
}

export type UploadFileDataFn = (params: UploadFileDataParams) => Promise<UploadFileDataResponse>;

export class FileUploadService {
  private appId: string | null = null;
  private partnerConfig: PartnerConfig | null = null;
  
  // Injectable API functions
  private getPartnerConfigFn: GetPartnerConfigFn | null = null;
  private createUploadSessionFn: CreateUploadSessionFn | null = null;
  private uploadFileDataFn: UploadFileDataFn | null = null;

  /**
   * Configure the service with API functions
   * This allows dependency injection of the app's authenticated API client
   */
  configure(options: {
    getPartnerConfig: GetPartnerConfigFn;
    createUploadSession: CreateUploadSessionFn;
    uploadFileData: UploadFileDataFn;
  }): void {
    this.getPartnerConfigFn = options.getPartnerConfig;
    this.createUploadSessionFn = options.createUploadSession;
    this.uploadFileDataFn = options.uploadFileData;
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use configure() instead
   */
  setGetPartnerConfigFn(fn: GetPartnerConfigFn): void {
    this.getPartnerConfigFn = fn;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.getPartnerConfigFn && this.createUploadSessionFn && this.uploadFileDataFn);
  }

  /**
   * Helper function to extract error detail from error messages that may contain JSON
   */
  private extractErrorDetail(errorMessage: string): string {
    try {
      const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const errorData = JSON.parse(jsonStr);
        
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
    } catch {
      // If JSON parsing fails, return the original message
    }
    
    return errorMessage;
  }

  /**
   * Step 1: Get app ID from partner config
   */
  private async getAppId(): Promise<string> {
    if (this.appId) {
      return this.appId;
    }

    if (!this.getPartnerConfigFn) {
      throw new Error('Service not configured. Call configure() first with the API functions.');
    }

    let locationHost = window.location.hostname;
    if (locationHost === 'localhost') {
      locationHost = 'app.sendzen.io';
    } else {
      locationHost = 'app.sendzen.io';
    }

    try {
      const config = await this.getPartnerConfigFn(locationHost);
      this.partnerConfig = config;
      this.appId = config.meta_app_id || null;
      
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
   */
  private async createUploadSession(params: FileUploadParams): Promise<UploadSessionResponse> {
    if (!this.createUploadSessionFn) {
      throw new Error('Service not configured. Call configure() first with the API functions.');
    }

    const appId = await this.getAppId();

    try {
      const response = await this.createUploadSessionFn({
        appId,
        fileName: params.fileName,
        fileType: params.fileType,
        fileLength: params.fileLength,
        wabaId: params.wabaId,
      });
      
      const uploadSession = response.id;
      if (!uploadSession) {
        throw new Error('No upload session ID found in response');
      }
      
      return {
        uploadSession,
        fileId: response.file_id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const cleanError = this.extractErrorDetail(errorMessage);
      throw new Error(cleanError);
    }
  }

  /**
   * Step 3: Upload file data
   */
  private async uploadFileData(
    wabaId: string,
    uploadSession: string,
    file: File,
    fileOffset: number = 0
  ): Promise<FileUploadResult> {
    if (!this.uploadFileDataFn) {
      throw new Error('Service not configured. Call configure() first with the API functions.');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const response = await this.uploadFileDataFn({
        wabaId,
        uploadSession,
        fileData: arrayBuffer,
        fileOffset,
      });
      
      return {
        success: true,
        fileId: response.h || response.file_id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'File upload service not configured. Please ensure the service is properly initialized.',
        };
      }

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
        wabaId,
        uploadSessionResponse.uploadSession,
        file
      );

      return uploadResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during upload';
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
