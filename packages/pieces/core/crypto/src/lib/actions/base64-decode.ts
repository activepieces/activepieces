import { Property, createAction } from '@activepieces/pieces-framework';

export const base64Decode = createAction({
  name: 'base64-decode',
  displayName: 'Base64 Decode',
  description:'Converts base64 text back to plain text.',
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
