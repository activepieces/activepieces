import { createAction, Property } from '@activepieces/pieces-framework';
import { UnparseConfig } from 'papaparse';
import { unparseCSVObject } from '../utils';

export const unparseCSVTextAction = createAction({
  name: 'convert_json_to_csv',
  displayName: 'Convert JSON to CSV',
  description:
    'This function reads a JSON file and converts it into a CSV file format.',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    csv_object: Property.Json({
      displayName: 'CSV JSON',
      defaultValue: {
        fields: ['ID', 'Name'],
        data: [
          [1, 'John'],
          [2, 'Rashid'],
        ],
      },
      description:
        'Provide column names in the **`fields`** property and column values in the **`data`** property, as shown in the example.',
      required: true,
    }),
    has_headers: Property.Checkbox({
      displayName: 'Should the output CSV include headers?',
      defaultValue: true,
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
    const { csv_object, has_headers, delimiter_type } = context.propsValue;
    const config: UnparseConfig = {
      header: has_headers,
      delimiter: delimiter_type === 'auto' ? '' : delimiter_type,
      skipEmptyLines: true,
    };

    const results = unparseCSVObject(csv_object, config);
    console.debug('Unparse results', results);

    return results;
  },
});
