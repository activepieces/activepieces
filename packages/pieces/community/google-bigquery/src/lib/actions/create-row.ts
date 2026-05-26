import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  bigQueryAuth,
  BigQueryAuthValue,
  BASE_URL,
  BQField,
  getAccessToken,
  getTableSchema,
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

function fieldToProperty(field: BQField) {
  const description = `Type: ${field.type}${
    field.mode ? ` · Mode: ${field.mode}` : ''
  }`;
  return Property.ShortText({
    displayName: field.name,
    description,
    required: field.mode === 'REQUIRED',
  });
}

export const createRowAction = createAction({
  auth: bigQueryAuth,
  name: 'create_row',
  displayName: 'Create Row',
  description:
    'Creates a single new row in a BigQuery table. Column fields are loaded from the table schema.',
  props: {
    project_id: projectIdProp,
    dataset_id: datasetIdProp,
    table_id: tableIdProp,
    values: Property.DynamicProperties({
      displayName: 'Row Values',
      description:
        'Enter a value for each column. Fields are loaded from the table schema.',
      required: true,
      auth: bigQueryAuth,
      refreshers: ['project_id', 'dataset_id', 'table_id'],
      props: async ({ auth, project_id, dataset_id, table_id }) => {
        if (!auth || !project_id || !dataset_id || !table_id) return {};
        try {
          const token = await getAccessToken(auth as BigQueryAuthValue);
          const fields = await getTableSchema(
            token,
            project_id as string,
            dataset_id as string,
            table_id as string
          );
          // Only expose simple (non-RECORD) fields as individual inputs
          return Object.fromEntries(
            fields
              .filter((f) => f.type !== 'RECORD')
              .map((f) => [f.name, fieldToProperty(f)])
          );
        } catch {
          return {};
        }
      },
    }),
  },
  async run(context) {
    const { project_id, dataset_id, table_id, values } = context.propsValue;
    const token = await getAccessToken(context.auth as BigQueryAuthValue);

    const rowData = values as Record<string, unknown>;
    // Strip empty strings so we don't overwrite nullable columns with ''
    const cleanRow = Object.fromEntries(
      Object.entries(rowData).filter(
        ([, v]) => v !== '' && v !== null && v !== undefined
      )
    );

    const insertId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const response = await httpClient.sendRequest<InsertResponse>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/projects/${project_id}/datasets/${dataset_id}/tables/${table_id}/insertAll`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        kind: 'bigquery#tableDataInsertAllRequest',
        rows: [{ insertId, json: cleanRow }],
      },
    });

    const errors = response.body.insertErrors ?? [];
    if (errors.length > 0) {
      const first = errors[0]?.errors[0];
      throw new Error(
        `Row insert failed: ${first?.message ?? 'Unknown error'} (reason: ${
          first?.reason ?? 'unknown'
        }, field: ${first?.location ?? 'unknown'})`
      );
    }

    return {
      success: true,
      insert_id: insertId,
      ...cleanRow,
    };
  },
});
