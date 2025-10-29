"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
} from "@workspace/ui-core/components/card";
import { Button } from "@workspace/ui-core/components/button";
import { Badge } from "@workspace/ui-core/components/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui-core/components/tooltip";
import { Separator } from "@workspace/ui-core/components/separator";
import { Skeleton } from "@workspace/ui-core/components/skeleton";
import {
  Trash2,
  Play,
  Globe,
  Plus,
  FileText,
  ImageIcon,
  Video,
  FileAudio,
  Copy,
  Edit3,
  Eye,
  MoreVertical,
  ExternalLink,
  Phone,
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui-core/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui-core/components/dialog";
import type { ErrorDetails } from "@workspace/ui-template-management/components/TemplateErrorUI";
import TemplateErrorUI from "@workspace/ui-template-management/components/TemplateErrorUI";
import CreateTemplateUI from "./CreateTemplateUI";
import {
  CreateTemplatePayload,
  MessageTemplate,
  ResponseBodyComponent,
  ResponseButton,
  ResponseButtonsComponent,
  ResponseComponent,
  ResponseFooterComponent,
  ResponseHeaderComponent,
} from "../types/templateTypes";

// #region TYPES AND INTERFACES
export interface PaginationInfo {
  cursors: {
    before: string;
    after: string;
  };
  previous?: string;
  next?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TemplateManagerDictionary {
    templates: {
    contains_media: string;
    preview: string;
    edit_template: string;
    copy_content: string;
    delete: string;
    created: string;
    updated: string;
    template_management: string;
    description: string;
    sync_templates: string;
    create_template: string;
    total_templates: string;
    approved: string;
    pending: string;
    templates_count: string;
    no_templates_found: string;
    no_templates_desc: string;
    create_first_template: string;
    rejected: string;
    delete_confirmation: {
      title: string;
      description: string;
      cancel: string;
      confirm: string;
    };
    pagination: {
      previous: string;
      next: string;
      showing: string;
      of: string;
      templates: string;
    };
  };
  createTemplate: {
    title: string;
    description: string;
    templateName: string;
    templateNamePlaceholder: string;
    templateNameHelp: string;
    language: string;
    languagePlaceholder: string;
    category: string;
    categoryPlaceholder: string;
    categories: {
      marketing: string;
      utility: string;
      authentication: string;
    };
    components: string;
    addHeader: string;
    addFooter: string;
    addButtons: string;
    body: string;
    footer: string;
    buttons: string;
    buttonText: string;
    buttonTextPlaceholder: string;
    buttonUrl: string;
    buttonUrlPlaceholder: string;
    buttonPhone: string;
    buttonPhonePlaceholder: string;
    removeComponent: string;
    validation: {
      pleaseFixIssues: string;
      templateSuggestions: string;
      templateStructureGood: string;
      validationError: string;
      fillRequiredFields: string;
      invalidCategory: string;
      templateValidationFailed: string;
      fixIssuesBeforeCreating: string;
    };
    loading: {
      creatingTemplate: string;
      pleaseWait: string;
    };
    cancel: string;
    createTemplate: string;
    authentication: {
      title: string;
      body: string;
      addSecurityRecommendation: string;
      footer: string;
      addFooter: string;
      removeFooter: string;
      codeExpiration: string;
      codeExpirationMinutes: string;
      otpButtons: string;
      addButtons: string;
      removeButtons: string;
      buttonNumber: string;
      copyCode: string;
      oneTap: string;
      zeroTap: string;
      buttonTextOptional: string;
      autofillTextOptional: string;
      supportedApps: string;
      appNumber: string;
      packageName: string;
      packageNamePlaceholder: string;
      signatureHash: string;
      signatureHashPlaceholder: string;
      addApp: string;
      addOtpButton: string;
      zeroTapTermsAccepted: string;
      validation: {
        maxCharacters: string;
        alphanumericUnderscorePeriod: string;
        twoSegmentsRequired: string;
        segmentsStartWithLetter: string;
        exactlyElevenCharacters: string;
        invalidCharacters: string;
      };
    };
  };
}

interface TemplateManagerProps {
  templates: MessageTemplate[]; // This will be the filtered list
  stats: {
    total: number | string; // Can be number or string like "50+"
    approved: number;
    pending: number;
    rejected: number;
    withMedia: number;
  };
  loading: boolean;
  error: string | null;
  totalTemplates: number;
  errorDetails?: ErrorDetails;
  dictionary?: TemplateManagerDictionary;
  deletingTemplateId?: string | null;
  creatingTemplate?: boolean;
  currentFilter: "all" | "approved" | "pending" | "rejected";
  // Pagination props
  pagination?: PaginationInfo;
  onRetry: () => void;
  onSync: () => void;
  onCreate?: (payload: CreateTemplatePayload) => Promise<void>;
  onCreateClick?: () => void; // New prop for custom create button behavior
  onFilterChange: (
    filter: "all" | "approved" | "pending" | "rejected"
  ) => void;
  onPreview: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onCopy: (templateBody: string) => void;
  onDelete: (templateId: string) => void;
  onFileUpload?: (file: File) => Promise<string>;
  // Pagination handlers
  onNextPage?: () => void;
  onPreviousPage?: () => void;
}
// #endregion

// #region FALLBACK DICTIONARY
const fallbackDictionary: TemplateManagerDictionary = {
  templates: {
    contains_media: "Header contains {type}",
    preview: "Preview",
    edit_template: "Edit Template",
    copy_content: "Copy Content",
    delete: "Delete",
    created: "Created",
    updated: "Updated",
    template_management: "Template Management",
    description:
      "Manage your WhatsApp message templates and track their approval status",
    sync_templates: "Sync Templates",
    create_template: "Create New Template",
    total_templates: "Total Templates",
    approved: "Approved",
    pending: "Pending",
    templates_count: "Templates",
    no_templates_found: "No templates found",
    no_templates_desc:
      "Get started by creating your first WhatsApp message template",
    create_first_template: "Create Your First Template",
    rejected: "Rejected",
    delete_confirmation: {
      title: "Delete Template",
      description: "Are you sure you want to delete this template? This action cannot be undone.",
      cancel: "Cancel",
      confirm: "Delete",
    },
    pagination: {
      previous: "Previous",
      next: "Next",
      showing: "Showing",
      of: "of",
      templates: "templates",
    },
  },
  createTemplate: {
    title: "Create New Template",
    description: "Fill in the details to create a new message template.",
    templateName: "Template Name",
    templateNamePlaceholder: "e.g. order_confirmation",
    templateNameHelp: "Lowercase letters, numbers, and underscores only.",
    language: "Language",
    languagePlaceholder: "Select a language",
    category: "Category",
    categoryPlaceholder: "Select a category",
    categories: {
      marketing: "Marketing",
      utility: "Utility",
      authentication: "Authentication",
    },
    components: "Components",
    addHeader: "Add Header",
    addFooter: "Add Footer",
    addButtons: "Add Buttons",
    body: "Body",
    footer: "Footer",
    buttons: "Buttons",
    buttonText: "Button Text",
    buttonTextPlaceholder: "Enter button text",
    buttonUrl: "URL",
    buttonUrlPlaceholder: "https://example.com",
    buttonPhone: "Phone Number",
    buttonPhonePlaceholder: "+1234567890",
    removeComponent: "Remove",
    validation: {
      pleaseFixIssues: "Please fix the following issues:",
      templateSuggestions: "Template suggestions:",
      templateStructureGood: "Template structure looks good! Ready to create.",
      validationError: "Validation Error",
      fillRequiredFields: "Please fill in all required fields before creating the template.",
      invalidCategory: "Invalid template category.",
      templateValidationFailed: "Template Validation Failed",
      fixIssuesBeforeCreating: "Please fix the following issues before creating the template:",
    },
    loading: {
      creatingTemplate: "Creating Template...",
      pleaseWait: "Please wait while we process your template",
    },
    cancel: "Cancel",
    createTemplate: "Create Template",
    authentication: {
      title: "Authentication Components",
      body: "Body",
      addSecurityRecommendation: "Add security recommendation",
      footer: "Footer",
      addFooter: "Add Footer",
      removeFooter: "Remove Footer",
      codeExpiration: "Code Expiration (minutes)",
      codeExpirationMinutes: "Code Expiration (minutes)",
      otpButtons: "OTP Buttons",
      addButtons: "Add Buttons",
      removeButtons: "Remove Buttons",
      buttonNumber: "Button {number}",
      copyCode: "Copy Code",
      oneTap: "One-Tap",
      zeroTap: "Zero-Tap",
      buttonTextOptional: "Button Text (optional)",
      autofillTextOptional: "Autofill Text (optional)",
      supportedApps: "Supported Apps",
      appNumber: "App {number}",
      packageName: "Package Name",
      packageNamePlaceholder: "com.example.app",
      signatureHash: "Signature Hash",
      signatureHashPlaceholder: "11-character hash",
      addApp: "Add App",
      addOtpButton: "Add OTP Button",
      zeroTapTermsAccepted: "Zero-Tap Terms Accepted",
      validation: {
        maxCharacters: "Maximum 224 characters.",
        alphanumericUnderscorePeriod: "Must be alphanumeric, underscore, or period.",
        twoSegmentsRequired: "Must have at least two segments separated by a dot.",
        segmentsStartWithLetter: "Each segment must start with a letter.",
        exactlyElevenCharacters: "Must be exactly 11 characters.",
        invalidCharacters: "Invalid characters. Use A-Z, a-z, 0-9, +, /, or =.",
      },
    },
  },
};
// #endregion

// #region HELPER UI COMPONENTS
const MediaIcon = ({ type }: { type: string }) => {
  switch (type.toLowerCase()) {
    case "image":
      return (
        <ImageIcon className="w-4 h-4 template-media-icon template-media-icon-image" />
      );
    case "video":
      return (
        <Video className="w-4 h-4 template-media-icon template-media-icon-video" />
      );
    case "document":
      return (
        <FileText className="w-4 h-4 template-media-icon template-media-icon-document" />
      );
    case "audio":
      return (
        <FileAudio className="w-4 h-4 template-media-icon template-media-icon-audio" />
      );
    default:
      return (
        <FileText className="w-4 h-4 template-media-icon template-media-icon-default" />
      );
  }
};

const ButtonIcon = ({ type }: { type: ResponseButton["type"] }) => {
  switch (type) {
    case "URL":
      return <ExternalLink className="w-3 h-3" />;
    case "PHONE_NUMBER":
      return <Phone className="w-3 h-3" />;
    case "QUICK_REPLY":
      return <MessageSquare className="w-3 h-3" />;
    default:
      return <MessageSquare className="w-3 h-3" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusFormatted = status.toLowerCase();
  const variants: { [key: string]: string } = {
    approved:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    pending:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    rejected:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  };

  return (
    <Badge
      variant="outline"
      className={`template-status-badge template-status-badge-${statusFormatted} ${variants[statusFormatted] || ""} font-medium capitalize`}
    >
      {status}
    </Badge>
  );
};
// #endregion

// #region TEMPLATE CARD
interface TemplateCardProps {
  template: MessageTemplate;
  isDeleting: boolean;
  onPreview: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onCopy: (templateBody: string) => void;
  onDelete: (templateId: string) => void;
  dictionary: TemplateManagerDictionary;
}

function TemplateCard({
  template,
  isDeleting,
  onPreview,
  onEdit,
  onCopy,
  onDelete,
  dictionary,
}: TemplateCardProps) {
  const dict = dictionary;
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const wasDeletingRef = useRef(isDeleting);
  useEffect(() => {
    // When deletion is finished, close the menu
    if (wasDeletingRef.current && !isDeleting) {
      setMenuOpen(false);
    }
    wasDeletingRef.current = isDeleting;
  }, [isDeleting]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset media state when template changes (for pagination)
  useEffect(() => {
    setMediaError(false);
    setMediaLoaded(false);
    setIsVideoPlaying(false);
  }, [template.id]);

  if (!mounted) {
    return (
      <Card className="h-full max-h-[700px] animate-pulse template-card template-card-loading flex flex-col">
        <div className="h-full bg-muted rounded-lg template-card-loading-content" />
      </Card>
    );
  }

  const getComponent = <T extends ResponseComponent>(
    type: T["type"]
  ): T | undefined => {
    return template.components?.find((c) => c.type === type) as T | undefined;
  };

  const bodyComponent: ResponseBodyComponent | undefined = getComponent("BODY");
  const headerComponent: ResponseHeaderComponent | undefined =
    getComponent("HEADER");
  const footerComponent: ResponseFooterComponent | undefined =
    getComponent("FOOTER");
  const buttonsComponent: ResponseButtonsComponent | undefined =
    getComponent("BUTTONS");

  const handleCopyTemplate = () => onCopy(bodyComponent?.text || "");
  const handlePreviewTemplate = () => onPreview(template.id);
  const handleEditTemplate = () => onEdit(template.id);
  const handleDeleteRequest = (event: Event) => {
    event.preventDefault();
    setShowDeleteConfirmation(true);
    setMenuOpen(false);
  };
  
  const handleConfirmDelete = () => {
    setShowDeleteConfirmation(false);
    onDelete(template.id);
  };
  
  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleButtonClick = (button: ResponseButton) => {
    if (button.type === "URL") {
      window.open(button.url, "_blank");
    } else if (button.type === "PHONE_NUMBER") {
      window.open(`tel:${button.phone_number}`, "_self");
    }
  };

  const handleDocumentClick = () => {
    if (
      headerComponent?.format === "DOCUMENT" &&
      "example" in headerComponent &&
      headerComponent.example?.header_handle?.[0]
    ) {
      window.open(headerComponent.example.header_handle[0], "_blank");
    }
  };

  const renderMedia = () => {
    if (headerComponent?.type !== "HEADER" || !("format" in headerComponent))
      return null;

    if (
      headerComponent.format === "IMAGE" ||
      headerComponent.format === "VIDEO" ||
      headerComponent.format === "DOCUMENT"
    ) {
      const url = headerComponent.example?.header_handle?.[0] || "";
      const alt = `Template ${template.name} media`;

      switch (headerComponent.format) {
        case "IMAGE":
          return (
            <div className="mb-4 rounded-lg overflow-hidden bg-muted/30 template-media-section template-media-section-image">
              {!mediaError ? (
                <Image
                  src={url || "/placeholder.svg"}
                  alt={alt}
                  width={300}
                  height={160}
                  className="w-full h-40 object-cover template-media-image max-h-[200px]"
                  style={{ height: "auto" }}
                  onError={() => setMediaError(true)}
                  onLoad={() => setMediaLoaded(true)}
                />
              ) : (
                <div className="w-full h-40 bg-muted flex items-center justify-center template-media-placeholder">
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Image unavailable
                    </p>
                  </div>
                </div>
              )}
            </div>
          );

        case "VIDEO":
          return (
            <div className="mb-4 rounded-lg overflow-hidden bg-muted/30 template-media-section template-media-section-video border border-border">
              {!mediaError ? (
                <div className="relative template-video-container">
                  <video
                    width={300}
                    height={160}
                    className="w-full h-40 object-cover"
                    controls={isVideoPlaying}
                    poster="/placeholder.svg?height=160&width=300&text=Video"
                    onError={() => setMediaError(true)}
                    onLoadedData={() => setMediaLoaded(true)}
                  >
                    <source src={url} type="video/mp4" />
                    <source src={url} type="video/webm" />
                    <source src={url} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                  {!isVideoPlaying && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center template-video-overlay">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsVideoPlaying(true)}
                        className="bg-white/90 hover:bg-white text-black template-video-play-button"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-40 bg-muted flex items-center justify-center template-media-placeholder">
                  <div className="text-center">
                    <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Video unavailable
                    </p>
                  </div>
                </div>
              )}
            </div>
          );

        case "DOCUMENT":
          return (
            <div className="mb-4 rounded-lg bg-muted/30 template-media-section template-media-section-document">
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={handleDocumentClick}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Document
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Click to view document
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            </div>
          );
      }
    }

    return null;
  };

  return (
    <TooltipProvider>
      <Card className="group h-full max-h-[700px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 hover:border-border template-card template-card-${template.id} flex flex-col">
        <CardHeader className="pb-3 template-card-header flex-shrink-0">
          <div className="flex items-start justify-between template-card-header-top">
            <div className="flex-1 min-w-0 template-card-header-content">
              <div className="flex items-center gap-2 mb-2 template-card-name-section">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground template-name template-name-${template.name} truncate max-w-[200px]">
                  {template.name}
                </code>
                {headerComponent && "format" in headerComponent && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1 text-muted-foreground template-media-indicator flex-shrink-0">
                        <MediaIcon type={headerComponent.format} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {dict.templates.contains_media.replace(
                          "{type}",
                          headerComponent.format
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center justify-between template-card-actions-section">
                <StatusBadge status={template.status} />
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity template-action-menu-trigger flex-shrink-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 template-action-menu"
                  >
                    {/* <DropdownMenuItem
                      onClick={handlePreviewTemplate}
                      className="template-action-preview"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {dict.templates.preview}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleEditTemplate}
                      className="template-action-edit"
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      {dict.templates.edit_template}
                    </DropdownMenuItem> */}
                    <DropdownMenuItem
                      onClick={handleCopyTemplate}
                      className="template-action-copy"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {dict.templates.copy_content}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={handleDeleteRequest}
                      className="text-destructive focus:text-destructive template-action-delete"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {dict.templates.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground template-card-meta">
            <span className="bg-secondary px-2 py-1 rounded-full template-category template-category-${template.category.replace(/\s+/g, '-')} truncate max-w-[120px]">
              {template.category}
            </span>
            <span className="template-meta-separator">•</span>
            <span className="template-language truncate">
              {template.language}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4 flex flex-col flex-1 min-h-0 template-card-content">
          {headerComponent &&
            "text" in headerComponent &&
            headerComponent.text && (
              <div className="mb-3 template-header-section flex-shrink-0">
                <p className="text-sm font-medium text-foreground template-header-text break-words">
                  {headerComponent.text}
                </p>
              </div>
            )}

          <div className="flex-shrink-0">{renderMedia()}</div>

          <div className="flex-1 min-h-0 space-y-3 template-body-section">
            <div className="bg-muted/30 rounded-lg p-3 template-message-body h-full overflow-y-auto">
              <p className="text-sm leading-relaxed text-foreground/90 template-message-text whitespace-pre-wrap break-words">
                {bodyComponent?.text}
              </p>
            </div>
          </div>

          {footerComponent &&
            footerComponent.text &&
            footerComponent.text.trim() && (
              <div className="flex-shrink-0 mt-3">
                <Separator className="mb-2 template-footer-separator" />
                <p className="text-xs text-muted-foreground italic template-footer-text break-words">
                  {footerComponent.text}
                </p>
              </div>
            )}

          {buttonsComponent &&
            "buttons" in buttonsComponent &&
            buttonsComponent.buttons.length > 0 && (
              <div className="flex-shrink-0 mt-4 space-y-2 template-buttons-section">
                <Separator className="template-buttons-separator" />
                <div className="space-y-1.5 template-buttons-container overflow-y-auto max-h-[200px]">
                  {buttonsComponent.buttons.map((button, index) => (
                    <div
                      key={index}
                      onClick={() => handleButtonClick(button)}
                      className="w-full p-2.5 text-center text-sm font-medium bg-brand-green-dim border border-brand-green/20 rounded-md transition-colors text-brand-green template-action-button template-action-button-${index} flex items-center justify-center gap-2 min-h-[40px] cursor-pointer"
                    >
                      <ButtonIcon type={button.type} />
                      <span className="truncate">{button.text}</span>
                      {button.type === "URL" && "url" in button && (
                        <span className="text-xs text-muted-foreground ml-1 truncate max-w-[80px]">
                          ({new URL(button.url).hostname})
                        </span>
                      )}
                      {button.type === "PHONE_NUMBER" &&
                        "phone_number" in button && (
                          <span className="text-xs text-muted-foreground ml-1 truncate">
                            ({button.phone_number})
                          </span>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dict.templates.delete_confirmation.title}</DialogTitle>
            <DialogDescription>
              {dict.templates.delete_confirmation.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <code className="text-sm font-mono bg-background px-2 py-1 rounded text-muted-foreground">
                {template.name}
              </code>
              <StatusBadge status={template.status} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              {dict.templates.delete_confirmation.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {dict.templates.delete_confirmation.confirm}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
// #endregion

// #region SKELETON
function TemplateCardSkeleton() {
  return (
    <Card className="h-full max-h-[700px] template-card-skeleton flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 space-y-4 flex-1 flex flex-col">
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
// #endregion

// #region PAGINATION CONTROLS
interface PaginationControlsProps {
  pagination?: PaginationInfo;
  currentTemplatesCount: number;
  totalTemplates: number;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  dictionary: TemplateManagerDictionary;
}

function PaginationControls({
  pagination,
  currentTemplatesCount,
  totalTemplates,
  onNextPage,
  onPreviousPage,
  dictionary,
}: PaginationControlsProps) {
  if (!pagination) return null;

  const dict = dictionary;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 template-pagination">
      {/* <div className="text-sm text-muted-foreground template-pagination-info">
        {dict.templates.pagination.showing} {currentTemplatesCount} {dict.templates.pagination.of} {totalTemplates} {dict.templates.pagination.templates}
      </div> */}
      
      <div className="flex items-center gap-2 template-pagination-controls">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!pagination.hasPreviousPage}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {dict.templates.pagination.previous}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!pagination.hasNextPage && !pagination.hasPreviousPage ? false : !pagination.hasNextPage ? true : false}
          className="gap-2"
        >
          {dict.templates.pagination.next}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
// #endregion

// #region MAIN COMPONENT
const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  stats,
  loading,
  error,
  errorDetails,
  dictionary: providedDictionary,
  deletingTemplateId,
  creatingTemplate = false,
  currentFilter,
  totalTemplates,
  pagination,
  onRetry,
  onSync,
  onCreate,
  onCreateClick,
  onFilterChange,
  onPreview,
  onEdit,
  onCopy,
  onDelete,
  onFileUpload,
  onNextPage,
  onPreviousPage,
}) => {
  const dict = providedDictionary || fallbackDictionary;
  const [view, setView] = useState<"list" | "create">("list");

  const handleCreateClick = () => {
    if (onCreateClick) {
      // Use custom create behavior (e.g., redirect to route)
      onCreateClick();
    } else {
      // Default behavior (show inline form)
      setView("create");
    }
  };

  const handleCancelCreate = () => {
    setView("list");
  };

  const handleCreateTemplate = async (payload: CreateTemplatePayload) => {
    if (onCreate) {
      await onCreate(payload);
    }
    setView("list");
  };

  if (view === "create") {
    return (
      <CreateTemplateUI
        onCancel={handleCancelCreate}
        onSubmit={handleCreateTemplate}
        dictionary={dict}
        onFileUpload={onFileUpload}
        isLoading={creatingTemplate}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 template-client-container">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 template-header">
          <div className="template-header-content">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-full max-h-[700px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Templates Grid Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <TemplateCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && errorDetails) {
    return <TemplateErrorUI errorDetails={errorDetails} onRetry={onRetry} />;
  }

  return (
    <div className="space-y-8 template-client-container">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 template-header">
        <div className="template-header-content">
          <h1 className="text-3xl font-bold tracking-tight template-title">
            {dict.templates.template_management}
          </h1>
          <p className="text-muted-foreground mt-1 template-description">
            {dict.templates.description}
          </p>
        </div>
        <div className="flex items-center gap-3 template-header-actions">
          <Button
            variant="outline"
            className="gap-2 bg-transparent template-sync-button"
            onClick={onSync}
          >
            <Globe className="w-4 h-4" />
            {dict.templates.sync_templates}
          </Button>
          <Button
            variant="success"
            className="gap-2 template-create-button"
            onClick={handleCreateClick}
          >
            <Plus className="w-4 h-4" />
            {dict.templates.create_template}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 template-stats-grid">
        <Card
          className={`template-stat-card template-stat-card-total cursor-pointer transition-all ${currentFilter === "all" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => onFilterChange("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground template-stat-label">
                  {dict.templates.total_templates}
                </p>
                <p className="text-2xl font-bold template-stat-value template-stat-value-total">
                  {stats.total}
                </p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground template-stat-icon template-stat-icon-total" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`template-stat-card template-stat-card-approved cursor-pointer transition-all ${currentFilter === "approved" ? "ring-2 ring-green-500" : "hover:bg-muted/50"}`}
          onClick={() => onFilterChange("approved")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground template-stat-label">
                  {dict.templates.approved}
                </p>
                <p className="text-2xl font-bold text-green-600 template-stat-value template-stat-value-approved">
                  {stats.approved}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center template-stat-indicator template-stat-indicator-approved">
                <div className="w-3 h-3 rounded-full bg-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`template-stat-card template-stat-card-pending cursor-pointer transition-all ${currentFilter === "pending" ? "ring-2 ring-yellow-500" : "hover:bg-muted/50"}`}
          onClick={() => onFilterChange("pending")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground template-stat-label">
                  {dict.templates.pending}
                </p>
                <p className="text-2xl font-bold text-yellow-600 template-stat-value template-stat-value-pending">
                  {stats.pending}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center template-stat-indicator template-stat-indicator-pending">
                <div className="w-3 h-3 rounded-full bg-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`template-stat-card template-stat-card-rejected cursor-pointer transition-all ${currentFilter === "rejected" ? "ring-2 ring-red-500" : "hover:bg-muted/50"}`}
          onClick={() => onFilterChange("rejected")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground template-stat-label">
                  {dict.templates.rejected}
                </p>
                <p className="text-2xl font-bold text-red-600 template-stat-value template-stat-value-rejected">
                  {stats.rejected}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center template-stat-indicator template-stat-indicator-rejected">
                <div className="w-3 h-3 rounded-full bg-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Grid */}
      <div className="space-y-6 template-grid-section">
        <div className="flex items-center justify-between template-grid-header">
          <h2 className="text-xl font-semibold template-grid-title">
            {dict.templates.templates_count}
          </h2>
          <PaginationControls
          pagination={pagination}
          currentTemplatesCount={templates.length}
          totalTemplates={totalTemplates}
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          dictionary={dict}
        />
        </div>

        {totalTemplates > 0 && templates.length === 0 ? (
          <Card className="template-empty-state">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4 template-empty-icon" />
              <h3 className="text-lg font-semibold mb-2 template-empty-title">
                {dict.templates.no_templates_found}
              </h3>
              {totalTemplates === 0 && (
                <>
                  <p className="text-muted-foreground text-center mb-4 template-empty-description">
                    {dict.templates.no_templates_desc}
                  </p>

                  <Button
                    variant="default"
                    className="gap-2 template-empty-action"
                    onClick={handleCreateClick}
                  >
                    <Plus className="w-4 h-4" />
                    {dict.templates.create_first_template}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 template-grid items-stretch">
            {templates.map((template, index) => (
              <TemplateCard
                key={`${template.id}-${index}`}
                template={template}
                isDeleting={deletingTemplateId === template.id}
                onPreview={onPreview}
                onEdit={onEdit}
                onCopy={onCopy}
                onDelete={onDelete}
                dictionary={dict}
              />
            ))}
          </div>
        )}
        
        {/* Pagination Controls */}
        {/* <PaginationControls
          pagination={pagination}
          currentTemplatesCount={templates.length}
          totalTemplates={totalTemplates}
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          dictionary={dict}
        /> */}
      </div>
    </div>
  );
};
// #endregion

export default TemplateManager;
