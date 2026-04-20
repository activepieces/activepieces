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

type GreenhouseUser = {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  employee_id: string | null;
};

type GreenhouseApplication = {
  id: number;
  candidate_id: number;
  prospect: boolean;
  applied_at: string;
  rejected_at: string | null;
  last_activity_at: string | null;
  location: { address: string } | null;
  source: { id: number; public_name: string } | null;
  credited_to: GreenhouseUser | null;
  recruiter: GreenhouseUser | null;
  coordinator: GreenhouseUser | null;
  rejection_reason: string | null;
  rejection_details: string | null;
  jobs: { id: number; name: string }[];
  job_post_id: number | null;
  status: string;
  current_stage: { id: number; name: string } | null;
  answers: { question: string; answer: string }[];
  prospective_office: { id: number; name: string } | null;
  prospective_department: { id: number; name: string } | null;
  prospect_detail: {
    prospect_pool: { id: number; name: string } | null;
    prospect_stage: { id: number; name: string } | null;
    prospect_owner: GreenhouseUser | null;
  };
};

type GreenhouseAuth = AppConnectionValueForAuthProperty<typeof greenhouseAuth>;

const polling: Polling<GreenhouseAuth, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const apiKey = (auth as { secret_text: string }).secret_text;

    const lastActivityAfter =
      lastFetchEpochMS > 0
        ? new Date(lastFetchEpochMS).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const response = await greenhouseApiCall<GreenhouseApplication[]>({
      apiKey,
      method: HttpMethod.GET,
      endpoint: '/applications',
      queryParams: {
        status: 'hired',
        last_activity_after: lastActivityAfter,
        per_page: '100',
      },
    });

    const applications = response.body ?? [];

    return applications.map((app) => ({
      epochMilliSeconds: new Date(app.last_activity_at ?? app.applied_at).getTime(),
      data: {
        id: app.id,
        candidate_id: app.candidate_id,
        prospect: app.prospect,
        status: app.status,
        applied_at: app.applied_at,
        hired_at: app.last_activity_at,
        location: app.location?.address ?? null,
        source_id: app.source?.id ?? null,
        source_name: app.source?.public_name ?? null,
        credited_to_id: app.credited_to?.id ?? null,
        credited_to_name: app.credited_to?.name ?? null,
        recruiter_id: app.recruiter?.id ?? null,
        recruiter_name: app.recruiter?.name ?? null,
        coordinator_id: app.coordinator?.id ?? null,
        coordinator_name: app.coordinator?.name ?? null,
        job_ids: (app.jobs ?? []).map((j) => j.id).join(', '),
        job_names: (app.jobs ?? []).map((j) => j.name).join(', '),
        job_post_id: app.job_post_id,
        current_stage_id: app.current_stage?.id ?? null,
        current_stage_name: app.current_stage?.name ?? null,
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
    prospect: false,
    status: 'hired',
    applied_at: '2024-02-01T14:26:02.000Z',
    hired_at: '2024-03-15T10:00:00.000Z',
    location: 'New York, New York, USA',
    source_id: 33,
    source_name: 'Glassdoor',
    credited_to_id: null,
    credited_to_name: null,
    recruiter_id: 92120,
    recruiter_name: 'Greenhouse Admin',
    coordinator_id: 453636,
    coordinator_name: 'Jane Smith',
    job_ids: '211706',
    job_names: 'Community Manager - New York',
    job_post_id: 123,
    current_stage_id: null,
    current_stage_name: null,
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
