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

type GreenhouseApplication = {
  id: number;
  candidate_id: number;
  job_id: number | null;
  prospect: boolean;
  status: string;
  created_at: string;
  rejected_at: string | null;
  last_activity_at: string | null;
  location_address: string | null;
  source_id: number | null;
  referrer_id: number | null;
  stage_id: number | null;
  job_post_id: number | null;
};

type GreenhouseAuth = AppConnectionValueForAuthProperty<typeof greenhouseAuth>;

const polling: Polling<GreenhouseAuth, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const createdAfter =
      lastFetchEpochMS > 0
        ? new Date(lastFetchEpochMS).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const response = await greenhouseApiCall<GreenhouseApplication[]>({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      endpoint: '/applications',
      queryParams: {
        status: 'hired',
        'created_at[gte]': createdAfter,
        per_page: '500',
      },
    });

    const applications = Array.isArray(response.body) ? response.body : [];

    return applications.map((app) => ({
      epochMilliSeconds: new Date(app.last_activity_at ?? app.created_at).getTime(),
      data: {
        id: app.id,
        candidate_id: app.candidate_id,
        job_id: app.job_id,
        job_post_id: app.job_post_id,
        prospect: app.prospect,
        status: app.status,
        created_at: app.created_at,
        hired_at: app.last_activity_at,
        location_address: app.location_address,
        source_id: app.source_id,
        referrer_id: app.referrer_id,
        stage_id: app.stage_id,
      },
    }));
  },
};

export const candidateHiredTrigger = createTrigger({
  auth: greenhouseAuth,
  name: 'candidate_hired',
  displayName: 'Candidate Hired',
  description: 'Triggers when a candidate is hired.',
  props: {},
  sampleData: {
    id: 48206478,
    candidate_id: 36952451,
    job_id: 211706,
    job_post_id: 123,
    prospect: false,
    status: 'hired',
    created_at: '2024-02-01T14:26:02.000Z',
    hired_at: '2024-03-15T10:00:00.000Z',
    location_address: 'New York, New York, USA',
    source_id: 33,
    referrer_id: null,
    stage_id: null,
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
