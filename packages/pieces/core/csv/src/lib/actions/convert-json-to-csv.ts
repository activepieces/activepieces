import { createAction, Property } from '@activepieces/pieces-framework';
import { flatten } from 'safe-flat';
import { stringify } from "csv-stringify/sync";

const markdown = `
**Notes**:
* The input should be a JSON array.
* The JSON object will be flattened If nested and the keys will be used as headers.
`
export const jsonToCsvAction = createAction({
  name: 'convert_json_to_csv',
  displayName: 'Convert JSON to CSV',
  description: 'This function reads a JSON array and converts it into CSV format.',
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { hide: true },
  },
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
        'Provide a JSON array to convert to CSV format.',
      required: true,
    }),
    delimiter_type: Property.StaticDropdown({
      displayName: 'Delimiter Type',
      description: 'Select the delimiter type for the CSV file.',
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
