import { createAction, Property } from '@activepieces/pieces-framework';
import { csvProps } from '../common/csv-props';
import { csvUtils } from '../common/csv-utils';
import { csvResultOutputSchema } from '../output-schemas';

export const mergeCsvAction = createAction({
  audience: 'both',
  name: 'merge_csv',
  classification: 'READ',
  displayName: 'Merge CSV Files',
  description: 'Stacks several CSVs into one, matching columns by name.',
  aiMetadata: {
    description:
      'Appends the rows of two or more CSV texts into one, matching columns by header name: the result has every column seen in any input (first-seen order) and cells a source did not have stay blank. Pick this to combine exports with the same or overlapping columns; it stacks rows and does not join or look up rows by a key. Each input needs a header row; up to 100,000 rows in total; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    csv_texts: Property.Array({
      displayName: 'CSV Texts',
      description: 'Two or more CSV texts, one per item. Map each from an earlier step.',
      required: true,
    }),
    delimiter: csvProps.inputDelimiter(),
  },
  outputSchema: csvResultOutputSchema,
  async run(context) {
    const { csv_texts, delimiter } = context.propsValue;
    const inputs = Array.isArray(csv_texts) ? csv_texts : [];
    if (inputs.length < 2) {
      throw new Error('Add at least two CSV texts to merge.');
    }
    const parsedInputs = inputs.map((value, i) =>
      csvUtils.parseCsv({
        text: csvUtils.assertCsvText({ value, label: `CSV Text ${i + 1}` }),
        delimiter,
      }),
    );
    const headers = [...new Set(parsedInputs.flatMap((p) => p.headers))];
    const total = parsedInputs.reduce((sum, p) => sum + p.rows.length, 0);
    csvUtils.assertRowLimit(total);
    const rows = parsedInputs.flatMap((p) =>
      p.rows.map((row) => Object.fromEntries(headers.map((h) => [h, row[h] ?? '']))),
    );
    return csvUtils.toCsvResult({ headers, rows, delimiter: parsedInputs[0].delimiter });
  },
});
