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

type GreenhouseScorecard = {
  id: number;
  created_at: string;
  updated_at: string;
  interview_kit_id: number;
  interviewer_id: number;
  submitter_id: number;
  application_id: number;
  status: 'draft' | 'complete';
  interviewed_at: string | null;
  submitted_at: string | null;
  notes: string | null;
  candidate_rating: string;
};

type GreenhouseAuth = AppConnectionValueForAuthProperty<typeof greenhouseAuth>;

const polling: Polling<GreenhouseAuth, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const createdAfter =
      lastFetchEpochMS > 0
        ? new Date(lastFetchEpochMS).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const response = await greenhouseApiCall<GreenhouseScorecard[]>({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      endpoint: '/scorecards',
      queryParams: {
        'created_at[gte]': createdAfter,
        per_page: '500',
        status: 'draft',
      },
    });

    const scorecards = Array.isArray(response.body) ? response.body : [];

    return scorecards.map((s) => ({
      epochMilliSeconds: new Date(s.created_at).getTime(),
      data: {
        id: s.id,
        application_id: s.application_id,
        interview_kit_id: s.interview_kit_id,
        interviewer_id: s.interviewer_id,
        submitter_id: s.submitter_id,
        status: s.status,
        candidate_rating: s.candidate_rating,
        notes: s.notes,
        interviewed_at: s.interviewed_at,
        submitted_at: s.submitted_at,
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
    application_id: 3456,
    interview_kit_id: 789,
    interviewer_id: 4080,
    submitter_id: 4080,
    status: 'draft',
    candidate_rating: 'strong_yes',
    notes: null,
    interviewed_at: '2024-03-18T16:00:00.000Z',
    submitted_at: null,
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
