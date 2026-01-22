import { createAction, Property } from '@activepieces/pieces-framework';

export const convertJsonToText = createAction({
  name: 'convert_json_to_text',
  displayName: 'Convert Json to Text',
  description: 'Stringifies JSON.',
  props: {
    json: Property.Json({
      displayName: 'JSON',
      defaultValue: {},
      required: true,
    }),
  },
  async run(context) {
    const { json } = context.propsValue;
    const result = JSON.stringify(json)
    return result
  },
});
