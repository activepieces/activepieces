/// <reference types="vitest/globals" />

import { createMockActionContext, OutputSchema } from '@activepieces/pieces-framework';
import { readCsvFileAction } from '../src/lib/actions/read-csv-file';
import { createCsvFileAction } from '../src/lib/actions/create-csv-file';
import { convertCsvToExcelAction } from '../src/lib/actions/convert-csv-to-excel';
import { filterCsvRowsAction } from '../src/lib/actions/filter-csv-rows';
import { sortCsvRowsAction } from '../src/lib/actions/sort-csv-rows';
import { removeDuplicateCsvRowsAction } from '../src/lib/actions/remove-duplicate-csv-rows';
import { selectCsvColumnsAction } from '../src/lib/actions/select-csv-columns';
import { mergeCsvAction } from '../src/lib/actions/merge-csv';
import { splitCsvAction } from '../src/lib/actions/split-csv';

const CSV = 'name,email\nAnn,ann@x.com\nBob,bob@x.com\n';

const cases: { name: string; schema: OutputSchema | undefined; run: () => Promise<unknown> }[] = [
  {
    name: 'read_csv_file',
    schema: readCsvFileAction.outputSchema,
    run: () =>
      readCsvFileAction.run(
        createMockActionContext({ propsValue: { file: { filename: 'a.csv', data: Buffer.from(CSV) } } }),
      ),
  },
  {
    name: 'create_csv_file',
    schema: createCsvFileAction.outputSchema,
    run: () => createCsvFileAction.run(createMockActionContext({ propsValue: { json_array: [{ a: 1 }] } })),
  },
  {
    name: 'convert_csv_to_excel',
    schema: convertCsvToExcelAction.outputSchema,
    run: () => convertCsvToExcelAction.run(createMockActionContext({ propsValue: { csv_text: CSV } })),
  },
  {
    name: 'filter_csv_rows',
    schema: filterCsvRowsAction.outputSchema,
    run: () =>
      filterCsvRowsAction.run(
        createMockActionContext({ propsValue: { csv_text: CSV, column: 'name', condition: 'equals', value: 'Ann' } }),
      ),
  },
  {
    name: 'sort_csv_rows',
    schema: sortCsvRowsAction.outputSchema,
    run: () => sortCsvRowsAction.run(createMockActionContext({ propsValue: { csv_text: CSV, column: 'name' } })),
  },
  {
    name: 'remove_duplicate_csv_rows',
    schema: removeDuplicateCsvRowsAction.outputSchema,
    run: () => removeDuplicateCsvRowsAction.run(createMockActionContext({ propsValue: { csv_text: CSV } })),
  },
  {
    name: 'select_csv_columns',
    schema: selectCsvColumnsAction.outputSchema,
    run: () =>
      selectCsvColumnsAction.run(createMockActionContext({ propsValue: { csv_text: CSV, columns: ['email'] } })),
  },
  {
    name: 'merge_csv',
    schema: mergeCsvAction.outputSchema,
    run: () => mergeCsvAction.run(createMockActionContext({ propsValue: { csv_texts: [CSV, CSV] } })),
  },
  {
    name: 'split_csv',
    schema: splitCsvAction.outputSchema,
    run: () =>
      splitCsvAction.run(createMockActionContext({ propsValue: { csv_text: CSV, rows_per_chunk: 1 } })),
  },
];

describe.each(cases)('$name output schema', ({ schema, run }) => {
  test('every described path resolves, and nothing is left undescribed', async () => {
    expect(schema).toBeDefined();
    const output = toRecord(await run());
    const fields = schema?.fields ?? [];
    const described = fields.map((f) => f.value ?? f.key);
    for (const p of described) {
      expect(output[p], `"${p}" does not resolve`).toBeDefined();
    }
    for (const key of Object.keys(output)) {
      expect(described.includes(key), `"${key}" is not described`).toBe(true);
    }
    for (const field of fields.filter((f) => f.listItems)) {
      const items = output[field.value ?? field.key];
      expect(Array.isArray(items)).toBe(true);
      const first = toRecord(Array.isArray(items) ? items[0] : undefined);
      for (const child of field.listItems ?? []) {
        expect(first[child.value ?? child.key], `"${field.key}[].${child.key}" does not resolve`).toBeDefined();
      }
    }
  });
});

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('expected an object');
  }
  return Object.fromEntries(Object.entries(value));
}
