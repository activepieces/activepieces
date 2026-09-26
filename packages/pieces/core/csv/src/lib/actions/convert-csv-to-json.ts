import { createAction, Property } from '@activepieces/pieces-framework';
import { isString } from '@activepieces/pieces-framework';
import {parse} from 'csv-parse/sync';

export const csvToJsonAction = createAction({
  audience: 'both',
  name: 'convert_csv_to_json',
  classification: 'READ',
  displayName: 'Convert CSV to JSON',
  description:
    'Turns CSV text into a list of rows you can loop over or filter.',
  aiMetadata: { description: 'Parses a CSV or tab-separated text string into a JSON array, treating the first row either as column headers or as plain data depending on the header option. Use this to make CSV text queryable before looping or filtering rows; use Convert JSON to CSV for the reverse direction, and run Convert Excel to CSV first when the source is an .xlsx/.xls file. The chosen delimiter (comma or tab) must match the actual data or columns will not split; read-only and idempotent.', idempotent: true },
  props: {
    csv_text: Property.LongText({
      displayName: 'CSV Text',
      description: 'Paste the CSV, or map text from an earlier step.',
      placeholder: 'name,email,city',
      defaultValue: '',
      required: true,
    }),
    has_headers: Property.Checkbox({
      displayName: 'Has Header Row',
      description: 'On: rows become objects keyed by column name. Off: lists of values.',
      defaultValue: false,
      required: true,
    }),
    delimiter_type: Property.StaticDropdown({
      displayName: 'Delimiter',
      description: 'The character that separates columns in your CSV.',
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