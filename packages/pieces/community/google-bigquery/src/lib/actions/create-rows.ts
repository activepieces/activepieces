import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  bigQueryAuth,
  BigQueryAuthValue,
  BASE_URL,
  getAccessToken,
  projectIdProp,
  datasetIdProp,
  tableIdProp,
} from '../common';

interface InsertError {
  index: number;
  errors: Array<{ reason: string; location: string; message: string }>;
}

interface InsertResponse {
  kind: string;
  insertErrors?: InsertError[];
}

export const createRowsAction = createAction({
  auth: bigQueryAuth,
  name: 'create_rows',
  displayName: 'Create Rows',
  description:
    'Creates new rows of data in a BigQuery table (accepts an array of row objects). Rows are available to query within seconds.',
  props: {
    project_id: projectIdProp,
    dataset_id: datasetIdProp,
    table_id: tableIdProp,
    rows: Property.Json({
      displayName: 'Rows',
      description:
        'An array of row objects to insert. Keys must match the table column names. Example: `[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]`',
      required: true,
    }),
    skip_invalid_rows: Property.Checkbox({
      displayName: 'Skip Invalid Rows',
      description:
        'If enabled, valid rows are inserted even when some rows in the batch are invalid. If disabled (default), the entire batch fails if any row is invalid.',
      required: false,
      defaultValue: false,
    }),
    ignore_unknown_values: Property.Checkbox({
      displayName: 'Ignore Unknown Fields',
      description:
        'If enabled, fields not in the table schema are silently discarded. If disabled (default), unknown fields cause the row to fail.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      project_id,
      dataset_id,
      table_id,
      rows,
      skip_invalid_rows,
      ignore_unknown_values,
    } = context.propsValue;

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error(
        'Rows must be a non-empty JSON array of objects, e.g. [{"column": "value"}]'
      );
    }

    const token = await getAccessToken(context.auth as BigQueryAuthValue);
    const now = Date.now();

    const bqRows = (rows as Record<string, unknown>[]).map((row, index) => ({
      insertId: `${now}-${index}-${Math.random().toString(36).slice(2, 9)}`,
      json: row,
    }));

    const response = await httpClient.sendRequest<InsertResponse>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/projects/${project_id}/datasets/${dataset_id}/tables/${table_id}/insertAll`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        kind: 'bigquery#tableDataInsertAllRequest',
        skipInvalidRows: skip_invalid_rows ?? false,
        ignoreUnknownValues: ignore_unknown_values ?? false,
        rows: bqRows,
      },
    });

    const insertErrors = response.body.insertErrors ?? [];

    if (insertErrors.length > 0 && !(skip_invalid_rows ?? false)) {
      const firstError = insertErrors[0]?.errors[0];
      throw new Error(
        `Insert failed on row ${insertErrors[0]?.index}: ${
          firstError?.message ?? 'Unknown error'
        } (reason: ${firstError?.reason ?? 'unknown'})`
      );
    }

    const flatErrors = insertErrors.map((e) => ({
      row_index: e.index,
      error_count: e.errors.length,
      first_error_reason: e.errors[0]?.reason ?? null,
      first_error_location: e.errors[0]?.location ?? null,
      first_error_message: e.errors[0]?.message ?? null,
    }));

    return {
      success: insertErrors.length === 0,
      rows_attempted: rows.length,
      rows_inserted: rows.length - insertErrors.length,
      error_count: insertErrors.length,
      errors: flatErrors,
    };
  },
});
