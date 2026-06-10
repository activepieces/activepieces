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
} from '../common';

const props = {
  project_id: projectIdProp,
  max_rows_per_job: Property.Number({
    displayName: 'Max Rows per Job',
    description:
      'Maximum number of result rows to fetch per completed job (default: 500).',
    required: false,
    defaultValue: 500,
  }),
};

interface JobListItem {
  id: string;
  jobReference: { projectId: string; jobId: string; location?: string };
  configuration: { jobType: string; query?: { query: string } };
  status: { state: string; errorResult?: { message: string } };
  statistics: {
    creationTime?: string;
    startTime?: string;
    endTime?: string;
    query?: { totalBytesProcessed?: string; cacheHit?: boolean };
  };
  user_email?: string;
}

interface QueryResultsResponse {
  jobComplete: boolean;
  schema?: { fields: BQField[] };
  rows?: BQRow[];
  pageToken?: string;
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bigQueryAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { project_id, max_rows_per_job } = propsValue;
    const rowLimit = (max_rows_per_job as number) ?? 500;
    const token = await getAccessToken(auth as BigQueryAuthValue);

    // Look back an hour before lastFetch to catch long-running jobs
    const minCreationTime =
      (lastFetchEpochMS ?? Date.now() - 24 * 60 * 60 * 1000) - 60 * 60 * 1000;

    const listResponse = await httpClient.sendRequest<{ jobs?: JobListItem[] }>(
      {
        method: HttpMethod.GET,
        url: `${BASE_URL}/projects/${project_id as string}/jobs`,
        headers: { Authorization: `Bearer ${token}` },
        queryParams: {
          stateFilter: 'done',
          projection: 'full',
          minCreationTime: String(minCreationTime),
          maxResults: '50',
        },
      }
    );

    const jobs = (listResponse.body.jobs ?? []).filter(
      (j) =>
        j.configuration.jobType === 'QUERY' &&
        !j.status.errorResult &&
        parseInt(j.statistics.endTime ?? '0', 10) > (lastFetchEpochMS ?? 0)
    );

    const items: Array<{
      epochMilliSeconds: number;
      data: Record<string, unknown>;
    }> = [];

    for (const job of jobs) {
      const jobId = job.jobReference.jobId;
      const location = job.jobReference.location;
      const endTime = parseInt(job.statistics.endTime ?? '0', 10);

      // Fetch result rows for this job
      const rows: BQRow[] = [];
      let schema: BQField[] = [];
      let pageToken: string | undefined;

      do {
        const rowsResp = await httpClient.sendRequest<QueryResultsResponse>({
          method: HttpMethod.GET,
          url: `${BASE_URL}/projects/${project_id as string}/queries/${jobId}`,
          headers: { Authorization: `Bearer ${token}` },
          queryParams: {
            maxResults: String(Math.min(rowLimit - rows.length, 1000)),
            timeoutMs: '5000',
            ...(pageToken ? { pageToken } : {}),
            ...(location ? { location } : {}),
          },
        });
        if (rowsResp.body.schema?.fields) schema = rowsResp.body.schema.fields;
        rows.push(...(rowsResp.body.rows ?? []));
        pageToken = rowsResp.body.pageToken;
      } while (pageToken && rows.length < rowLimit);

      const flatRows = bigQueryRowsToFlat(schema, rows.slice(0, rowLimit));

      items.push({
        epochMilliSeconds: endTime,
        data: {
          job_id: jobId,
          project_id: job.jobReference.projectId,
          location: location ?? null,
          query: job.configuration.query?.query ?? null,
          completed_at: job.statistics.endTime
            ? new Date(endTime).toISOString()
            : null,
          bytes_processed: job.statistics.query?.totalBytesProcessed ?? null,
          cache_hit: job.statistics.query?.cacheHit ?? null,
          user_email: job.user_email ?? null,
          row_count: flatRows.length,
          rows: flatRows,
        },
      });
    }

    return items;
  },
};

export const queryJobCompletedTrigger = createTrigger({
  auth: bigQueryAuth,
  name: 'query_job_completed',
  displayName: 'Query Job Completed (With Row Data)',
  description:
    'Triggers when a BigQuery query job finishes successfully. Each flow run receives the job metadata and the result rows from that query.',
  props,
  sampleData: {
    job_id: 'job_abc123',
    project_id: 'my-project',
    query: 'SELECT * FROM my_dataset.my_table LIMIT 10',
    completed_at: '2024-01-15T10:30:00Z',
    bytes_processed: '1024',
    cache_hit: false,
    row_count: 2,
    rows: [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ],
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
