import { createAction, Property } from '@activepieces/pieces-framework';
import { csvProps } from '../common/csv-props';
import { csvUtils } from '../common/csv-utils';
import { readCsvFileOutputSchema } from '../output-schemas';

export const readCsvFileAction = createAction({
  audience: 'both',
  name: 'read_csv_file',
  classification: 'READ',
  displayName: 'Read CSV File',
  description: 'Reads a CSV file (for example an email attachment) into rows you can loop over.',
  aiMetadata: {
    description:
      'Parses an uploaded or mapped .csv file into rows keyed by column name, auto-detecting comma, semicolon, tab or pipe delimiters and handling byte-order marks, blank lines, uneven rows and duplicate column names. Pick this when the input is a file; use Convert CSV to JSON or the other CSV actions when you already have CSV text, and Convert Excel to CSV for .xlsx/.xls files. Files up to 20 MB and 100,000 rows; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    file: Property.File({
      displayName: 'CSV File',
      description: 'The .csv file to read. Map a file from an earlier step, or upload one.',
      required: true,
    }),
    has_header_row: Property.Checkbox({
      displayName: 'Has Header Row',
      description:
        'The first row holds column names. Off: column_1, column_2, …',
      required: false,
      defaultValue: true,
    }),
    delimiter: csvProps.inputDelimiter(),
    trim_whitespace: Property.Checkbox({
      displayName: 'Trim Spaces',
      description: 'Remove spaces around each value.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: readCsvFileOutputSchema,
  async run(context) {
    const { file, has_header_row, delimiter, trim_whitespace } = context.propsValue;
    const buffer = csvUtils.fileToBuffer(file);
    csvUtils.assertByteLimit({ bytes: buffer.length, label: 'The file' });
    if (csvUtils.isExcelSignature(buffer)) {
      throw new Error(
        'This looks like an Excel file, not a CSV. Use the "Convert Excel to CSV" action first.',
      );
    }
    const parsed = csvUtils.parseCsv({
      text: csvUtils.decodeText(buffer),
      delimiter,
      hasHeader: has_header_row !== false,
      trim: trim_whitespace === true,
    });
    return {
      rows: parsed.rows,
      row_count: parsed.rows.length,
      headers: parsed.headers,
      delimiter: parsed.delimiter,
    };
  },
});
