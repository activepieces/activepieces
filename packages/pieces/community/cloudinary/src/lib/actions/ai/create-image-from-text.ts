import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryCreateImageFromTextOutputSchema } from '../../output-schemas';

export const cloudinaryCreateImageFromText = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_create_image_from_text',
  outputSchema: cloudinaryCreateImageFromTextOutputSchema,
  displayName: 'Create Image from Text',
  description: 'Renders text as a new PNG image asset.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new image asset that renders the given text with optional font, size, color, weight, style, alignment and background. Returns the asset with its public_id and URLs. Not idempotent: each call creates an asset unless the same Public ID is reused.',
    idempotent: false,
  },
  props: {
    text: Property.LongText({ displayName: 'Text', description: 'The text to render.', required: true }),
    public_id: Property.ShortText({ displayName: 'Public ID', description: 'Public ID for the new image. Leave empty for a random ID.', required: false }),
    font_family: Property.ShortText({ displayName: 'Font Family', description: 'Font name (e.g. "Arial"). Defaults to Arial.', required: false }),
    font_size: Property.Number({ displayName: 'Font Size', description: 'Font size in points. Defaults to 12.', required: false }),
    font_color: Property.ShortText({ displayName: 'Font Color', description: 'Color name or hex (e.g. "red", "#FF0000"). Defaults to black.', required: false }),
    font_weight: Property.StaticDropdown({
      displayName: 'Font Weight',
      description: 'Normal or bold.',
      required: false,
      options: { options: [{ label: 'Normal', value: 'normal' }, { label: 'Bold', value: 'bold' }] },
    }),
    font_style: Property.StaticDropdown({
      displayName: 'Font Style',
      description: 'Normal or italic.',
      required: false,
      options: { options: [{ label: 'Normal', value: 'normal' }, { label: 'Italic', value: 'italic' }] },
    }),
    text_align: Property.StaticDropdown({
      displayName: 'Text Align',
      description: 'Alignment for multi-line text.',
      required: false,
      options: { options: ['left', 'center', 'right', 'justify'].map((value) => ({ label: value, value })) },
    }),
    background: Property.ShortText({ displayName: 'Background', description: 'Background color name or hex. Defaults to transparent.', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = {
      text: propsValue.text,
      ...(propsValue.public_id ? { public_id: propsValue.public_id.trim() } : {}),
      ...(propsValue.font_family ? { font_family: propsValue.font_family } : {}),
      ...(propsValue.font_size !== undefined && propsValue.font_size !== null ? { font_size: propsValue.font_size } : {}),
      ...(propsValue.font_color ? { font_color: propsValue.font_color } : {}),
      ...(propsValue.font_weight ? { font_weight: propsValue.font_weight } : {}),
      ...(propsValue.font_style ? { font_style: propsValue.font_style } : {}),
      ...(propsValue.text_align ? { text_align: propsValue.text_align } : {}),
      ...(propsValue.background ? { background: propsValue.background } : {}),
    };
    return makeRequest(auth, HttpMethod.POST, '/image/text', body);
  },
});
