import { Property, createAction } from '@activepieces/pieces-framework';

export const base64Decode = createAction({
  name: 'base64-decode',
  description: 'Decode Base64 text',
  displayName: 'Base64 Decode',
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      description: 'The text to be decoded',
      required: true,
    }),
  },
  async run(context) {
    return Buffer.from(context.propsValue.text, 'base64').toString();
  },
});
