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

    const createdAfter =
      lastFetchEpochMS > 0
        ? new Date(lastFetchEpochMS).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const response = await greenhouseApiCall<GreenhouseApplication[]>({
      apiKey,
      method: HttpMethod.GET,
      endpoint: '/applications',
      queryParams: {
        created_after: createdAfter,
        per_page: '100',
      },
    });

    const applications = response.body ?? [];

    return applications.map((app) => ({
      epochMilliSeconds: new Date(app.applied_at).getTime(),
      data: {
        id: app.id,
        candidate_id: app.candidate_id,
        prospect: app.prospect,
        status: app.status,
        applied_at: app.applied_at,
        rejected_at: app.rejected_at,
        last_activity_at: app.last_activity_at,
        location: app.location?.address ?? null,
        source_id: app.source?.id ?? null,
        source_name: app.source?.public_name ?? null,
        credited_to_id: app.credited_to?.id ?? null,
        credited_to_name: app.credited_to?.name ?? null,
        recruiter_id: app.recruiter?.id ?? null,
        recruiter_name: app.recruiter?.name ?? null,
        coordinator_id: app.coordinator?.id ?? null,
        coordinator_name: app.coordinator?.name ?? null,
        rejection_reason: app.rejection_reason,
        rejection_details: app.rejection_details,
        job_ids: (app.jobs ?? []).map((j) => j.id).join(', '),
        job_names: (app.jobs ?? []).map((j) => j.name).join(', '),
        job_post_id: app.job_post_id,
        current_stage_id: app.current_stage?.id ?? null,
        current_stage_name: app.current_stage?.name ?? null,
        prospective_office_id: app.prospective_office?.id ?? null,
        prospective_office_name: app.prospective_office?.name ?? null,
        prospective_department_id: app.prospective_department?.id ?? null,
        prospective_department_name: app.prospective_department?.name ?? null,
        prospect_pool_id: app.prospect_detail?.prospect_pool?.id ?? null,
        prospect_pool_name: app.prospect_detail?.prospect_pool?.name ?? null,
        prospect_stage_id: app.prospect_detail?.prospect_stage?.id ?? null,
        prospect_stage_name: app.prospect_detail?.prospect_stage?.name ?? null,
        prospect_owner_id: app.prospect_detail?.prospect_owner?.id ?? null,
        prospect_owner_name: app.prospect_detail?.prospect_owner?.name ?? null,
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
    prospect: false,
    status: 'active',
    applied_at: '2024-03-15T09:30:00.000Z',
    rejected_at: null,
    last_activity_at: '2024-03-15T09:30:00.000Z',
    location: 'New York, New York, USA',
    source_id: 12,
    source_name: 'LinkedIn',
    credited_to_id: null,
    credited_to_name: null,
    recruiter_id: 92120,
    recruiter_name: 'Greenhouse Admin',
    coordinator_id: null,
    coordinator_name: null,
    rejection_reason: null,
    rejection_details: null,
    job_ids: '144371',
    job_names: 'Software Engineer',
    job_post_id: null,
    current_stage_id: 77,
    current_stage_name: 'Application Review',
    prospective_office_id: null,
    prospective_office_name: null,
    prospective_department_id: null,
    prospective_department_name: null,
    prospect_pool_id: null,
    prospect_pool_name: null,
    prospect_stage_id: null,
    prospect_stage_name: null,
    prospect_owner_id: null,
    prospect_owner_name: null,
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
