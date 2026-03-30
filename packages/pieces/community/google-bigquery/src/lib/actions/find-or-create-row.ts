import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  bigQueryAuth,
  BigQueryAuthValue,
  BASE_URL,
  BQField,
  BQRow,
  bigQueryRowsToFlat,
  getAccessToken,
  waitForJobResults,
  projectIdProp,
  datasetIdProp,
  tableIdProp,
} from '../common';

interface QueryResponse {
  jobComplete: boolean;
  schema?: { fields: BQField[] };
  rows?: BQRow[];
  jobReference: { projectId: string; jobId: string };
}

interface InsertResponse {
  insertErrors?: Array<{
    index: number;
    errors: Array<{ reason: string; location: string; message: string }>;
  }>;
}

export const findOrCreateRowAction = createAction({
  auth: bigQueryAuth,
  name: 'find_or_create_row',
  displayName: 'Find or Create Record',
  description:
    'Searches for a row matching a WHERE clause. If found, returns it. If not found, inserts the provided row data and returns that.',
  props: {
    project_id: projectIdProp,
    dataset_id: datasetIdProp,
    table_id: tableIdProp,
    where_clause: Property.LongText({
      displayName: 'WHERE Clause',
      description:
        'SQL condition to search for an existing row. Do not include WHERE. Example: `email = "user@example.com"`',
      required: true,
    }),
    create_data: Property.Json({
      displayName: 'Row to Create (if not found)',
      description:
        'A JSON object of column/value pairs to insert if no matching row exists. Example: `{"email": "user@example.com", "name": "Alice"}`',
      required: true,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description:
        'Dataset location (e.g. US, EU). Leave blank to use the default.',
      required: false,
    }),
  },
  async run(context) {
    const {
      project_id,
      dataset_id,
      table_id,
      where_clause,
      create_data,
      location,
    } = context.propsValue;
    const token = await getAccessToken(context.auth as BigQueryAuthValue);

    // --- Step 1: Find ---
    const fullTable = `\`${project_id}.${dataset_id}.${table_id}\``;
    const findQuery = `SELECT * FROM ${fullTable} WHERE ${where_clause} LIMIT 1`;

    const findResponse = await httpClient.sendRequest<QueryResponse>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/projects/${project_id}/queries`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        query: findQuery,
        useLegacySql: false,
        maxResults: 1,
        timeoutMs: 10000,
        ...(location ? { location } : {}),
      },
    });

    let findResult = findResponse.body;
    let schema: BQField[] = findResult.schema?.fields ?? [];

    if (!findResult.jobComplete) {
      const polled = await waitForJobResults(
        token,
        project_id as string,
        findResult.jobReference.jobId,
        (location as string) ?? undefined
      );
      findResult = { ...polled, jobReference: findResult.jobReference };
      schema = polled.schema?.fields ?? schema;
    }

    const existingRows = bigQueryRowsToFlat(schema, findResult.rows ?? []);

    if (existingRows.length > 0) {
      return {
        found: true,
        created: false,
        ...existingRows[0],
      };
    }

    // --- Step 2: Create ---
    const rowData = create_data as Record<string, unknown>;
    const insertId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const insertResponse = await httpClient.sendRequest<InsertResponse>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/projects/${project_id}/datasets/${dataset_id}/tables/${table_id}/insertAll`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        kind: 'bigquery#tableDataInsertAllRequest',
        rows: [{ insertId, json: rowData }],
      },
    });

    const errors = insertResponse.body.insertErrors ?? [];
    if (errors.length > 0) {
      const first = errors[0]?.errors[0];
      throw new Error(
        `Row creation failed: ${first?.message ?? 'Unknown error'} (reason: ${
          first?.reason ?? 'unknown'
        })`
      );
    }

    return {
      found: false,
      created: true,
      insert_id: insertId,
      ...rowData,
    };
  },
});
