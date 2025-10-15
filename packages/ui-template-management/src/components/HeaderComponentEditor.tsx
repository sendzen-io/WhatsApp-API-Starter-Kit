"use client";

import React, { useState } from 'react';
import type { HeaderComponent } from '../types/templateTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui-core/components/card';
import { Button } from '@workspace/ui-core/components/button';
import { Input } from '@workspace/ui-core/components/input';
import { Label } from '@workspace/ui-core/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui-core/components/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui-core/components/tabs';
import { Trash2, Loader2 } from 'lucide-react';
import { fileUploadService, FileUploadService } from '../lib/fileUploadService';
import { useWabaId } from '../hooks/useWabaId';
import FilePreview from './FilePreview';

const MEDIA_CONSTRAINTS = {
    image: {
        types: ['image/jpeg', 'image/png', 'image/jpg'],
        maxSize: 5 * 1024 * 1024, // 5 MB
    },
    video: {
        types: ['video/mp4'],
        maxSize: 16 * 1024 * 1024, // 16 MB
    },
    document: {
        types: [
            'application/pdf',
        ],
        maxSize: 100 * 1024 * 1024, // 100 MB
    },
};

interface HeaderComponentEditorProps {
    component: HeaderComponent;
    index: number;
    updateComponent: (index: number, component: HeaderComponent) => void;
    removeComponent: (index: number) => void;
    onFileUpload?: (file: File) => Promise<string>;
    errors?: Record<string, any>;
}

const HeaderComponentEditor: React.FC<HeaderComponentEditorProps> = ({
    component,
    index,
    updateComponent,
    removeComponent,
    onFileUpload,
    errors,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
    const wabaId = useWabaId();

    const handleFormatChange = (value: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION') => {
        // Reset uploaded file state when changing header type
        setUploadedFile(null);
        setUploadedFileId(null);
        setUploadError(null);
        
        // Clear the file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
        
        if (value === 'TEXT') {
            updateComponent(index, { type: 'HEADER', format: 'TEXT', text: '' });
        } else if (value === 'LOCATION') {
            updateComponent(index, { type: 'HEADER', format: 'LOCATION' });
        } else {
            updateComponent(index, { type: 'HEADER', format: value, example: { header_handle: [''] } });
        }
    };

    const handleTextChange = (newText: string) => {
        const hasVariable = newText.includes('{{1}}');
        const example = hasVariable ? { header_text: [''] } : undefined;
        updateComponent(index, { type: 'HEADER', format: 'TEXT', text: newText, example });
    };

    const handleExampleChange = (value: string) => {
        if (component.format === 'TEXT') {
            updateComponent(index, { ...component, example: { header_text: [value] } });
        }
    };

    const handleMediaExampleChange = (value: string) => {
        if (component.format !== 'TEXT' && component.format !== 'LOCATION') {
            updateComponent(index, { ...component, example: { header_handle: [value] } } as any);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setUploadError(null);

        if (file) {
            // Validate file using the service
            const validation = FileUploadService.validateFile(file);
            if (!validation.isValid) {
                setUploadError(validation.error || 'Invalid file');
                return;
            }

            if (!wabaId) {
                setUploadError('WABA functionality is not available in open source mode. Please use direct file URLs instead.');
                return;
            }

            setIsUploading(true);
            try {
                const result = await fileUploadService.uploadFile(file, wabaId);
                
                if (result.success && result.fileId) {
                    // Store the uploaded file and file ID for preview
                    setUploadedFile(file);
                    setUploadedFileId(result.fileId);
                    // Use the file ID as the URL for the template
                    handleMediaExampleChange(result.fileId);
                } else {
                    setUploadError(result.error || 'File upload failed. Please try again.');
                }
            } catch (error) {
                console.error("File upload failed:", error);
                setUploadError("File upload failed. Please try again.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleFileRemove = () => {
        setUploadedFile(null);
        setUploadedFileId(null);
        setUploadError(null);
        // Clear the file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
        // Clear the media example
        handleMediaExampleChange('');
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Header</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeComponent(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </div>
                 <CardDescription>Add an optional header to your message. This can be text, an image, a video, or a document.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Header Type</Label>
                        <Select value={component.format} onValueChange={handleFormatChange}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TEXT">Text</SelectItem>
                                <SelectItem value="IMAGE">Image</SelectItem>
                                <SelectItem value="VIDEO">Video</SelectItem>
                                <SelectItem value="DOCUMENT">Document</SelectItem>
                                <SelectItem value="LOCATION">Location</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {component.format === 'TEXT' && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label htmlFor={`header-text-${index}`}>Header Text</Label>
                            <Input id={`header-text-${index}`} placeholder="E.g., Your order {{1}} is on its way" value={component.text} onChange={e => handleTextChange(e.target.value)} />
                             <p className="text-sm text-muted-foreground">You can include one variable, like {`{{1}}`}.</p>
                             {errors && errors[`header_${index}`] && <p className="text-sm text-destructive mt-1">{errors[`header_${index}`]}</p>}
                        </div>
                        {component.text.includes('{{1}}') && (
                            <div className="space-y-2">
                                <Label htmlFor={`header-example-${index}`}>Example Value for {`{{1}}`}</Label>
                                <Input id={`header-example-${index}`} placeholder="E.g., #12345" value={component.example?.header_text?.[0] || ''} onChange={e => handleExampleChange(e.target.value)} />
                            </div>
                        )}
                    </div>
                )}
                {(component.format === 'IMAGE' || component.format === 'VIDEO' || component.format === 'DOCUMENT') && (
                     <div className="space-y-4 pt-4 border-t">
                        <Label>Media Source</Label>
                        
                        {/* File Upload Section */}
                        <div className="space-y-2">
                            <Label htmlFor="file-upload">Upload File</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="file-upload" 
                                    type="file" 
                                    onChange={handleFileChange} 
                                    disabled={isUploading || !wabaId} 
                                    accept={MEDIA_CONSTRAINTS[component.format.toLowerCase() as 'image'|'video'|'document'].types.join(',')} 
                                />
                                {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
                            </div>
                            {!wabaId && <p className="text-sm text-yellow-600 mt-2">WABA functionality is not available in open source mode. Please use direct file URLs instead.</p>}
                            <p className="text-sm text-muted-foreground">
                                Max size: {MEDIA_CONSTRAINTS[component.format.toLowerCase() as 'image'|'video'|'document'].maxSize / 1024 / 1024}MB.
                                Supported types: {MEDIA_CONSTRAINTS[component.format.toLowerCase() as 'image'|'video'|'document'].types.map(t => t.split('/')[1]).join(', ')}
                            </p>
                            {uploadError && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
                        </div>

                        {/* File Preview Section */}
                        {uploadedFile && (
                            <div className="space-y-2">
                                <Label className='py-3'>File Preview</Label>
                                <FilePreview 
                                    file={uploadedFile}
                                    fileId={uploadedFileId || undefined}
                                    onRemove={handleFileRemove}
                                />
                            </div>
                        )}

                        {/* Current URL Display (for non-uploaded files) */}
                        {component.example?.header_handle?.[0] && !uploadedFile && !isUploading && !uploadError && (
                            <div className="space-y-2">
                                <Label>Current Media URL</Label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm text-muted-foreground break-all">
                                        {component.example.header_handle[0]}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {/* Media URL validation error */}
                        {errors && errors[`header_${index}`] && (
                            <p className="text-sm text-destructive mt-2">{errors[`header_${index}`]}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default HeaderComponentEditor;
