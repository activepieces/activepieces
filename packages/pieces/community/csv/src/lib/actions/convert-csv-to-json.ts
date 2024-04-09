import { createAction, Property } from '@activepieces/pieces-framework';
import { parseCSVFile } from '../utils';

export const parseCSVTextAction = createAction({
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
      displayName: 'CSV contains headers',
      defaultValue: false,
      required: true,
    }),
    delimiter_type: Property.StaticDropdown({
      displayName: 'Delimiter Type',
      description: 'Will try to guess the delimiter',
      defaultValue: '',
      required: true,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Comma', value: ',' },
          { label: 'Tab', value: '\t' },
        ],
      },
    }),
  },
  async run(context) {
    const { csv_text, has_headers, delimiter_type } = context.propsValue;
    const config = {
      header: has_headers,
      delimiter: delimiter_type === 'auto' ? '' : delimiter_type,
      skipEmptyLines: true,
    };
    return parseCSVFile(csv_text, config);
  },
});
