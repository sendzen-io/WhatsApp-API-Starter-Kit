"use client";

import React, { useState, useEffect } from 'react';
import type { AuthTemplateComponent, AuthBodyComponent, AuthFooterComponent, AuthButtonsComponent, AuthOtpButton } from '../types/templateTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui-core/components/card';
import { Label } from '@workspace/ui-core/components/label';
import { Checkbox } from '@workspace/ui-core/components/checkbox';
import { Input } from '@workspace/ui-core/components/input';
import { Button } from '@workspace/ui-core/components/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@workspace/ui-core/components/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui-core/components/select';

const validatePackageName = (name: string): string | undefined => {
    if (name.length > 224) return "Maximum 224 characters.";
    if (!/^[a-zA-Z0-9_.]+$/.test(name)) return "Must be alphanumeric, underscore, or period.";
    const segments = name.split('.');
    if (segments.length < 2) return "Must have at least two segments separated by a dot.";
    if (segments.some(s => !/^[a-zA-Z]/.test(s))) return "Each segment must start with a letter.";
    return undefined;
};

const validateSignatureHash = (hash: string): string | undefined => {
    if (hash.length !== 11) return "Must be exactly 11 characters.";
    if (!/^[a-zA-Z0-9+/=]+$/.test(hash)) return "Invalid characters. Use A-Z, a-z, 0-9, +, /, or =.";
    return undefined;
};


interface AuthenticationTemplateFormProps {
    onChange: (components: AuthTemplateComponent[], isValid: boolean) => void;
    dictionary?: any;
}

type AppErrors = {
    packageName?: string;
    signatureHash?: string;
}

const AuthenticationTemplateForm: React.FC<AuthenticationTemplateFormProps> = ({ onChange }) => {
    const [body, setBody] = useState<AuthBodyComponent>({ type: 'body', add_security_recommendation: false });
    const [footer, setFooter] = useState<AuthFooterComponent | null>(null);
    const [buttons, setButtons] = useState<AuthButtonsComponent | null>(null);
    const [appErrors, setAppErrors] = useState<AppErrors[][]>([]);

    useEffect(() => {
        const components: AuthTemplateComponent[] = [body];
        if (footer) components.push(footer);
        if (buttons) components.push(buttons);

        const hasErrors = appErrors.some(buttonErrors => buttonErrors.some(appErr => appErr.packageName || appErr.signatureHash));

        onChange(components, !hasErrors);
    }, [body, footer, buttons, onChange, appErrors]);

    const updateAuthButtons = (updatedButtons: AuthOtpButton[]) => {
        if (!buttons) return;
        setButtons({ ...buttons, buttons: updatedButtons });
    };

    const addAuthButton = (otp_type: 'copy_code' | 'one_tap' | 'zero_tap') => {
        let newButton: AuthOtpButton;
        switch (otp_type) {
            case 'one_tap':
                newButton = { type: 'otp', otp_type: 'one_tap', supported_apps: [] };
                break;
            case 'zero_tap':
                newButton = { type: 'otp', otp_type: 'zero_tap', zero_tap_terms_accepted: false, supported_apps: [] };
                break;
            case 'copy_code':
            default:
                newButton = { type: 'otp', otp_type: 'copy_code' };
                break;
        }
        if (buttons) {
            updateAuthButtons([...buttons.buttons, newButton]);
        }
    };

    const removeAuthButton = (index: number) => {
        if (buttons) {
            updateAuthButtons(buttons.buttons.filter((_, i) => i !== index));
        }
    };

    const updateAuthButton = (index: number, updatedButton: AuthOtpButton) => {
        if (buttons) {
            updateAuthButtons(buttons.buttons.map((b, i) => i === index ? updatedButton : b));
        }
    };
    
    const handleButtonTypeChange = (index: number, newType: 'copy_code' | 'one_tap' | 'zero_tap') => {
        if (!buttons) return;
        const oldButton = buttons.buttons[index];
        if (!oldButton) return;
        
        let newButton: AuthOtpButton;

        const text = 'text' in oldButton ? oldButton.text : '';
        const autofill_text = 'autofill_text' in oldButton ? oldButton.autofill_text : '';
        const supported_apps = 'supported_apps' in oldButton ? oldButton.supported_apps : [];
        const zero_tap_terms_accepted = 'zero_tap_terms_accepted' in oldButton ? oldButton.zero_tap_terms_accepted : false;

        switch(newType) {
            case 'copy_code':
                newButton = { type: 'otp', otp_type: 'copy_code', text: 'Copy Code' };
                break;
            case 'one_tap':
                newButton = { type: 'otp', otp_type: 'one_tap', text, autofill_text, supported_apps };
                break;
            case 'zero_tap':
                newButton = { type: 'otp', otp_type: 'zero_tap', text, autofill_text, supported_apps, zero_tap_terms_accepted };
                break;
        }
        updateAuthButton(index, newButton);
    }
    
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">Authentication Components</h3>
            
            <Card>
                <CardHeader>
                    <CardTitle>Body</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="security-recommendation" 
                            checked={body.add_security_recommendation} 
                            onCheckedChange={(checked) => setBody({ ...body, add_security_recommendation: !!checked })}
                        />
                        <Label htmlFor="security-recommendation">Add security recommendation</Label>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Footer</CardTitle>
                        {!footer ? (
                           <Button variant="outline" size="sm" onClick={() => setFooter({ type: 'footer' })}><PlusCircle className="h-4 w-4 mr-2"/>Add Footer</Button>
                        ) : (
                           <Button variant="ghost" size="sm" onClick={() => setFooter(null)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        )}
                    </div>
                </CardHeader>
                {footer && (
                    <CardContent className="space-y-2">
                        <Label htmlFor="code-expiration">Code Expiration (minutes)</Label>
                        <Input 
                            id="code-expiration" 
                            type="number" 
                            value={footer.code_expiration_minutes || ''}
                            onChange={e => setFooter({ ...footer, code_expiration_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                        />
                    </CardContent>
                )}
            </Card>

             <Card>
                <CardHeader>
                     <div className="flex justify-between items-center">
                        <CardTitle>OTP Buttons</CardTitle>
                        {!buttons ? (
                            <Button variant="outline" size="sm" onClick={() => setButtons({ type: 'buttons', buttons: [] })}><PlusCircle className="h-4 w-4 mr-2"/>Add Buttons</Button>
                        ) : (
                             <Button variant="ghost" size="sm" onClick={() => setButtons(null)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        )}
                    </div>
                </CardHeader>
                {buttons && (
                    <CardContent className="space-y-4">
                        {buttons.buttons.map((button, index) => (
                            <Card key={index} className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label>Button {index + 1}</Label>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAuthButton(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                                <Select value={button.otp_type} onValueChange={(value: 'copy_code' | 'one_tap' | 'zero_tap') => handleButtonTypeChange(index, value)}>
                                   <SelectTrigger><SelectValue/></SelectTrigger>
                                   <SelectContent>
                                       <SelectItem value="copy_code">Copy Code</SelectItem>
                                       <SelectItem value="one_tap">One-Tap</SelectItem>
                                       <SelectItem value="zero_tap">Zero-Tap</SelectItem>
                                   </SelectContent>
                                </Select>
                                
                                {button.otp_type !== 'copy_code' &&
                                  <Input placeholder="Button Text (optional)" maxLength={25} value={button.text || ''} onChange={e => updateAuthButton(index, {...button, text: e.target.value})} />
                                }
        
                                {(button.otp_type === 'one_tap' || button.otp_type === 'zero_tap') && (
                                    <>
                                        <Input placeholder="Autofill Text (optional)" value={button.autofill_text || ''} onChange={e => updateAuthButton(index, {...button, autofill_text: e.target.value})} />
                                        <div className="space-y-2 pt-2">
                                            <Label>Supported Apps</Label>
                                            {button.supported_apps.map((app, appIndex) => {
                                                const errors = appErrors[index]?.[appIndex] || {};
                                                return (
                                                <div key={appIndex} className="p-3 border rounded-lg bg-muted/50 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <Label className="text-sm font-medium">App {appIndex + 1}</Label>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                                            const newApps = button.supported_apps.filter((_, i) => i !== appIndex);
                                                            updateAuthButton(index, {...button, supported_apps: newApps});

                                                            const newErrors = [...appErrors];
                                                            newErrors[index]?.splice(appIndex, 1);
                                                            setAppErrors(newErrors);
                                                        }}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`pkg-name-${index}-${appIndex}`}>Package Name</Label>
                                                            <Input id={`pkg-name-${index}-${appIndex}`} placeholder="com.example.app" maxLength={224} value={app.package_name} onChange={e => {
                                                                const newApps = [...button.supported_apps];
                                                                newApps[appIndex] = {...app, package_name: e.target.value};
                                                                updateAuthButton(index, {...button, supported_apps: newApps});
                                                                
                                                                const error = validatePackageName(e.target.value);
                                                                const newErrors = [...appErrors];
                                                                if (!newErrors[index]) newErrors[index] = [];
                                                                newErrors[index][appIndex] = {...newErrors[index][appIndex], packageName: error};
                                                                setAppErrors(newErrors);
                                                            }}/>
                                                            {errors.packageName && <p className="text-xs text-destructive mt-1">{errors.packageName}</p>}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`sig-hash-${index}-${appIndex}`}>Signature Hash</Label>
                                                            <Input id={`sig-hash-${index}-${appIndex}`} placeholder="11-character hash" maxLength={11} value={app.signature_hash} onChange={e => {
                                                                const newApps = [...button.supported_apps];
                                                                newApps[appIndex] = {...app, signature_hash: e.target.value};
                                                                updateAuthButton(index, {...button, supported_apps: newApps});

                                                                const error = validateSignatureHash(e.target.value);
                                                                const newErrors = [...appErrors];
                                                                if (!newErrors[index]) newErrors[index] = [];
                                                                newErrors[index][appIndex] = {...newErrors[index][appIndex], signatureHash: error};
                                                                setAppErrors(newErrors);
                                                            }}/>
                                                            {errors.signatureHash && <p className="text-xs text-destructive mt-1">{errors.signatureHash}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )})}
                                            <Button variant="outline" size="sm" onClick={() => {
                                                const newApps = [...button.supported_apps, {package_name: '', signature_hash: ''}];
                                                updateAuthButton(index, {...button, supported_apps: newApps});
                                            }} disabled={button.supported_apps.length >= 5}><PlusCircle className="h-4 w-4 mr-2"/>Add App</Button>
                                        </div>
                                    </>
                                )}
                                 {button.otp_type === 'zero_tap' && (
                                     <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                            id={`zero-tap-terms-${index}`}
                                            checked={button.zero_tap_terms_accepted}
                                            onCheckedChange={(checked) => updateAuthButton(index, {...button, zero_tap_terms_accepted: !!checked})}
                                        />
                                        <Label htmlFor={`zero-tap-terms-${index}`}>Zero-Tap Terms Accepted</Label>
                                     </div>
                                 )}
                            </Card>
                        ))}
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full" disabled={buttons.buttons.length >= 1}><PlusCircle className="h-4 w-4 mr-2"/>Add OTP Button</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => addAuthButton('copy_code')}>Copy Code</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addAuthButton('one_tap')}>One-Tap</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addAuthButton('zero_tap')}>Zero-Tap</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardContent>
                )}
            </Card>
        </div>
    );
};

export default AuthenticationTemplateForm;
