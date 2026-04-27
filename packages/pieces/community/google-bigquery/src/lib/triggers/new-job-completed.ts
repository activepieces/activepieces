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
  getAccessToken,
  projectIdProp,
} from '../common';

const props = {
  project_id: projectIdProp,
  include_failed: Property.Checkbox({
    displayName: 'Include Failed Jobs',
    description:
      'If enabled, jobs that completed with an error are also returned. Default: off (only successful jobs).',
    required: false,
    defaultValue: false,
  }),
};

interface JobListItem {
  id: string;
  jobReference: { projectId: string; jobId: string; location?: string };
  configuration: {
    jobType: string;
    query?: { query: string };
    load?: object;
    copy?: object;
    extract?: object;
  };
  status: {
    state: string;
    errorResult?: { reason: string; message: string };
  };
  statistics: {
    creationTime?: string;
    startTime?: string;
    endTime?: string;
    totalBytesProcessed?: string;
    query?: {
      totalBytesProcessed?: string;
      cacheHit?: boolean;
      dmlStats?: {
        insertedRowCount?: string;
        deletedRowCount?: string;
        updatedRowCount?: string;
      };
    };
  };
  user_email?: string;
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bigQueryAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { project_id, include_failed } = propsValue;
    const token = await getAccessToken(auth as BigQueryAuthValue);

    // Look back an hour before lastFetch to capture long-running jobs
    const minCreationTime =
      (lastFetchEpochMS ?? Date.now() - 24 * 60 * 60 * 1000) - 60 * 60 * 1000;

    const response = await httpClient.sendRequest<{ jobs?: JobListItem[] }>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/projects/${project_id as string}/jobs`,
      headers: { Authorization: `Bearer ${token}` },
      queryParams: {
        stateFilter: 'done',
        projection: 'full',
        minCreationTime: String(minCreationTime),
        maxResults: '100',
      },
    });

    const jobs = (response.body.jobs ?? []).filter((j) => {
      const endTime = parseInt(j.statistics.endTime ?? '0', 10);
      if (endTime <= (lastFetchEpochMS ?? 0)) return false;
      if (!(include_failed ?? false) && j.status.errorResult) return false;
      return true;
    });

    return jobs.map((j) => {
      const endTime = parseInt(j.statistics.endTime ?? '0', 10);
      const dml = j.statistics.query?.dmlStats;
      return {
        epochMilliSeconds: endTime,
        data: {
          job_id: j.jobReference.jobId,
          project_id: j.jobReference.projectId,
          location: j.jobReference.location ?? null,
          job_type: j.configuration.jobType,
          status: j.status.errorResult ? 'FAILED' : 'SUCCESS',
          error_message: j.status.errorResult?.message ?? null,
          error_reason: j.status.errorResult?.reason ?? null,
          query: j.configuration.query?.query ?? null,
          created_at: j.statistics.creationTime
            ? new Date(parseInt(j.statistics.creationTime, 10)).toISOString()
            : null,
          started_at: j.statistics.startTime
            ? new Date(parseInt(j.statistics.startTime, 10)).toISOString()
            : null,
          completed_at: endTime ? new Date(endTime).toISOString() : null,
          bytes_processed:
            j.statistics.query?.totalBytesProcessed ??
            j.statistics.totalBytesProcessed ??
            null,
          cache_hit: j.statistics.query?.cacheHit ?? null,
          dml_inserted_rows: dml?.insertedRowCount ?? null,
          dml_deleted_rows: dml?.deletedRowCount ?? null,
          dml_updated_rows: dml?.updatedRowCount ?? null,
          user_email: j.user_email ?? null,
        },
      };
    });
  },
};

export const newJobCompletedTrigger = createTrigger({
  auth: bigQueryAuth,
  name: 'new_job_completed',
  displayName: 'New Job Completed',
  description:
    'Triggers when any BigQuery job (query, load, copy, or extract) finishes. Returns the job metadata including status, type, and timing.',
  props,
  sampleData: {
    job_id: 'job_xyz789',
    project_id: 'my-project',
    job_type: 'QUERY',
    status: 'SUCCESS',
    error_message: null,
    query: 'SELECT COUNT(*) FROM my_dataset.events',
    completed_at: '2024-01-15T10:30:00Z',
    bytes_processed: '2048',
    cache_hit: false,
    user_email: 'user@example.com',
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
