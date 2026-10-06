import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetSatisfactionRatingOutputSchema } from '../../../output-schemas';

export const zendeskGetSatisfactionRating = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_satisfaction_rating',
  outputSchema: zendeskGetSatisfactionRatingOutputSchema,
  displayName: 'Get Satisfaction Rating',
  description: 'Get a satisfaction rating by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one customer satisfaction rating with score, comment, reason and ticket ID. Requires an admin.',
    idempotent: true,
  },
  props: {
    satisfaction_rating_id: zendeskAiProps.requiredId({ displayName: 'Satisfaction Rating ID', description: 'Numeric rating ID, from List Satisfaction Ratings.' }),
  },
  async run({ auth, propsValue }) {
    const satisfactionRatingId = zendeskApi.id({ value: propsValue.satisfaction_rating_id, label: 'Satisfaction Rating ID' });
    const response = await zendeskApi.request<{ satisfaction_rating: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/satisfaction_ratings/${satisfactionRatingId}.json`,
    });
    return response.satisfaction_rating;
  },
});
