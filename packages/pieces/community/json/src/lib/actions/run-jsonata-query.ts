import { createAction, Property } from '@activepieces/pieces-framework';
import jsonata from 'jsonata';

export const runJsonataQuery = createAction({
  name: 'run_jsonata_query',
  displayName: 'Run JSONata Query',
  description: 'Use the JSONata language to filter, map, and transform complex JSON payloads natively in JavaScript.',
  audience: 'both',
  aiMetadata: { description: 'Evaluate a JSONata expression against a JSON object, array, or JSON string to filter, extract, group, or reshape it in a single step, covering transformations that would otherwise need custom code. Requires a syntactically valid JSONata expression — an invalid one fails the step, while a valid query that matches nothing returns null. Prefer merge_json to fold an array of objects into one, or convert_text_to_json / convert_json_to_text for plain parsing and stringifying. Read-only and idempotent.', idempotent: true },
  props: {
    json: Property.Json({
      displayName: 'JSON Data',
      description: 'Map the array or object you want to manipulate.',
      required: true,
      defaultValue: {},
    }),
    query: Property.ShortText({
      displayName: 'JSONata Query',
      description: 'Write a JSONata expression to manipulate your data. You can filter arrays, extract specific fields, group items, or reshape the JSON. (e.g., $[status="active"])',
      required: true,
    }),
  },
  async run(context) {
    const { json, query } = context.propsValue;

    try {
      const parsedJson = typeof json === 'string' ? JSON.parse(json) : json;

      const expression = jsonata(query);

      const result = await expression.evaluate(parsedJson);

      // JSONata returns `undefined` if a query yields no matches. 
      // We convert this to `null` so Activepieces receives valid, serializable JSON.
      return result === undefined ? null : result;
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`JSONata Execution Failed. Please check your query syntax. Details: ${message}`);
    }
  },
});