import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import jsonata from 'jsonata';

export const runJsonataQuery = createAction({
  name: 'run_jsonata_query',
  classification: 'READ',
  displayName: 'Run JSONata Query',
  description: 'Filter, pick or reshape JSON data with a JSONata expression.',
  audience: 'both',
  aiMetadata: { description: 'Evaluate a JSONata expression against a JSON object, array, or JSON string to filter, extract, group, or reshape it in a single step, covering transformations that would otherwise need custom code. Requires a syntactically valid JSONata expression — an invalid one fails the step, while a valid query that matches nothing returns null. Prefer merge_json to fold an array of objects into one, or convert_text_to_json / convert_json_to_text for plain parsing and stringifying. Read-only and idempotent.', idempotent: true },
  props: {
    json: Property.Json({
      displayName: 'JSON Data',
      description: 'The object or array to query, usually from an earlier step.',
      required: true,
      defaultValue: {},
    }),
    syntax: Property.MarkDown({
      value: 'Learn the query syntax at [docs.jsonata.org](https://docs.jsonata.org).',
      variant: MarkdownVariant.INFO,
    }),
    query: Property.ShortText({
      displayName: 'JSONata Query',
      description: 'The step returns the result; no match returns null.',
      placeholder: '$[status="active"].name',
      required: true,
    }),
  },
  async run(context) {
    const { json, query } = context.propsValue;

    const parsedJson = typeof json === 'string' ? parseData(json) : json;

    try {
      const expression = jsonata(query);

      const result = await expression.evaluate(parsedJson);

      return result === undefined ? null : result;
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`JSONata Execution Failed. Please check your query syntax. Details: ${message}`);
    }
  },
});

function parseData(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    throw new Error('JSON Data is not valid JSON.');
  }
}
