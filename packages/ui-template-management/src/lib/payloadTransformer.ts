/**
 * Payload Transformation Utility
 * Converts internal template format to Meta API format
 */

import { CreateTemplatePayload, TemplateComponent, AuthTemplateComponent } from '../types/templateTypes';

export interface MetaTemplatePayload {
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  parameter_format?: 'NAMED' | 'POSITIONAL';
  message_send_ttl_seconds?: number;
  components: MetaTemplateComponent[];
}

export interface MetaTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | 'CAROUSEL' | 'LIMITED_TIME_OFFER' | 'CALL_PERMISSION_REQUEST';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'PRODUCT';
  text?: string;
  buttons?: MetaTemplateButton[];
  example?: any;
  add_security_recommendation?: boolean;
  code_expiration_minutes?: number;
  limited_time_offer?: {
    text: string;
    has_expiration?: boolean;
  };
  cards?: any[];
}

export interface MetaTemplateButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY' | 'COPY_CODE' | 'OTP' | 'SPM' | 'MPM';
  text?: string;
  url?: string;
  phone_number?: string;
  example?: string;
  otp_type?: 'one_tap' | 'zero_tap' | 'copy_code';
  autofill_text?: string;
  zero_tap_terms_accepted?: boolean;
  supported_apps?: {
    package_name: string;
    signature_hash: string;
  }[];
}

export class PayloadTransformer {
  /**
   * Transform internal template payload to Meta API format
   */
  static transformToMeta(payload: CreateTemplatePayload): MetaTemplatePayload {
    // Transform components first
    const components = payload.components.map(component => 
      this.transformComponent(component)
    );

    const metaPayload: MetaTemplatePayload = {
      name: payload.name,
      language: payload.language,
      category: payload.category,
      components,
    };

    // Add optional fields
    if ('parameter_format' in payload && payload.parameter_format) {
      metaPayload.parameter_format = payload.parameter_format as 'NAMED' | 'POSITIONAL';
    }

    if ('message_send_ttl_seconds' in payload && payload.message_send_ttl_seconds) {
      metaPayload.message_send_ttl_seconds = payload.message_send_ttl_seconds;
    }

    return metaPayload;
  }

  /**
   * Transform individual component
   */
  private static transformComponent(component: any): MetaTemplateComponent {
    const metaComponent: MetaTemplateComponent = {
      type: component.type.toUpperCase() as any,
    };

    // Transform component-specific fields
    switch (component.type.toLowerCase()) {
      case 'header':
        const headerComp = component as any;
        if (headerComp.format) {
          metaComponent.format = headerComp.format.toUpperCase() as any;
        }
        if (headerComp.text) {
          metaComponent.text = headerComp.text;
        }
        if (headerComp.example) {
          metaComponent.example = headerComp.example;
        }
        break;

      case 'body':
        const bodyComp = component as any;
        if (bodyComp.text) {
          metaComponent.text = bodyComp.text;
        }
        if (bodyComp.example) {
          metaComponent.example = bodyComp.example;
        }
        if (bodyComp.add_security_recommendation !== undefined) {
          metaComponent.add_security_recommendation = bodyComp.add_security_recommendation;
        }
        break;

      case 'footer':
        const footerComp = component as any;
        if (footerComp.text) {
          metaComponent.text = footerComp.text;
        }
        if (footerComp.code_expiration_minutes !== undefined) {
          metaComponent.code_expiration_minutes = footerComp.code_expiration_minutes;
        }
        break;

      case 'buttons':
        const buttonsComp = component as any;
        if (buttonsComp.buttons) {
          metaComponent.buttons = buttonsComp.buttons.map((button: any) => 
            this.transformButton(button)
          );
        }
        break;

      case 'limited_time_offer':
        const ltoComp = component as any;
        if (ltoComp.limited_time_offer) {
          metaComponent.limited_time_offer = ltoComp.limited_time_offer;
        }
        break;

      case 'carousel':
        const carouselComp = component as any;
        if (carouselComp.cards) {
          metaComponent.cards = carouselComp.cards;
        }
        break;
    }

    return metaComponent;
  }

  /**
   * Transform individual button
   */
  private static transformButton(button: any): MetaTemplateButton {
    const metaButton: MetaTemplateButton = {
      type: button.type.toUpperCase() as any,
    };

    // Transform button-specific fields
    switch (button.type.toLowerCase()) {
      case 'url':
        if (button.text) metaButton.text = button.text;
        if (button.url) metaButton.url = button.url;
        if (button.example) metaButton.example = button.example;
        break;

      case 'phone_number':
        if (button.text) metaButton.text = button.text;
        if (button.phone_number) metaButton.phone_number = button.phone_number;
        break;

      case 'quick_reply':
        if (button.text) metaButton.text = button.text;
        break;

      case 'copy_code':
        if (button.example) metaButton.example = button.example;
        break;

      case 'otp':
        if (button.text) metaButton.text = button.text;
        if (button.otp_type) metaButton.otp_type = button.otp_type;
        if (button.autofill_text) metaButton.autofill_text = button.autofill_text;
        if (button.zero_tap_terms_accepted !== undefined) {
          metaButton.zero_tap_terms_accepted = button.zero_tap_terms_accepted;
        }
        if (button.supported_apps) {
          metaButton.supported_apps = button.supported_apps;
        }
        break;

      case 'spm':
      case 'mpm':
        if (button.text) metaButton.text = button.text;
        break;
    }

    return metaButton;
  }

  /**
   * Transform Meta API response back to internal format
   */
  static transformFromMeta(metaPayload: any): CreateTemplatePayload {
    const payload: any = {
      name: metaPayload.name,
      language: metaPayload.language,
      category: metaPayload.category,
    };

    // Add optional fields
    if (metaPayload.parameter_format) {
      payload.parameter_format = metaPayload.parameter_format;
    }

    if (metaPayload.message_send_ttl_seconds) {
      payload.message_send_ttl_seconds = metaPayload.message_send_ttl_seconds;
    }

    // Transform components back to internal format
    payload.components = metaPayload.components.map((component: any) => 
      this.transformComponentFromMeta(component)
    );

    return payload;
  }

  /**
   * Transform Meta component back to internal format
   */
  private static transformComponentFromMeta(metaComponent: any): TemplateComponent | AuthTemplateComponent {
    const component: any = {
      type: metaComponent.type.toLowerCase(),
    };

    // Transform component-specific fields
    switch (metaComponent.type) {
      case 'HEADER':
        if (metaComponent.format) {
          component.format = metaComponent.format.toLowerCase();
        }
        if (metaComponent.text) {
          component.text = metaComponent.text;
        }
        if (metaComponent.example) {
          component.example = metaComponent.example;
        }
        break;

      case 'BODY':
        if (metaComponent.text) {
          component.text = metaComponent.text;
        }
        if (metaComponent.example) {
          component.example = metaComponent.example;
        }
        if (metaComponent.add_security_recommendation !== undefined) {
          component.add_security_recommendation = metaComponent.add_security_recommendation;
        }
        break;

      case 'FOOTER':
        if (metaComponent.text) {
          component.text = metaComponent.text;
        }
        if (metaComponent.code_expiration_minutes !== undefined) {
          component.code_expiration_minutes = metaComponent.code_expiration_minutes;
        }
        break;

      case 'BUTTONS':
        if (metaComponent.buttons) {
          component.buttons = metaComponent.buttons.map((button: any) => 
            this.transformButtonFromMeta(button)
          );
        }
        break;

      case 'LIMITED_TIME_OFFER':
        if (metaComponent.limited_time_offer) {
          component.limited_time_offer = metaComponent.limited_time_offer;
        }
        break;

      case 'CAROUSEL':
        if (metaComponent.cards) {
          component.cards = metaComponent.cards;
        }
        break;
    }

    return component;
  }

  /**
   * Transform Meta button back to internal format
   */
  private static transformButtonFromMeta(metaButton: any): any {
    const button: any = {
      type: metaButton.type.toLowerCase(),
    };

    // Transform button-specific fields
    switch (metaButton.type) {
      case 'URL':
        if (metaButton.text) button.text = metaButton.text;
        if (metaButton.url) button.url = metaButton.url;
        if (metaButton.example) button.example = metaButton.example;
        break;

      case 'PHONE_NUMBER':
        if (metaButton.text) button.text = metaButton.text;
        if (metaButton.phone_number) button.phone_number = metaButton.phone_number;
        break;

      case 'QUICK_REPLY':
        if (metaButton.text) button.text = metaButton.text;
        break;

      case 'COPY_CODE':
        if (metaButton.example) button.example = metaButton.example;
        break;

      case 'OTP':
        if (metaButton.text) button.text = metaButton.text;
        if (metaButton.otp_type) button.otp_type = metaButton.otp_type;
        if (metaButton.autofill_text) button.autofill_text = metaButton.autofill_text;
        if (metaButton.zero_tap_terms_accepted !== undefined) {
          button.zero_tap_terms_accepted = metaButton.zero_tap_terms_accepted;
        }
        if (metaButton.supported_apps) {
          button.supported_apps = metaButton.supported_apps;
        }
        break;

      case 'SPM':
      case 'MPM':
        if (metaButton.text) button.text = metaButton.text;
        break;
    }

    return button;
  }
}

export default PayloadTransformer;

