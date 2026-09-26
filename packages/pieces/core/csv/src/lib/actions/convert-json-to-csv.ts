import { createAction, Property } from '@activepieces/pieces-framework';
import { flatten } from 'safe-flat';
import { stringify } from "csv-stringify/sync";
import { jsonToCsvActionOutputSchema } from '../output-schemas';

const markdown = `
**Notes**:
* The input should be a JSON array.
* The JSON object will be flattened If nested and the keys will be used as headers.
`
export const jsonToCsvAction = createAction({
  audience: 'both',
  name: 'convert_json_to_csv',
  classification: 'READ',
  displayName: 'Convert JSON to CSV',
  description: 'Turns a list of JSON objects into CSV text, one row per object.',
  aiMetadata: { description: 'Serializes a JSON array into delimited CSV text (comma or tab), flattening nested objects so dotted key paths become the column headers. Use this when preparing tabular data for a file, export, or attachment; use Convert CSV to JSON for the reverse direction. The input must be a JSON array of rows, not a single object, and the header row is always emitted; pure transformation, read-only and idempotent.', idempotent: true },
  props: {
    markdown: Property.MarkDown({
      value: markdown,
    }),
    json_array: Property.Json({
      displayName: 'JSON Array',
      defaultValue: [
        {
          name: 'John',
          age: 30,
          address: {
            street: '123 Main St',
            city: 'Los Angeles',
          }
        },
        {
          name: 'Jane',
          age: 25,
          address: {
            street: '123 Main St',
            city: 'Los Angeles',
          }
        }
      ],
      description:
        'A list of objects, one per row. Map it from an earlier step.',
      required: true,
    }),
    delimiter_type: Property.StaticDropdown({
      displayName: 'Delimiter',
      description: 'The character that separates columns in the CSV output.',
      defaultValue: ',',
      required: true,
      options: {
        options: [
          { label: 'Comma', value: ',' },
          { label: 'Tab', value: '\t' },
        ],
      },
    }),
  },
  outputSchema: jsonToCsvActionOutputSchema,
  async run(context) {
    const { json_array, delimiter_type } = context.propsValue;
    if (!Array.isArray(json_array)) {
      throw new Error(JSON.stringify({
        message: 'The input should be a JSON array.',
      }))
    }
    const flattened = json_array.map((item) => flatten(item) as Record<string, string>);

    return stringify(flattened, {
      header: true,
      delimiter: delimiter_type,
    });
  },
});
