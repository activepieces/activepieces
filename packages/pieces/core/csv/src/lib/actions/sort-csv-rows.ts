import { createAction, Property } from '@activepieces/pieces-framework';
import { csvProps } from '../common/csv-props';
import { csvUtils } from '../common/csv-utils';
import { csvResultOutputSchema } from '../output-schemas';

export const sortCsvRowsAction = createAction({
  audience: 'both',
  name: 'sort_csv_rows',
  classification: 'READ',
  displayName: 'Sort CSV Rows',
  description: 'Sorts the rows by one column, as text, numbers or dates.',
  aiMetadata: {
    description:
      'Sorts the rows of CSV text by one named column, ascending or descending, comparing as text (natural order, so item2 comes before item10), numbers or dates; blank or unreadable values always go last and rows with equal values keep their order. Pick this before taking the top rows or writing an ordered report; for dates use ISO (2026-09-29) or another unambiguous format. The CSV must have a header row; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    csv_text: csvProps.csvText(),
    delimiter: csvProps.inputDelimiter(),
    column: Property.ShortText({
      displayName: 'Column',
      description: 'The column name to sort by, exactly as in the header row.',
      placeholder: 'created_at',
      required: true,
    }),
    direction: Property.StaticDropdown<SortDirection, false>({
      displayName: 'Direction',
      required: false,
      defaultValue: 'asc',
      options: {
        options: [
          { label: 'Ascending (A → Z, 1 → 9, oldest first)', value: 'asc' },
          { label: 'Descending (Z → A, 9 → 1, newest first)', value: 'desc' },
        ],
      },
    }),
    compare_as: Property.StaticDropdown<CompareAs, false>({
      displayName: 'Compare As',
      description: 'How to compare values. Unreadable values go last.',
      required: false,
      defaultValue: 'text',
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Number', value: 'number' },
          { label: 'Date', value: 'date' },
        ],
      },
    }),
  },
  outputSchema: csvResultOutputSchema,
  async run(context) {
    const { csv_text, delimiter, column, direction, compare_as } = context.propsValue;
    const parsed = csvUtils.parseCsv({ text: csvUtils.assertCsvText({ value: csv_text }), delimiter });
    const target = csvUtils.findColumn({ headers: parsed.headers, requested: column });
    const sign = direction === 'desc' ? -1 : 1;
    const toKey = keyReader(compare_as ?? 'text');

    const keyed = parsed.rows.map((row, index) => ({ row, index, key: toKey(row[target] ?? '') }));
    const sorted = [...keyed].sort((a, b) => {
      if (a.key === null || b.key === null) {
        return a.key === b.key ? a.index - b.index : a.key === null ? 1 : -1;
      }
      const diff = typeof a.key === 'number' && typeof b.key === 'number'
        ? a.key - b.key
        : COLLATOR.compare(String(a.key), String(b.key));
      return diff === 0 ? a.index - b.index : sign * diff;
    });
    return csvUtils.toCsvResult({ ...parsed, rows: sorted.map((k) => k.row) });
  },
});

function keyReader(compareAs: CompareAs): (value: string) => string | number | null {
  switch (compareAs) {
    case 'number':
      return (value) => csvUtils.parseNumber(value);
    case 'date':
      return (value) => {
        if (value.trim() === '') {
          return null;
        }
        const time = Date.parse(value.trim());
        return Number.isNaN(time) ? null : time;
      };
    default:
      return (value) => (value.trim() === '' ? null : value.trim());
  }
}

const COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

type SortDirection = 'asc' | 'desc';
type CompareAs = 'text' | 'number' | 'date';
