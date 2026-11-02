import { createAction, Property } from '@activepieces/pieces-framework';
import { csvProps } from '../common/csv-props';
import { csvUtils } from '../common/csv-utils';
import { csvResultOutputSchema } from '../output-schemas';

export const filterCsvRowsAction = createAction({
  audience: 'both',
  name: 'filter_csv_rows',
  classification: 'READ',
  displayName: 'Filter CSV Rows',
  description: 'Keeps only the rows where a column matches a condition.',
  aiMetadata: {
    description:
      'Filters CSV text to the rows whose value in one named column matches a condition (equals, contains, starts/ends with, is empty, greater/less than — compared as numbers when both sides are numbers, otherwise as text, case-insensitive by default). Pick this instead of a Loop plus Branch to narrow rows before sending or saving them. The CSV must have a header row and the column must exist; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    csv_text: csvProps.csvText(),
    delimiter: csvProps.inputDelimiter(),
    column: Property.ShortText({
      displayName: 'Column',
      description: 'The column name to check, exactly as in the header row.',
      placeholder: 'status',
      required: true,
    }),
    condition: Property.StaticDropdown<Condition, true>({
      displayName: 'Condition',
      required: true,
      defaultValue: 'equals',
      options: {
        options: [
          { label: 'Equals', value: 'equals' },
          { label: 'Does not equal', value: 'not_equals' },
          { label: 'Contains', value: 'contains' },
          { label: 'Does not contain', value: 'not_contains' },
          { label: 'Starts with', value: 'starts_with' },
          { label: 'Ends with', value: 'ends_with' },
          { label: 'Is empty', value: 'is_empty' },
          { label: 'Is not empty', value: 'is_not_empty' },
          { label: 'Greater than', value: 'greater_than' },
          { label: 'Greater than or equal to', value: 'greater_or_equal' },
          { label: 'Less than', value: 'less_than' },
          { label: 'Less than or equal to', value: 'less_or_equal' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The value to compare with. Not used for "Is empty" and "Is not empty".',
      required: false,
    }),
    case_sensitive: Property.Checkbox({
      displayName: 'Case Sensitive',
      description: 'On: "Paid" and "paid" are different.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: csvResultOutputSchema,
  async run(context) {
    const { csv_text, delimiter, column, condition, value, case_sensitive } = context.propsValue;
    const parsed = csvUtils.parseCsv({ text: csvUtils.assertCsvText({ value: csv_text }), delimiter });
    const target = csvUtils.findColumn({ headers: parsed.headers, requested: column });

    const compareValue = value === undefined || value === null ? '' : String(value).trim();
    if (compareValue === '' && !VALUE_OPTIONAL_CONDITIONS.includes(condition)) {
      throw new Error(`Enter a value to compare with for the "${condition.replace(/_/g, ' ')}" condition.`);
    }
    const matches = buildMatcher({ condition, rawValue: compareValue, caseSensitive: case_sensitive === true });
    return csvUtils.toCsvResult({
      ...parsed,
      rows: parsed.rows.filter((row) => matches(row[target] ?? '')),
    });
  },
});

function buildMatcher({
  condition,
  rawValue,
  caseSensitive,
}: {
  condition: Condition;
  rawValue: string;
  caseSensitive: boolean;
}): (cell: string) => boolean {
  const norm = (s: string) => (caseSensitive ? s.trim() : s.trim().toLowerCase());
  const value = norm(rawValue);
  const valueNumber = csvUtils.parseNumber(rawValue);
  const compare = (cell: string): number | null => {
    if (cell.trim() === '') {
      return null;
    }
    const cellNumber = csvUtils.parseNumber(cell);
    if (cellNumber !== null && valueNumber !== null) {
      return cellNumber - valueNumber;
    }
    const a = norm(cell);
    return a < value ? -1 : a > value ? 1 : 0;
  };
  const ordered = (test: (diff: number) => boolean) => (cell: string) => {
    const diff = compare(cell);
    return diff !== null && test(diff);
  };
  switch (condition) {
    case 'equals':
      return (cell) => norm(cell) === value;
    case 'not_equals':
      return (cell) => norm(cell) !== value;
    case 'contains':
      return (cell) => norm(cell).includes(value);
    case 'not_contains':
      return (cell) => !norm(cell).includes(value);
    case 'starts_with':
      return (cell) => norm(cell).startsWith(value);
    case 'ends_with':
      return (cell) => norm(cell).endsWith(value);
    case 'is_empty':
      return (cell) => cell.trim() === '';
    case 'is_not_empty':
      return (cell) => cell.trim() !== '';
    case 'greater_than':
      return ordered((d) => d > 0);
    case 'greater_or_equal':
      return ordered((d) => d >= 0);
    case 'less_than':
      return ordered((d) => d < 0);
    case 'less_or_equal':
      return ordered((d) => d <= 0);
    default:
      throw new Error(`Unknown condition "${String(condition)}".`);
  }
}

const VALUE_OPTIONAL_CONDITIONS: Condition[] = ['is_empty', 'is_not_empty', 'equals', 'not_equals'];

type Condition =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'greater_or_equal'
  | 'less_than'
  | 'less_or_equal';
