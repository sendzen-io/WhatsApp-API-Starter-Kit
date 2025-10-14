
// Buttons
export interface UrlButton {
  type: 'url';
  text: string;
  url: string;
  example?: string[];
}

export interface PhoneNumberButton {
  type: 'phone_number';
  text: string;
  phone_number: string;
}

export interface QuickReplyButton {
  type: 'quick_reply' | 'QUICK_REPLY';
  text: string;
}

export interface CopyCodeButton {
  type: 'copy_code' | 'COPY_CODE';
  example: string;
}

export type TemplateButton = UrlButton | PhoneNumberButton | QuickReplyButton | CopyCodeButton;

// Components
export interface HeaderTextComponent {
  type: 'header';
  format: 'text';
  text: string;
  example?: {
    header_text: string[];
  }
}

export interface HeaderMediaComponent {
  type: 'header';
  format: 'image' | 'video' | 'document';
  example: {
    header_handle: [string];
  }
}


export interface HeaderLocationComponent {
  type: 'header';
  format: 'location';
}

export interface HeaderProductComponent {
  type: 'header';
  format: 'product';
}

export type HeaderComponent = HeaderTextComponent | HeaderMediaComponent | HeaderLocationComponent | HeaderProductComponent;

export interface BodyComponent {
  type: 'body';
  text: string;
  example?: {
    body_text?: string[][];
    body_text_named_params?: {
      param_name: string;
      example: string;
    }[];
  };
}

export interface FooterComponent {
  type: 'footer';
  text: string;
}

export interface ButtonsComponent {
  type: 'buttons';
  buttons: TemplateButton[];
}

export interface LimitedTimeOfferComponent {
  type: 'limited_time_offer';
  limited_time_offer: {
    text: string;
    has_expiration?: boolean;
  };
}

// Media Carousel Template
export type MediaCarouselButton = UrlButton | PhoneNumberButton | QuickReplyButton;

export interface MediaCarouselCard {
  components: (
    | {
      type: 'header';
      format: 'image' | 'video';
      example: {
        header_handle: [string];
      };
    }
    | {
      type: 'buttons';
      buttons: MediaCarouselButton[];
    }
  )[];
}

// Product Carousel Template
export interface SPMButton {
  type: 'spm';
  text: string;
}

export type ProductCarouselButton = SPMButton | UrlButton;

export interface ProductCarouselCard {
  components: (
    | HeaderProductComponent
    | {
      type: 'buttons';
      buttons: ProductCarouselButton[];
    }
  )[];
}

// Generic Carousel Component
export interface CarouselComponent {
  type: 'carousel';
  cards: (MediaCarouselCard | ProductCarouselCard)[];
}

export type TemplateComponent =
  | HeaderComponent
  | BodyComponent
  | FooterComponent
  | ButtonsComponent
  | LimitedTimeOfferComponent
  | CarouselComponent;

// Main Template Interface
export interface CustomMarketingTemplate {
  name: string;
  language: string;
  category: 'MARKETING';
  parameter_format?: string;
  components: TemplateComponent[];
}

// Catalog Template
export interface CatalogButton {
  type: 'CATALOG';
  text: string;
}

export type CatalogTemplateComponent = BodyComponent | FooterComponent | {
  type: 'BUTTONS';
  buttons: CatalogButton[];
};

export interface CatalogTemplate {
  name: string;
  language: string;
  category: 'MARKETING';
  components: CatalogTemplateComponent[];
}

// Authentication Template
export interface AuthBodyComponent {
  type: 'body';
  add_security_recommendation?: boolean;
}

export interface AuthFooterComponent {
  type: 'footer';
  code_expiration_minutes?: number;
}

export interface AuthOneTapButton {
  type: 'otp';
  otp_type: 'one_tap';
  text?: string; // copy_code_button_text
  autofill_text?: string;
  supported_apps: {
    package_name: string;
    signature_hash: string;
  }[];
}

export interface AuthZeroTapButton {
  type: 'otp';
  otp_type: 'zero_tap';
  text?: string; // copy_code_button_text
  autofill_text?: string;
  zero_tap_terms_accepted: boolean;
  supported_apps: {
    package_name: string;
    signature_hash: string;
  }[];
}

export interface AuthCopyCodeButton {
  type: 'otp';
  otp_type: 'copy_code';
  text?: string;
}

export type AuthOtpButton = AuthOneTapButton | AuthZeroTapButton | AuthCopyCodeButton;

export interface AuthButtonsComponent {
  type: 'buttons';
  buttons: AuthOtpButton[];
}

export type AuthTemplateComponent = AuthBodyComponent | AuthFooterComponent | AuthButtonsComponent;

export interface AuthenticationTemplate {
  name: string;
  language: string;
  category: 'AUTHENTICATION';
  message_send_ttl_seconds?: number;
  components: AuthTemplateComponent[];
}

// Call Permission Request Template
export interface CallPermissionRequestComponent {
  type: 'call_permission_request';
}

export type CallPermissionRequestTemplateComponent = BodyComponent | CallPermissionRequestComponent;

export interface CallPermissionRequestTemplate {
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY';
  components: CallPermissionRequestTemplateComponent[];
}

// MPM Template
export interface MPMButton {
  type: 'MPM';
  text: string;
}

export type MPMTemplateComponent = HeaderTextComponent | BodyComponent | FooterComponent | {
  type: 'BUTTONS';
  buttons: MPMButton[];
};

export interface MPMTemplate {
  name: string;
  language: string;
  category: 'MARKETING';
  components: MPMTemplateComponent[];
}

export type SPMTemplateComponent = HeaderProductComponent | BodyComponent | FooterComponent | {
  type: 'BUTTONS';
  buttons: SPMButton[];
};

// SPM Template
export interface SPMTemplate {
  name: string;
  language: string;
  category: 'MARKETING';
  components: SPMTemplateComponent[];
}

// Utility Template
export interface UtilityTemplate {
  name: string;
  language: string;
  category: 'UTILITY';
  parameter_format?: string;
  components: TemplateComponent[];
}

// You can add more template types here and create a union type
export type CreateTemplatePayload =
  | CustomMarketingTemplate
  | CatalogTemplate
  | AuthenticationTemplate
  | CallPermissionRequestTemplate
  | MPMTemplate
  | SPMTemplate
  | UtilityTemplate;

export interface CreateTemplateResponse {
  id: string;
  status: string;
  category: string;
}


// --- GET All Templates Response Types ---

export interface Paging {
  cursors: {
    before: string;
    after: string;
  };
  next?: string;
}

export interface ResponseUrlButton {
  type: 'URL';
  text: string;
  url: string;
}

export interface ResponsePhoneNumberButton {
  type: 'PHONE_NUMBER';
  text: string;
  phone_number: string;
}

export interface ResponseQuickReplyButton {
  type: 'QUICK_REPLY';
  text: string;
}

export interface ResponseFlowButton {
  type: 'FLOW';
  text: string;
  flow_id: number;
  flow_action: string;
  navigate_screen: string;
}

export interface ResponseSPMButton {
  type: 'SPM';
  text: string;
}

export type ResponseButton = ResponseUrlButton | ResponsePhoneNumberButton | ResponseQuickReplyButton | ResponseFlowButton | ResponseSPMButton;

interface ResponseHeaderTextComponent {
  type: 'HEADER';
  format: 'TEXT';
  text: string;
  example?: {
    header_text: string[];
  };
}

interface ResponseHeaderMediaComponent {
  type: 'HEADER';
  format: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  example: {
    header_handle: string[];
  };
}

interface ResponseHeaderLocationComponent {
  type: 'HEADER';
  format: 'LOCATION';
}

interface ResponseHeaderProductComponent {
  type: 'HEADER';
  format: 'PRODUCT';
}

export type ResponseHeaderComponent =
  | ResponseHeaderTextComponent
  | ResponseHeaderMediaComponent
  | ResponseHeaderLocationComponent
  | ResponseHeaderProductComponent;

export interface ResponseBodyComponent {
  type: 'BODY';
  text: string;
  add_security_recommendation?: boolean;
  example?: {
    body_text?: string[][];
    body_text_named_params?: {
      param_name: string;
      example: string;
    }[];
  };
}

export interface ResponseFooterComponent {
  type: 'FOOTER';
  text: string;
  code_expiration_minutes?: number;
}

export interface ResponseButtonsComponent {
  type: 'BUTTONS';
  buttons: ResponseButton[];
}

export interface ResponseCarouselCard {
  components: (ResponseHeaderComponent | ResponseButtonsComponent)[];
}

export interface ResponseCarouselComponent {
  type: 'CAROUSEL';
  cards: ResponseCarouselCard[];
}

export type ResponseComponent =
  | ResponseHeaderComponent
  | ResponseBodyComponent
  | ResponseFooterComponent
  | ResponseButtonsComponent
  | ResponseCarouselComponent;

export interface MessageTemplate {
  id: string;
  name: string;
  components?: ResponseComponent[];
  language: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  message_send_ttl_seconds?: number;
  parameter_format?: "NAMED" | "POSITIONAL";
  sub_category?: string;
}

export interface GetAllTemplatesResponse {
  data: MessageTemplate[];
  paging?: Paging;
}