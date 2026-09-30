import { Property } from '@activepieces/pieces-framework';

export const TAG_FIELDS = ['name', 'slug', 'description', 'accent_color', 'meta_title', 'meta_description'];

export const tagProps = (mode: 'create' | 'update') => ({
  name: Property.ShortText({
    displayName: 'Name',
    description: 'The tag name. Start it with # to make an internal tag that is hidden from readers.',
    required: mode === 'create',
  }),
  slug: Property.ShortText({
    displayName: 'Slug',
    description: 'The URL slug. Ghost generates one from the name when empty.',
    required: false,
  }),
  description: Property.LongText({
    displayName: 'Description',
    description: 'The tag description shown on its archive page.',
    required: false,
  }),
  accent_color: Property.ShortText({
    displayName: 'Accent Color',
    description: 'A hex color, e.g. #FF5733.',
    required: false,
  }),
  meta_title: Property.ShortText({
    displayName: 'Meta Title',
    description: 'The SEO title of the tag page.',
    required: false,
  }),
  meta_description: Property.LongText({
    displayName: 'Meta Description',
    description: 'The SEO description of the tag page.',
    required: false,
  }),
});
