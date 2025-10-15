# File Upload Implementation for Template Management

This implementation provides a complete file upload solution for template creation that follows the 3-step API process described in the requirements.

## Overview

The file upload system consists of:

1. **FileUploadService** - Core service handling the 3-step API process
2. **useWabaId Hook** - React hook to get the current WABA ID from the WabaSwitcher
3. **Updated HeaderComponentEditor** - Template component with integrated file upload
4. **FileUploadTest** - Test component to verify functionality

## 3-Step API Process

### Step 1: Get App ID
- Calls `/v1/partner/config/{domain}` to retrieve partner configuration
- Extracts `meta_app_id` from the response
- Caches the result to avoid repeated calls

### Step 2: Create Upload Session
- POST `/v1/{appId}/uploads` with query parameters:
  - `file_name`: Name of the file
  - `file_type`: MIME type of the file
  - `file_length`: File size in bytes
- Request body contains `waba_id` from the selected WABA account
- Returns an upload session ID in `data.id` field

### Step 3: Upload File Data
- POST `/v1/{whatsappBusinessAccountId}/{uploadSession}` with:
  - `Content-Type: application/octet-stream`
  - `file_offset: 0` header
  - File data as binary body
- Returns the final file ID

## Supported File Types

- **PDF**: `application/pdf` (max 100MB)
- **JPEG/JPG**: `image/jpeg` (max 5MB)
- **PNG**: `image/png` (max 5MB)
- **MP4**: `video/mp4` (max 16MB)

## Usage

### Basic Integration

```tsx
import { HeaderComponentEditor } from '@workspace/ui-template-management';

function TemplateCreator() {
  return (
    <HeaderComponentEditor
      component={headerComponent}
      index={0}
      updateComponent={updateComponent}
      removeComponent={removeComponent}
      errors={errors}
    />
  );
}
```

### Using the Service Directly

```tsx
import { fileUploadService } from '@workspace/ui-template-management/lib/fileUploadService';

async function uploadFile(file: File, wabaId: string) {
  const result = await fileUploadService.uploadFile(file, wabaId);
  
  if (result.success) {
    console.log('File uploaded:', result.fileId);
  } else {
    console.error('Upload failed:', result.error);
  }
}
```

### Testing the Implementation

```tsx
import { FileUploadTest } from '@workspace/ui-template-management/components/FileUploadTest';

function TestPage() {
  return <FileUploadTest />;
}
```

## Error Handling

The implementation includes comprehensive error handling:

- **File validation**: Checks file type and size before upload
- **WABA validation**: Ensures a WABA account is selected
- **API errors**: Handles network and server errors gracefully
- **User feedback**: Shows loading states and error messages

## Dependencies

- **WABA Store**: Uses the existing `useWabaStore` to get selected WABA account
- **Partner Config**: Integrates with existing partner configuration system
- **Authentication**: Uses HttpOnly cookies for authentication (same as existing API client)

## File Structure

```
packages/ui-template-management/src/
├── lib/
│   └── fileUploadService.ts          # Core upload service
├── hooks/
│   └── useWabaId.ts                  # WABA ID hook
├── components/
│   ├── HeaderComponentEditor.tsx     # Updated with file upload
│   └── FileUploadTest.tsx            # Test component
```

## Configuration

The service automatically detects the current domain and uses the appropriate partner configuration. For localhost development, it defaults to `app.sendzen.io`.

## Security

- File type validation prevents malicious uploads
- File size limits prevent abuse
- HttpOnly cookies provide secure authentication
- CORS and credentials are properly configured

## Future Enhancements

- Progress tracking for large file uploads
- Resume capability for interrupted uploads
- Batch upload support
- Image preview before upload
- Drag and drop interface
