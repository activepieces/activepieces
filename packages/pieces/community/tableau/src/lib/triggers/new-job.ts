import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { tableauAuth } from '../../index';
import { getAuthToken, buildTableauUrl, getTableauHeaders } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

function ensureString(body: any): string {
  if (typeof body === 'string') return body;
  if (typeof body === 'object') return JSON.stringify(body);
  return String(body);
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof tableauAuth>, { jobType?: string; status?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const tableauAuth = auth.props;
    const { token: authToken, siteId } = await getAuthToken(tableauAuth);

    const apiVersion = tableauAuth.apiVersion || '3.26';
    let queryJobsUrl = buildTableauUrl(tableauAuth.serverUrl, apiVersion, siteId, 'jobs');
    const filters: string[] = [];

    if (propsValue.jobType) {
      filters.push(`jobType:eq:${propsValue.jobType}`);
    }

    if (propsValue.status) {
      filters.push(`status:eq:${propsValue.status}`);
    }

    if (lastFetchEpochMS) {
      const lastFetchDate = new Date(lastFetchEpochMS);
      const isoDate = lastFetchDate.toISOString();
      filters.push(`createdAt:gt:${isoDate}`);
    }

    if (filters.length > 0) {
      queryJobsUrl += `?filter=${filters.join(',')}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: queryJobsUrl,
      headers: getTableauHeaders(authToken),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to query jobs: ${response.status} - ${response.body}`);
    }

    const responseBody = ensureString(response.body);
    const jobs: any[] = [];

    const jobMatches = responseBody.matchAll(/<backgroundJob[^>]*id="([^"]+)"[^>]*status="([^"]*)"[^>]*createdAt="([^"]*)"[^>]*startedAt="([^"]*)"[^>]*endedAt="([^"]*)"[^>]*priority="([^"]*)"[^>]*jobType="([^"]*)"/g);

    for (const match of jobMatches) {
      const [, jobId, status, createdAt, startedAt, endedAt, priority, jobType] = match;

      jobs.push({
        id: jobId,
        status,
        createdAt,
        startedAt,
        endedAt,
        priority: parseInt(priority),
        jobType,
      });
    }

    return jobs.map((job) => ({
      epochMilliSeconds: new Date(job.createdAt).getTime(),
      data: job,
    }));
  },
};

export const newJobTrigger = createTrigger({
  name: 'new_job',
  displayName: 'New Job',
  description: 'Triggers when a job matches the specified criteria',
  auth: tableauAuth,
  type: TriggerStrategy.POLLING,
  props: {
    jobType: Property.StaticDropdown({
      displayName: 'Job Type',
      description: 'Filter by job type (optional)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All Job Types', value: '' },
          { label: 'Refresh Extracts', value: 'refresh_extracts' },
          { label: 'Increment Extracts', value: 'increment_extracts' },
          { label: 'Run Flow', value: 'run_flow' },
          { label: 'Refresh Workbook', value: 'refresh_workbook' },
          { label: 'Refresh Datasource', value: 'refresh_datasource' },
        ],
      },
      defaultValue: '',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by job status (optional)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Success', value: 'Success' },
          { label: 'Failed', value: 'Failed' },
          { label: 'InProgress', value: 'InProgress' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Cancelled', value: 'Cancelled' },
        ],
      },
      defaultValue: '',
    }),
  },
  sampleData: {
    id: '919055e5-25db-4a2b-9611-1408dd06632d',
    status: 'Success',
    createdAt: '2023-12-01T10:00:00Z',
    startedAt: '2023-12-01T10:00:15Z',
    endedAt: '2023-12-01T10:01:00Z',
    priority: 50,
    jobType: 'refresh_extracts',
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },
  test: async (context) => {
    return await pollingHelper.test(polling, context);
  },
});

