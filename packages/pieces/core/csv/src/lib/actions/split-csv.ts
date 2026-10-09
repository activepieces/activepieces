import { createAction, Property } from '@activepieces/pieces-framework';
import { csvProps } from '../common/csv-props';
import { csvUtils } from '../common/csv-utils';
import { splitCsvOutputSchema } from '../output-schemas';

export const splitCsvAction = createAction({
  audience: 'both',
  name: 'split_csv',
  classification: 'READ',
  displayName: 'Split CSV',
  description: 'Splits CSV text into smaller CSVs with a set number of rows each.',
  aiMetadata: {
    description:
      'Splits CSV text into chunks of a fixed number of rows (1 to 10,000), each chunk a complete CSV that repeats the header row by default, so a Loop can send or upload them one batch at a time. Pick this for data that fits in memory (up to 20 MB); for larger files use Stream CSV to Subflows, which streams the file and runs a subflow per batch. The CSV must have a header row; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    csv_text: csvProps.csvText(),
    delimiter: csvProps.inputDelimiter(),
    rows_per_chunk: Property.Number({
      displayName: 'Rows per Chunk',
      description: 'Data rows per chunk (1 to 10,000), not counting the header.',
      required: true,
      defaultValue: 100,
    }),
    repeat_header: Property.Checkbox({
      displayName: 'Repeat Header Row',
      description: 'Start every chunk with the column names.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: splitCsvOutputSchema,
  async run(context) {
    const { csv_text, delimiter, rows_per_chunk, repeat_header } = context.propsValue;
    const size = Number(rows_per_chunk);
    if (!Number.isInteger(size) || size < 1 || size > MAX_ROWS_PER_CHUNK) {
      throw new Error(`Rows per Chunk must be a whole number from 1 to ${MAX_ROWS_PER_CHUNK}.`);
    }
    const parsed = csvUtils.parseCsv({ text: csvUtils.assertCsvText({ value: csv_text }), delimiter });
    const chunkCount = Math.ceil(parsed.rows.length / size);
    const chunks = Array.from({ length: chunkCount }, (_, i) => {
      const rows = parsed.rows.slice(i * size, (i + 1) * size);
      return {
        index: i + 1,
        csv: csvUtils.serializeCsv({
          headers: parsed.headers,
          rows,
          delimiter: parsed.delimiter,
          includeHeader: repeat_header !== false || i === 0,
        }),
        row_count: rows.length,
      };
    });
    return {
      chunks,
      chunk_count: chunks.length,
      total_rows: parsed.rows.length,
      headers: parsed.headers,
    };
  },
});

const MAX_ROWS_PER_CHUNK = 10_000;
