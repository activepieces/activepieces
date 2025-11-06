import { createAction, Property } from '@activepieces/pieces-framework';

export const convertTextToJson = createAction({
  name: 'convert_text_to_json',
  displayName: 'Convert Text to Json',
  description: 'Parses text into JSON.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      defaultValue: '',
      required: true,
    }),
  },
  async run(context) {
    const { text } = context.propsValue;
    const result = JSON.parse(text)
    return result
  },
});
