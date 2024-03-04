import { createAction, Property } from '@activepieces/pieces-framework';

export const convertJsonToText = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'convertJsonToText',
  displayName: 'convert json to text',
  description: 'converts json to text',
  props: {
    text_object: Property.Json({
      displayName: 'TEXT JSON',
      defaultValue: {},
      required: true,
    }),
  },
  async run(context) {
    const { text_object } = context.propsValue;
    const result = JSON.stringify(text_object)
    console.debug(result)
    return result
  },
});
