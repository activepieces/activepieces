import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall } from '../common';

type ScorecardUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

type ScorecardAttribute = {
  name: string;
  priority: string;
  rating: string | null;
  note: string | null;
};

type GreenhouseScorecard = {
  id: number;
  updated_at: string;
  created_at: string;
  interview_id: number | null;
  interviewed_at: string | null;
  candidate_id: number;
  application_id: number;
  interview_step: { id: number; name: string } | null;
  interviewer: ScorecardUser | null;
  submitted_by: ScorecardUser | null;
  submitted_at: string | null;
  overall_recommendation: string | null;
  attributes: ScorecardAttribute[];
};

export const findDueScorecardAction = createAction({
  name: 'find_due_scorecard',
  displayName: 'Find Due Scorecard',
  description: 'Retrieves the full details of a due scorecard by its ID. Use with the New Due Scorecard trigger to look up the scorecard that fired the flow.',
  auth: greenhouseAuth,
  props: {
    scorecard_id: Property.ShortText({
      displayName: 'Scorecard ID',
      description:
        'The numeric ID of the scorecard to retrieve. Typically mapped from a **New Due Scorecard** trigger step.',
      required: true,
    }),
  },
  async run(context) {
    const { scorecard_id } = context.propsValue;

    const response = await greenhouseApiCall<GreenhouseScorecard>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      endpoint: `/scorecards/${scorecard_id}`,
    });

    const s = response.body;
    return {
      id: s.id,
      candidate_id: s.candidate_id,
      application_id: s.application_id,
      interview_id: s.interview_id,
      interview_step_id: s.interview_step?.id ?? null,
      interview_step_name: s.interview_step?.name ?? null,
      interviewer_id: s.interviewer?.id ?? null,
      interviewer_first_name: s.interviewer?.first_name ?? null,
      interviewer_last_name: s.interviewer?.last_name ?? null,
      interviewer_email: s.interviewer?.email ?? null,
      overall_recommendation: s.overall_recommendation,
      submitted_at: s.submitted_at,
      submitted_by_id: s.submitted_by?.id ?? null,
      submitted_by_first_name: s.submitted_by?.first_name ?? null,
      submitted_by_last_name: s.submitted_by?.last_name ?? null,
      interviewed_at: s.interviewed_at,
      created_at: s.created_at,
      updated_at: s.updated_at,
    };
  },
});
