import { Property, createAction } from '@activepieces/pieces-framework';

export const base64Encode = createAction({
  name: 'base64-encode',
  displayName: 'Base64 Encode',
  description: 'Converts plain text into base64 format.',
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
