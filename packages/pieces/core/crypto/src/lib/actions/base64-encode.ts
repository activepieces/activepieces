import { Property, createAction } from '@activepieces/pieces-framework';

export const base64Encode = createAction({
  audience: 'both',
  name: 'base64-encode',
  displayName: 'Base64 Encode',
  description: 'Converts plain text into base64 format.',
  aiMetadata: { description: 'Encodes a plain-text string into base64. Pick this when a downstream API, header or payload field requires base64 (e.g. a Basic-auth credential); use Base64 Decode to reverse it, or Text to Hash if you need a one-way digest rather than reversible encoding. Accepts a text string only, not a binary file; pure computation and idempotent.', idempotent: true },
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      description: 'The text to be encoded.',
      required: true,
    }),
  },
  async run(context) {
    return Buffer.from(context.propsValue.text).toString('base64');
  },
});
