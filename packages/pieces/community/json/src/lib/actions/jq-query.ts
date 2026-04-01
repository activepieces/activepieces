import { createAction, Property } from '@activepieces/pieces-framework';
import * as jq from 'node-jq';

export const runJqQuery = createAction({
  name: 'run_jq_query',
  displayName: 'Run JQ Query',
  description: 'Use the JQ language to filter, map, and transform complex JSON payloads.',
  props: {
    json: Property.Json({
      displayName: 'JSON Data',
      description: 'Map the array or object you want to manipulate.',
      required: true,
      defaultValue: {},
    }),
    query: Property.ShortText({
      displayName: 'JQ Query',
      description: 'Write a JQ query to manipulate your data. You can filter arrays, extract specific fields, group items by a key, or completely reshape the JSON object into a new format. (e.g., map(select(.status == "active")))',
      required: true,
    }),
  },
  async run(context) {
    const { json, query } = context.propsValue;

    try {
      const parsedJson = typeof json === 'string' ? JSON.parse(json) : json;

      const result = await jq.run(query, parsedJson as any, { 
        input: 'json', 
        output: 'json' 
      });

      return result;
    } catch (error) {
      throw new Error(`JQ Execution Failed. Please check your query syntax. Details: ${(error as Error).message}`);
    }
  },
});