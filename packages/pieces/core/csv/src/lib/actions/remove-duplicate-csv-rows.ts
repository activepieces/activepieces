import { createAction, Property } from '@activepieces/pieces-framework';
import { csvProps } from '../common/csv-props';
import { CsvRow, csvUtils } from '../common/csv-utils';
import { removeDuplicateCsvRowsOutputSchema } from '../output-schemas';

export const removeDuplicateCsvRowsAction = createAction({
  audience: 'both',
  name: 'remove_duplicate_csv_rows',
  classification: 'READ',
  displayName: 'Remove Duplicate Rows',
  description: 'Removes repeated rows from CSV text, comparing whole rows or chosen columns.',
  aiMetadata: {
    description:
      'Removes duplicate rows from CSV text, treating rows as duplicates when every value matches or, if key columns are given, when just those columns match (for example the same email), keeping the first or the last occurrence and reporting how many were removed. Pick this to clean a list before importing or emailing it; comparison ignores surrounding spaces and is case-sensitive unless turned off. The CSV must have a header row and key columns must exist; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    csv_text: csvProps.csvText(),
    delimiter: csvProps.inputDelimiter(),
    key_columns: Property.Array({
      displayName: 'Compare Columns',
      description:
        'Columns that must match, e.g. "email". Empty compares whole rows.',
      required: false,
    }),
    keep: Property.StaticDropdown<KeepMode, false>({
      displayName: 'Keep',
      required: false,
      defaultValue: 'first',
      options: {
        options: [
          { label: 'First occurrence', value: 'first' },
          { label: 'Last occurrence', value: 'last' },
        ],
      },
    }),
    case_sensitive: Property.Checkbox({
      displayName: 'Case Sensitive',
      description: 'On: "Ann@x.com" and "ann@x.com" are different.',
      required: false,
      defaultValue: true,
    }),
    trim_whitespace: Property.Checkbox({
      displayName: 'Ignore Surrounding Spaces',
      description: 'On: " Ann" and "Ann" count as the same.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: removeDuplicateCsvRowsOutputSchema,
  async run(context) {
    const { csv_text, delimiter, key_columns, keep, case_sensitive, trim_whitespace } =
      context.propsValue;
    const parsed = csvUtils.parseCsv({ text: csvUtils.assertCsvText({ value: csv_text }), delimiter });
    const requested = csvUtils.toStringList(key_columns);
    const keys = requested.length > 0
      ? [...new Set(requested.map((c) => csvUtils.findColumn({ headers: parsed.headers, requested: c })))]
      : parsed.headers;
    const normalize = (value: string) => {
      const trimmed = trim_whitespace === false ? value : value.trim();
      return case_sensitive === false ? trimmed.toLowerCase() : trimmed;
    };
    const signature = (row: CsvRow) => JSON.stringify(keys.map((k) => normalize(row[k] ?? '')));

    const rows = keep === 'last'
      ? keepFirst({ rows: [...parsed.rows].reverse(), signature }).reverse()
      : keepFirst({ rows: parsed.rows, signature });
    return {
      ...csvUtils.toCsvResult({ ...parsed, rows }),
      removed_count: parsed.rows.length - rows.length,
    };
  },
});

function keepFirst({ rows, signature }: { rows: CsvRow[]; signature: (row: CsvRow) => string }): CsvRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = signature(row);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

type KeepMode = 'first' | 'last';
