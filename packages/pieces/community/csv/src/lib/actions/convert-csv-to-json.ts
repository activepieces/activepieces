import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil, isString } from '@activepieces/shared';

export const csvToJsonAction = createAction({
  name: 'convert_csv_to_json',
  displayName: 'Convert CSV to JSON',
  description:
    'This function reads a CSV string and converts it into JSON array format.',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    csv_text: Property.LongText({
      displayName: 'CSV Text',
      defaultValue: '',
      required: true,
    }),
    has_headers: Property.Checkbox({
      displayName: 'Does the CSV have headers?',
      defaultValue: false,
      required: true,
    }),
    delimiter_type: Property.StaticDropdown({
      displayName: 'Delimiter Type',
      description: 'Select the delimiter type for the CSV text.',
      defaultValue: '',
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
    const { csv_text, has_headers, delimiter_type } = context.propsValue;
    if (!isString(csv_text)) {
      throw new Error(JSON.stringify({
        message: 'The input should be a string.',
      }))
    }
    return csvToJson(csv_text, has_headers, delimiter_type);
  },
});

function csvToJson(csv_text: string, has_headers: boolean, delimiter_type: string) {
  if (isNil(csv_text)) {
    return [];
  }
  const rows: string[] = csv_text.split('\n')
  const headers = has_headers ? rows[0].split(delimiter_type) : rows[0].split(',').map((_, index) => `${index + 1}`);
  const data = rows.slice(has_headers ? 1 : 0).map((row) => {
    const values = row.split(delimiter_type);
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index];
      return acc;
    }, {} as Record<string, any>);
  });
  return data;
}