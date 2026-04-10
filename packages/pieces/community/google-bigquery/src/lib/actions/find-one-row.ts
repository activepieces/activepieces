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

export const findOneRowAction = createAction({
  auth: bigQueryAuth,
  name: 'find_one_row',
  displayName: 'Find One Row',
  description:
    'Find a single row by specifying a WHERE clause and an optional ORDER BY. Returns the first matching row, or empty if none found.',
  props: {
    project_id: projectIdProp,
    dataset_id: datasetIdProp,
    table_id: tableIdProp,
    where_clause: Property.LongText({
      displayName: 'WHERE Clause',
      description:
        'SQL condition to filter rows. Do not include the WHERE keyword. Example: `email = "user@example.com"`',
      required: true,
    }),
    order_by: Property.ShortText({
      displayName: 'ORDER BY',
      description:
        'Optional column(s) to sort results before picking the first row. Example: `created_at DESC`',
      required: false,
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
      order_by,
      location,
    } = context.propsValue;
    const token = await getAccessToken(context.auth as BigQueryAuthValue);

    const fullTable = `\`${project_id}.${dataset_id}.${table_id}\``;
    const orderPart = order_by ? ` ORDER BY ${order_by}` : '';
    const query = `SELECT * FROM ${fullTable} WHERE ${where_clause}${orderPart} LIMIT 1`;

    const response = await httpClient.sendRequest<QueryResponse>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/projects/${project_id}/queries`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        query,
        useLegacySql: false,
        maxResults: 1,
        timeoutMs: 10000,
        ...(location ? { location } : {}),
      },
    });

    let result = response.body;
    let schema: BQField[] = result.schema?.fields ?? [];

    if (!result.jobComplete) {
      const polled = await waitForJobResults(
        token,
        project_id as string,
        result.jobReference.jobId,
        (location as string) ?? undefined
      );
      result = { ...polled, jobReference: result.jobReference };
      schema = polled.schema?.fields ?? schema;
    }

    const rows = bigQueryRowsToFlat(schema, result.rows ?? []);
    const found = rows.length > 0;

    return {
      found,
      ...(found ? rows[0] : {}),
    };
  },
});
