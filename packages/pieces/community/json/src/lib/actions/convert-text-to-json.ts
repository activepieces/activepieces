import { createAction, Property } from '@activepieces/pieces-framework';

export const convertTextToJson = createAction({
  name: 'convert_text_to_json',
  displayName: 'Convert Text to Json',
  description: 'Parses text into JSON.',
  audience: 'both',
  aiMetadata: { description: 'Parse a JSON-formatted string into a real object or array so later steps can reference its fields directly instead of handling raw text; the input must be strictly valid JSON, and malformed text throws rather than returning a partial result. Use convert_json_to_text for the reverse direction, or run_jsonata_query when the data is already structured and needs filtering or reshaping. Read-only and idempotent.', idempotent: true },
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
