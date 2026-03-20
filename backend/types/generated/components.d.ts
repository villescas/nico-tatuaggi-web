import type { Schema, Struct } from '@strapi/strapi';

export interface LayoutCareStep extends Struct.ComponentSchema {
  collectionName: 'components_layout_care_steps';
  info: {
    displayName: 'Care Step';
    icon: 'heart';
  };
  attributes: {
    alertText: Schema.Attribute.String;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<['wash', 'hydrate', 'avoid']> &
      Schema.Attribute.DefaultTo<'wash'>;
    image: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LayoutFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_layout_faq_items';
  info: {
    displayName: 'FAQ Item';
    icon: 'question';
  };
  attributes: {
    answerEs: Schema.Attribute.Text & Schema.Attribute.Required;
    questionEs: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LayoutSection extends Struct.ComponentSchema {
  collectionName: 'components_layout_sections';
  info: {
    displayName: 'Section';
    icon: 'layer';
  };
  attributes: {
    imageLayout: Schema.Attribute.Enumeration<['left', 'right', 'bottom']> &
      Schema.Attribute.DefaultTo<'right'>;
    images: Schema.Attribute.Media<'images', true>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'layout.care-step': LayoutCareStep;
      'layout.faq-item': LayoutFaqItem;
      'layout.section': LayoutSection;
    }
  }
}
