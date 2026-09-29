import { createAction, Property } from '@activepieces/pieces-framework';
import { flatten } from 'safe-flat';
import { csvProps } from '../common/csv-props';
import { csvUtils } from '../common/csv-utils';
import { createCsvFileOutputSchema } from '../output-schemas';

export const createCsvFileAction = createAction({
  audience: 'both',
  name: 'create_csv_file',
  classification: 'READ',
  displayName: 'Create CSV File',
  description: 'Turns a list of rows into a .csv file you can attach to an email or upload.',
  aiMetadata: {
    description:
      'Builds a .csv file from a JSON array of objects: every key seen in any row becomes a column (nested objects become dotted columns like address.city), booleans are written as true/false and missing values stay blank, with optional column order, delimiter, header row and an Excel-friendly UTF-8 byte-order mark. Pick this when the next step needs a file; use Convert JSON to CSV when you only need the CSV text. Up to 100,000 rows; nothing outside the run changes and the same input gives the same file content, so it is idempotent.',
    idempotent: true,
  },
  props: {
    json_array: Property.Json({
      displayName: 'Rows',
      description:
        'A list of objects, one per row, e.g. [{"name":"Ann"}].',
      required: true,
      defaultValue: [
        { name: 'Ann', email: 'ann@example.com', paid: true },
        { name: 'Bob', email: 'bob@example.com', paid: false },
      ],
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: '".csv" is added if you leave out the extension.',
      placeholder: 'export.csv',
      required: false,
      defaultValue: 'export.csv',
    }),
    delimiter: csvProps.outputDelimiter(),
    include_header: Property.Checkbox({
      displayName: 'Include Header Row',
      description: 'Write the column names as the first row.',
      required: false,
      defaultValue: true,
    }),
    columns: Property.Array({
      displayName: 'Columns',
      description:
        'Columns to write, in order. Leave empty to write all columns.',
      required: false,
    }),
    add_excel_bom: Property.Checkbox({
      displayName: 'Excel-Friendly Encoding',
      description:
        'Adds a byte-order mark so Excel shows accented characters correctly.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: createCsvFileOutputSchema,
  async run(context) {
    const { json_array, file_name, delimiter, include_header, columns, add_excel_bom } =
      context.propsValue;
    const input = readRows(json_array);
    csvUtils.assertRowLimit(input.length);

    const rows = input.map((item, index) => {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(
          `Row ${index + 1} is not an object. Each row must look like {"column": "value"}.`,
        );
      }
      const flat = flatten(item);
      if (!csvUtils.isRecord(flat)) {
        throw new Error(`Row ${index + 1} could not be flattened into columns.`);
      }
      return flat;
    });

    const requested = [...new Set(csvUtils.toStringList(columns))];
    const headers = requested.length > 0 ? requested : unionOfKeys(rows);
    const text = csvUtils.serializeCsv({
      headers,
      rows,
      delimiter: delimiter || ',',
      includeHeader: include_header !== false,
    });
    const content = add_excel_bom === true ? `﻿${text}` : text;
    const name = csvUtils.safeFileName({ requested: file_name, fallback: 'export.csv', extension: 'csv' });

    const url = await context.files.write({
      fileName: name,
      data: Buffer.from(content, 'utf8'),
    });
    return {
      file_name: name,
      url,
      row_count: rows.length,
      columns: headers,
    };
  },
});

function readRows(value: unknown): unknown[] {
  let data = value;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      throw new Error('Rows must be a JSON array, for example [{"name":"Ann"}].');
    }
  }
  if (!Array.isArray(data)) {
    throw new Error('Rows must be a JSON array of objects, not a single object.');
  }
  return data;
}

function unionOfKeys(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      keys.add(key);
    }
  }
  return [...keys];
}
