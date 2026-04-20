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

type ScorecardUser = {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  employee_id: string | null;
};

type ScorecardAttribute = {
  name: string;
  type: string;
  note: string | null;
  rating: string | null;
};

type GreenhouseScorecard = {
  id: number;
  updated_at: string;
  created_at: string;
  interview: string | null;
  interview_step: { id: number; name: string } | null;
  candidate_id: number;
  application_id: number;
  interviewed_at: string | null;
  submitted_by: ScorecardUser | null;
  interviewer: ScorecardUser | null;
  submitted_at: string | null;
  overall_recommendation: string | null;
  attributes: ScorecardAttribute[];
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

    const response = await greenhouseApiCall<GreenhouseScorecard[]>({
      apiKey,
      method: HttpMethod.GET,
      endpoint: '/scorecards',
      queryParams: {
        created_after: createdAfter,
        per_page: '100',
      },
    });

    const scorecards = response.body ?? [];

    // Due scorecards are those that have not yet been submitted
    return scorecards
      .filter((s) => s.submitted_at === null)
      .map((s) => ({
        epochMilliSeconds: new Date(s.created_at).getTime(),
        data: {
          id: s.id,
          candidate_id: s.candidate_id,
          application_id: s.application_id,
          interview: s.interview,
          interview_step_id: s.interview_step?.id ?? null,
          interview_step_name: s.interview_step?.name ?? null,
          interviewer_id: s.interviewer?.id ?? null,
          interviewer_first_name: s.interviewer?.first_name ?? null,
          interviewer_last_name: s.interviewer?.last_name ?? null,
          interviewer_name: s.interviewer?.name ?? null,
          interviewed_at: s.interviewed_at,
          submitted_at: s.submitted_at,
          overall_recommendation: s.overall_recommendation,
          created_at: s.created_at,
          updated_at: s.updated_at,
        },
      }));
  },
};

export const newScorecardDueTrigger = createTrigger({
  auth: greenhouseAuth,
  name: 'new_scorecard_due',
  displayName: 'New Scorecard Due',
  description: 'Triggers when a new scorecard is due — i.e. created but not yet submitted by the interviewer.',
  props: {},
  sampleData: {
    id: 11274,
    candidate_id: 1234,
    application_id: 3456,
    interview: 'Application Review',
    interview_step_id: 432,
    interview_step_name: 'Application Review',
    interviewer_id: 4080,
    interviewer_first_name: 'Kate',
    interviewer_last_name: 'Austen',
    interviewer_name: 'Kate Austen',
    interviewed_at: '2024-03-18T16:00:00.000Z',
    submitted_at: null,
    overall_recommendation: null,
    created_at: '2024-03-18T17:00:00.000Z',
    updated_at: '2024-03-18T17:00:00.000Z',
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
