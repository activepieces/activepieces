import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  bigQueryAuth,
  BigQueryAuthValue,
  BASE_URL,
  BQField,
  BQRow,
  bigQueryRowsToFlat,
  getAccessToken,
  projectIdProp,
  datasetIdProp,
  tableIdProp,
} from '../common';

const props = {
  project_id: projectIdProp,
  dataset_id: datasetIdProp,
  table_id: tableIdProp,
  updated_at_column: Property.ShortText({
    displayName: 'Updated At Column',
    description:
      'Name of the TIMESTAMP column that records when a row was last updated, e.g. `updated_at`. Rows where this column is newer than the last check are returned.',
    required: true,
  }),
  created_at_column: Property.ShortText({
    displayName: 'Created At Column (optional)',
    description:
      'If provided, only rows where the updated timestamp is newer than the created timestamp are returned, excluding brand-new rows from the results.',
    required: false,
  }),
  max_results: Property.Number({
    displayName: 'Max Rows per Check',
    description:
      'Maximum number of updated rows to return per poll (default: 500).',
    required: false,
    defaultValue: 500,
  }),
};

interface QueryResponse {
  jobComplete: boolean;
  schema?: { fields: BQField[] };
  rows?: BQRow[];
  jobReference: { projectId: string; jobId: string };
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bigQueryAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const {
      project_id,
      dataset_id,
      table_id,
      updated_at_column,
      created_at_column,
      max_results,
    } = propsValue;
    const limit = (max_results as number) ?? 500;
    const token = await getAccessToken(auth as BigQueryAuthValue);

    const threshold = lastFetchEpochMS ?? Date.now() - 7 * 24 * 60 * 60 * 1000;
    const fullTable = `\`${project_id as string}.${dataset_id as string}.${
      table_id as string
    }\``;
    const updCol = updated_at_column as string;

    // Filter: updated after threshold; optionally exclude brand-new rows
    const createdFilter = created_at_column
      ? ` AND \`${
          created_at_column as string
        }\` < TIMESTAMP_MILLIS(${threshold})`
      : '';

    const query = [
      `SELECT * FROM ${fullTable}`,
      `WHERE \`${updCol}\` > TIMESTAMP_MILLIS(${threshold})${createdFilter}`,
      `ORDER BY \`${updCol}\` ASC`,
      `LIMIT ${limit}`,
    ].join(' ');

    const response = await httpClient.sendRequest<QueryResponse>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/projects/${project_id as string}/queries`,
      headers: { Authorization: `Bearer ${token}` },
      body: { query, useLegacySql: false, maxResults: limit, timeoutMs: 30000 },
    });

    let result = response.body;

    if (!result.jobComplete) {
      for (let i = 0; i < 30 && !result.jobComplete; i++) {
        const poll = await httpClient.sendRequest<QueryResponse>({
          method: HttpMethod.GET,
          url: `${BASE_URL}/projects/${project_id as string}/queries/${
            result.jobReference.jobId
          }`,
          headers: { Authorization: `Bearer ${token}` },
          queryParams: { timeoutMs: '10000', maxResults: String(limit) },
        });
        result = poll.body;
      }
    }

    const schema: BQField[] = result.schema?.fields ?? [];
    const rows = bigQueryRowsToFlat(schema, result.rows ?? []);

    return rows.map((row) => {
      const tsValue = row[updCol];
      let epochMs: number;
      if (typeof tsValue === 'string') {
        const parsed = parseFloat(tsValue);
        epochMs =
          !isNaN(parsed) && parsed > 1e9
            ? parsed * 1000
            : new Date(tsValue).getTime();
      } else if (typeof tsValue === 'number') {
        epochMs = tsValue > 1e12 ? tsValue : tsValue * 1000;
      } else {
        epochMs = Date.now();
      }
      return { epochMilliSeconds: epochMs, data: row };
    });
  },
};

export const updatedRowTrigger = createTrigger({
  auth: bigQueryAuth,
  name: 'updated_row',
  displayName: 'Updated Row',
  description:
    'Triggers when an existing row is updated in a BigQuery table. Requires an `updated_at` TIMESTAMP column that is set whenever a row changes.',
  props,
  sampleData: { id: '1', updated_at: '2024-01-15T10:30:00Z', status: 'active' },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
