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

type ProspectDetails = {
  office_id: number | null;
  department_id: number | null;
  pool_id: number | null;
  pool_stage_id: number | null;
  prospect_owner_id: number | null;
} | null;

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
  rejection_reason_id: number | null;
  stage_id: number | null;
  job_post_id: number | null;
  prospect_details: ProspectDetails;
};

type GreenhouseAuth = AppConnectionValueForAuthProperty<typeof greenhouseAuth>;

const polling: Polling<GreenhouseAuth, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const { client_id, client_secret } = auth.props;

    const createdAfter =
      lastFetchEpochMS > 0
        ? new Date(lastFetchEpochMS).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const response = await greenhouseApiCall<GreenhouseApplication[]>({
      auth: { client_id, client_secret },
      method: HttpMethod.GET,
      endpoint: '/applications',
      queryParams: {
        'created_at[gte]': createdAfter,
        per_page: '500',
      },
    });

    const applications = Array.isArray(response.body) ? response.body : [];

    return applications.map((app) => ({
      epochMilliSeconds: new Date(app.created_at).getTime(),
      data: {
        id: app.id,
        candidate_id: app.candidate_id,
        job_id: app.job_id,
        job_post_id: app.job_post_id,
        prospect: app.prospect,
        status: app.status,
        created_at: app.created_at,
        rejected_at: app.rejected_at,
        last_activity_at: app.last_activity_at,
        location_address: app.location_address,
        source_id: app.source_id,
        referrer_id: app.referrer_id,
        rejection_reason_id: app.rejection_reason_id,
        stage_id: app.stage_id,
        prospect_office_id: app.prospect_details?.office_id ?? null,
        prospect_department_id: app.prospect_details?.department_id ?? null,
        prospect_pool_id: app.prospect_details?.pool_id ?? null,
        prospect_pool_stage_id: app.prospect_details?.pool_stage_id ?? null,
        prospect_owner_id: app.prospect_details?.prospect_owner_id ?? null,
      },
    }));
  },
};

export const newCandidateApplicationTrigger = createTrigger({
  auth: greenhouseAuth,
  name: 'new_candidate_application',
  displayName: 'New Candidate Application',
  description: 'Triggers when a new application is submitted by a candidate.',
  props: {},
  sampleData: {
    id: 985314,
    candidate_id: 123456,
    job_id: 144371,
    job_post_id: null,
    prospect: false,
    status: 'active',
    created_at: '2024-03-15T09:30:00.000Z',
    rejected_at: null,
    last_activity_at: '2024-03-15T09:30:00.000Z',
    location_address: 'New York, New York, USA',
    source_id: 12,
    referrer_id: null,
    rejection_reason_id: null,
    stage_id: 77,
    prospect_office_id: null,
    prospect_department_id: null,
    prospect_pool_id: null,
    prospect_pool_stage_id: null,
    prospect_owner_id: null,
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
