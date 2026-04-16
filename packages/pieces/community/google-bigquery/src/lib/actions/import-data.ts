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

interface InsertResponse {
  insertErrors?: Array<{
    index: number;
    errors: Array<{ reason: string; location: string; message: string }>;
  }>;
}

const CHUNK_SIZE = 500; // BigQuery recommends ≤500 rows per streaming request

function parseInputData(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (typeof data === 'string') {
    const trimmed = data.trim();
    // JSON array
    if (trimmed.startsWith('['))
      return JSON.parse(trimmed) as Record<string, unknown>[];
    // Newline-delimited JSON (NDJSON)
    return trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  }
  throw new Error(
    'Data must be a JSON array or a newline-delimited JSON (NDJSON) string.'
  );
}

export const importDataAction = createAction({
  auth: bigQueryAuth,
  name: 'import_data',
  displayName: 'Import Data',
  description:
    'Imports a batch of rows into a BigQuery table. Accepts a JSON array or newline-delimited JSON (NDJSON). Large datasets are automatically split into chunks.',
  props: {
    project_id: projectIdProp,
    dataset_id: datasetIdProp,
    table_id: tableIdProp,
    data: Property.Json({
      displayName: 'Data',
      description:
        'The data to import. Provide a JSON array of objects (`[{...}, {...}]`) or a newline-delimited JSON string where each line is one row object.',
      required: true,
    }),
    skip_invalid_rows: Property.Checkbox({
      displayName: 'Skip Invalid Rows',
      description:
        'Continue importing valid rows even if some rows fail validation. Default: off (fail entire batch).',
      required: false,
      defaultValue: false,
    }),
    ignore_unknown_values: Property.Checkbox({
      displayName: 'Ignore Unknown Fields',
      description:
        'Silently drop fields not present in the table schema. Default: off (fail on unknown fields).',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      project_id,
      dataset_id,
      table_id,
      data,
      skip_invalid_rows,
      ignore_unknown_values,
    } = context.propsValue;

    const rows = parseInputData(data);
    if (rows.length === 0) throw new Error('Data contains no rows to import.');

    const token = await getAccessToken(context.auth as BigQueryAuthValue);
    const now = Date.now();
    let totalInserted = 0;
    let totalErrors = 0;
    const allErrors: object[] = [];

    // Split into chunks of CHUNK_SIZE
    for (let offset = 0; offset < rows.length; offset += CHUNK_SIZE) {
      const chunk = rows.slice(offset, offset + CHUNK_SIZE);
      const bqRows = chunk.map((row, i) => ({
        insertId: `${now}-${offset + i}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,
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

      const chunkErrors = response.body.insertErrors ?? [];
      if (chunkErrors.length > 0 && !(skip_invalid_rows ?? false)) {
        const first = chunkErrors[0]?.errors[0];
        throw new Error(
          `Import failed on row ${offset + (chunkErrors[0]?.index ?? 0)}: ${
            first?.message ?? 'Unknown error'
          }`
        );
      }

      totalInserted += chunk.length - chunkErrors.length;
      totalErrors += chunkErrors.length;
      allErrors.push(
        ...chunkErrors.map((e) => ({
          row_index: offset + e.index,
          first_error: e.errors[0]?.message ?? 'Unknown',
          reason: e.errors[0]?.reason ?? null,
        }))
      );
    }

    return {
      success: totalErrors === 0,
      rows_attempted: rows.length,
      rows_imported: totalInserted,
      error_count: totalErrors,
      errors: allErrors,
    };
  },
});
