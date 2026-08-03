import { Property, createAction } from '@activepieces/pieces-framework';

export const base64Decode = createAction({
  audience: 'both',
  name: 'base64-decode',
  displayName: 'Base64 Decode',
  description:'Converts base64 text back to plain text.',
  aiMetadata: { description: 'Decodes a base64-encoded string back to plain text. Pick this to read a base64 field from an API response or header; use Base64 Encode for the opposite direction, and note that a digest from Text to Hash cannot be reversed this way. Requires a base64 text string rather than a binary file, and invalid base64 characters are silently dropped rather than raising an error; pure computation and idempotent.', idempotent: true },
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      description: 'The text to be decoded.',
      required: true,
    }),
  },
  async run(context) {
    return Buffer.from(context.propsValue.text, 'base64').toString();
  },
});
