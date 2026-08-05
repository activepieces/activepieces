import { createAction, Property } from '@activepieces/pieces-framework';

export const convertJsonToText = createAction({
  name: 'convert_json_to_text',
  displayName: 'Convert Json to Text',
  description: 'Stringifies JSON.',
  audience: 'both',
  aiMetadata: { description: 'Serialize a JSON object or array into its string form, for downstream steps that need raw text rather than structured data — a request body, a file body, or a plain text field. Use convert_text_to_json for the reverse direction, run_jsonata_query when the data needs reshaping rather than stringifying, and merge_json to fold several objects into one first. Read-only and idempotent.', idempotent: true },
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
