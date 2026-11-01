import { createAction, Property } from '@activepieces/pieces-framework';
import { csvProps } from '../common/csv-props';
import { csvUtils } from '../common/csv-utils';
import { csvResultOutputSchema } from '../output-schemas';

export const selectCsvColumnsAction = createAction({
  audience: 'both',
  name: 'select_csv_columns',
  classification: 'READ',
  displayName: 'Select Columns',
  description: 'Keeps, reorders or removes columns in CSV text.',
  aiMetadata: {
    description:
      'Returns CSV text with only the listed columns in the listed order, or with the listed columns removed when the mode is Remove. Pick this to trim or reorder columns before exporting or inserting rows elsewhere. The CSV must have a header row and every listed column must exist, otherwise it fails with the real column names; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    csv_text: csvProps.csvText(),
    delimiter: csvProps.inputDelimiter(),
    columns: Property.Array({
      displayName: 'Columns',
      description: 'Column names as in the header. Keep mode uses this order.',
      required: true,
    }),
    mode: Property.StaticDropdown<SelectMode, false>({
      displayName: 'Mode',
      required: false,
      defaultValue: 'keep',
      options: {
        options: [
          { label: 'Keep only these columns', value: 'keep' },
          { label: 'Remove these columns', value: 'remove' },
        ],
      },
    }),
  },
  outputSchema: csvResultOutputSchema,
  async run(context) {
    const { csv_text, delimiter, columns, mode } = context.propsValue;
    const parsed = csvUtils.parseCsv({ text: csvUtils.assertCsvText({ value: csv_text }), delimiter });
    const requested = csvUtils.toStringList(columns);
    if (requested.length === 0) {
      throw new Error('List at least one column.');
    }
    const matched = [
      ...new Set(requested.map((c) => csvUtils.findColumn({ headers: parsed.headers, requested: c }))),
    ];
    const removed = new Set(matched);
    const headers = mode === 'remove' ? parsed.headers.filter((h) => !removed.has(h)) : matched;
    const rows = parsed.rows.map((row) => Object.fromEntries(headers.map((h) => [h, row[h] ?? ''])));
    return csvUtils.toCsvResult({ headers, rows, delimiter: parsed.delimiter });
  },
});

type SelectMode = 'keep' | 'remove';
