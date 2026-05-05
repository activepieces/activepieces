import {
  createTrigger,
  TriggerStrategy,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { descriptAuth } from '../auth';
import { descriptCommon } from '../common';

type JobResult = {
  status?: string;
  agent_response?: string;
  project_changed?: boolean;
  media_seconds_used?: number;
  ai_credits_used?: number;
  share_url?: string;
  download_url?: string;
  download_url_expires_at?: string;
  error_message?: string;
};

type JobItem = {
  job_id: string;
  job_type: string;
  job_state: 'queued' | 'running' | 'stopped' | 'cancelled';
  created_at: string;
  stopped_at?: string;
  drive_id: string;
  project_id: string;
  project_url: string;
  result?: JobResult;
  progress?: { label: string; percent?: number; last_update_at?: string };
};

type TriggerProps = {
  job_type_filter: string | undefined;
};

// "stopped" covers all terminal outcomes (success/partial/error); "cancelled" is user-initiated.
const TERMINAL_STATES = new Set<JobItem['job_state']>(['stopped', 'cancelled']);

function isCompletedJob(job: JobItem): boolean {
  return TERMINAL_STATES.has(job.job_state);
}

const SAMPLE_DATA: JobItem = {
  job_id: '6dc3f30a-58c2-4174-96a6-dc18cf3c7776',
  job_type: 'import/project_media',
  job_state: 'stopped',
  created_at: '2025-11-18T10:30:00Z',
  stopped_at: '2025-11-18T10:35:00Z',
  drive_id: 'c9c5c47e-158a-49f7-846b-4f6ee2a229a2',
  project_id: '9f36ee32-5a2c-47e7-b1a3-94991d3e3ddb',
  project_url: 'https://web.descript.com/9f36ee32-5a2c-47e7-b1a3-94991d3e3ddb',
  result: {
    status: 'success',
    media_seconds_used: 136,
  },
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof descriptAuth>,
  TriggerProps
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { job_type_filter } = propsValue;
    const apiKey = descriptCommon.getAuthToken(auth);
    const params: Record<string, string> = { limit: '100' };
    if (job_type_filter && job_type_filter !== 'all') {
      params['type'] = job_type_filter;
    }

    // Use created_after to avoid re-fetching full history on every poll.
    if (lastFetchEpochMS > 0) {
      params['created_after'] = new Date(lastFetchEpochMS).toISOString();
    }

    const allJobs: JobItem[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 10;

    do {
      pageCount++;
      const queryParams: Record<string, string> = {
        ...params,
        ...(cursor ? { cursor } : {}),
      };

      const response = await descriptCommon.descriptApiCall<{
        data: JobItem[];
        pagination: { next_cursor?: string };
      }>({
        apiKey,
        method: HttpMethod.GET,
        path: '/jobs',
        queryParams,
      });

      allJobs.push(...response.body.data);
      cursor = response.body.pagination.next_cursor;
    } while (cursor && pageCount < maxPages);

    return allJobs.filter(isCompletedJob).map((job) => ({
      epochMilliSeconds: new Date(job.stopped_at ?? job.created_at).getTime(),
      data: { ...job },
    }));
  },
};

export const descriptJobCompletedTrigger = createTrigger({
  auth: descriptAuth,
  name: 'job_completed',
  displayName: 'Job Completed',
  description:
    'Triggers when a Descript background job (import, agent edit, or publish) finishes.',
  props: {
    job_type_filter: Property.StaticDropdown({
      displayName: 'Job Type Filter',
      description:
        'Only trigger for jobs of this type. Select "All job types" to trigger for any completed job.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All job types', value: 'all' },
          { label: 'Import media', value: 'import/project_media' },
          { label: 'Agent edit (Underlord)', value: 'agent' },
        ],
      },
    }),
  },
  sampleData: SAMPLE_DATA,
  type: TriggerStrategy.POLLING,
  async test() {
    return [SAMPLE_DATA];
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
