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

    const handleFormatChange = (value: 'text' | 'image' | 'video' | 'document' | 'location') => {
        if (value === 'text') {
            updateComponent(index, { type: 'header', format: 'text', text: '' });
        } else if (value === 'location') {
            updateComponent(index, { type: 'header', format: 'location' });
        } else {
            updateComponent(index, { type: 'header', format: value, example: { header_handle: [''] } });
        }
    };

    const handleTextChange = (newText: string) => {
        const hasVariable = newText.includes('{{1}}');
        const example = hasVariable ? { header_text: [''] } : undefined;
        updateComponent(index, { type: 'header', format: 'text', text: newText, example });
    };

    const handleExampleChange = (value: string) => {
        if (component.format === 'text') {
            updateComponent(index, { ...component, example: { header_text: [value] } });
        }
    };

    const handleMediaExampleChange = (value: string) => {
        if (component.format !== 'text' && component.format !== 'location') {
            updateComponent(index, { ...component, example: { header_handle: [value] } } as any);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setUploadError(null);

        if (file && onFileUpload) {
            const format = component.format as 'image' | 'video' | 'document';
            const constraints = MEDIA_CONSTRAINTS[format];

            if (!constraints.types.includes(file.type)) {
                setUploadError(`Invalid file type. Please select a valid ${format}.`);
                return;
            }

            if (file.size > constraints.maxSize) {
                setUploadError(`File is too large. Max size is ${constraints.maxSize / 1024 / 1024}MB.`);
                return;
            }
            
            setIsUploading(true);
            try {
                const url = await onFileUpload(file);
                handleMediaExampleChange(url);
            } catch (error) {
                console.error("File upload failed:", error);
                setUploadError("File upload failed. Please try again.");
            } finally {
                setIsUploading(false);
            }
        }
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
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                                <SelectItem value="location">Location</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {component.format === 'text' && (
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
                {(component.format === 'image' || component.format === 'video' || component.format === 'document') && (
                     <div className="space-y-2 pt-4 border-t">
                        <Label>Media Source</Label>
                        <div className="pt-4 space-y-2">
                            <Label htmlFor="file-upload">Upload File</Label>
                            <div className="flex items-center gap-2">
                                <Input id="file-upload" type="file" onChange={handleFileChange} disabled={isUploading || !onFileUpload} accept={MEDIA_CONSTRAINTS[component.format as 'image'|'video'|'document'].types.join(',')} />
                                {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
                            </div>
                            {!onFileUpload && <p className="text-sm text-yellow-600 mt-2">File upload is not configured.</p>}
                            <p className="text-sm text-muted-foreground">
                                Max size: {MEDIA_CONSTRAINTS[component.format as 'image'|'video'|'document'].maxSize / 1024 / 1024}MB.
                                Supported types: {MEDIA_CONSTRAINTS[component.format as 'image'|'video'|'document'].types.map(t => t.split('/')[1]).join(', ')}
                            </p>
                            {uploadError && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
                            {component.example?.header_handle?.[0] && !isUploading && !uploadError && <p className="text-sm text-muted-foreground mt-2">Current URL: {component.example.header_handle[0]}</p>}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default HeaderComponentEditor;
