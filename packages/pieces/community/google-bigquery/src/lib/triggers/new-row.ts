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
  sort_column: Property.ShortText({
    displayName: 'Sort Column',
    description:
      'Name of the column used to detect new rows. The table is ordered by this column (DESC) and any row newer than the last check is returned. Use a TIMESTAMP or DATETIME column, e.g. `created_at`.',
    required: true,
  }),
  max_results: Property.Number({
    displayName: 'Max Rows per Check',
    description:
      'Maximum number of new rows to return per poll (default: 500).',
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
    const { project_id, dataset_id, table_id, sort_column, max_results } =
      propsValue;
    const limit = (max_results as number) ?? 500;
    const token = await getAccessToken(auth as BigQueryAuthValue);

    // First run: look back 7 days; subsequent runs: since last check
    const threshold = lastFetchEpochMS ?? Date.now() - 7 * 24 * 60 * 60 * 1000;
    const fullTable = `\`${project_id as string}.${dataset_id as string}.${
      table_id as string
    }\``;
    const col = sort_column as string;

    const query = `SELECT * FROM ${fullTable} WHERE \`${col}\` > TIMESTAMP_MILLIS(${threshold}) ORDER BY \`${col}\` ASC LIMIT ${limit}`;

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
      const tsValue = row[col];
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

export const newRowTrigger = createTrigger({
  auth: bigQueryAuth,
  name: 'new_row',
  displayName: 'New Row',
  description:
    'Triggers when a new row is added to a BigQuery table. Polls every 5 minutes by comparing the latest value in a sort column against the previous check.',
  props,
  sampleData: {
    id: '1',
    created_at: '2024-01-15T10:30:00Z',
    name: 'Example row',
  },
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
