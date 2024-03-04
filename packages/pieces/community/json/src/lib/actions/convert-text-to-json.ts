import { createAction, Property } from '@activepieces/pieces-framework';

export const convertTextToJson = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'convertTextToJson',
  displayName: 'convert text to json',
  description: 'converts text to json',
  props: {
    text_object: Property.LongText({
      displayName: 'Text',
      defaultValue: '',
      required: true,
    }),
  },
  async run(context) {
    const { text_object } = context.propsValue;
    const result = JSON.parse(text_object)
    console.debug(result)
    return result
  },
});
