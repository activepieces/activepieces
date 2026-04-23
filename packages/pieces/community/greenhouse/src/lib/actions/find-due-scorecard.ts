import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
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
  public_notes: string | null;
  private_notes: string | null;
  candidate_rating: string;
};

export const findDueScorecardAction = createAction({
  name: 'find_due_scorecard',
  displayName: 'Find Due Scorecard',
  description:
    'Retrieves the full details of a scorecard by its ID. Use with the New Scorecard Due trigger to look up the scorecard that fired the flow.',
  auth: greenhouseAuth,
  props: {
    scorecard_id: Property.ShortText({
      displayName: 'Scorecard ID',
      description:
        'The numeric ID of the scorecard to retrieve. Typically mapped from a **New Scorecard Due** trigger step.',
      required: true,
    }),
  },
  async run(context) {
    const { scorecard_id } = context.propsValue;

    const response = await greenhouseApiCall<GreenhouseScorecard[]>({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      endpoint: '/scorecards',
      queryParams: { ids: scorecard_id },
    });

    const scorecards = Array.isArray(response.body) ? response.body : [];
    const s = scorecards[0];

    if (!s) {
      return null;
    }

    return {
      id: s.id,
      application_id: s.application_id,
      interview_kit_id: s.interview_kit_id,
      interviewer_id: s.interviewer_id,
      submitter_id: s.submitter_id,
      status: s.status,
      candidate_rating: s.candidate_rating,
      notes: s.notes,
      public_notes: s.public_notes,
      private_notes: s.private_notes,
      interviewed_at: s.interviewed_at,
      submitted_at: s.submitted_at,
      created_at: s.created_at,
      updated_at: s.updated_at,
    };
  },
});
