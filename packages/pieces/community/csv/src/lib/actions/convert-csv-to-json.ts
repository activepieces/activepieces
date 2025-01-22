import { createAction, Property } from '@activepieces/pieces-framework';
import { isString } from '@activepieces/shared';
import {parse} from 'csv-parse/sync';

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

    const records = parse(csv_text,{delimiter: delimiter_type,columns: has_headers ? true : false});
    return records;
  },
});