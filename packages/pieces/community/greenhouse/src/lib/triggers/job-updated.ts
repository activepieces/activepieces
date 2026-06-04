import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall } from '../common';

type GreenhouseJob = {
  id: number;
  name: string;
  requisition_id: string | null;
  notes: string | null;
  confidential: boolean;
  status: string;
  created_at: string;
  opened_at: string | null;
  closed_at: string | null;
  updated_at: string;
  is_template: boolean;
  copied_from_id: number | null;
  department_id: number | null;
  office_ids: number[];
  openings: {
    id: number;
    opening_id: string | null;
    open: boolean;
    opened_at: string | null;
    closed_at: string | null;
    application_id: number | null;
  }[];
};

type GreenhouseAuth = AppConnectionValueForAuthProperty<typeof greenhouseAuth>;

const polling: Polling<GreenhouseAuth, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const updatedAfter =
      lastFetchEpochMS > 0
        ? new Date(lastFetchEpochMS).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const response = await greenhouseApiCall<GreenhouseJob[]>({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      endpoint: '/jobs',
      queryParams: {
        'updated_at[gte]': updatedAfter,
        per_page: '500',
      },
    });

    const jobs = Array.isArray(response.body) ? response.body : [];

    return jobs.map((job) => ({
      epochMilliSeconds: new Date(job.updated_at).getTime(),
      data: {
        id: job.id,
        name: job.name,
        requisition_id: job.requisition_id,
        status: job.status,
        confidential: job.confidential,
        is_template: job.is_template,
        created_at: job.created_at,
        opened_at: job.opened_at,
        closed_at: job.closed_at,
        updated_at: job.updated_at,
        department_id: job.department_id,
        office_ids: (job.office_ids ?? []).join(', '),
        open_openings: (job.openings ?? []).filter((o) => o.open).length,
        total_openings: (job.openings ?? []).length,
      },
    }));
  },
};

export const jobUpdatedTrigger = createTrigger({
  auth: greenhouseAuth,
  name: 'job_updated',
  displayName: 'Job Updated',
  description: 'Triggers when an existing job is updated.',
  props: {},
  sampleData: {
    id: 6404,
    name: 'Senior Software Engineer',
    requisition_id: 'ENG-2024-001',
    status: 'open',
    confidential: false,
    is_template: false,
    created_at: '2024-01-15T14:42:58.000Z',
    opened_at: '2024-01-20T14:42:58.000Z',
    closed_at: null,
    updated_at: '2024-03-10T16:22:15.000Z',
    department_id: 12345,
    office_ids: '47012',
    open_openings: 2,
    total_openings: 3,
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
