import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListSatisfactionRatingsOutputSchema } from '../../../output-schemas';

export const zendeskListSatisfactionRatings = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_satisfaction_ratings',
  outputSchema: zendeskListSatisfactionRatingsOutputSchema,
  displayName: 'List Satisfaction Ratings',
  description: 'List customer satisfaction (CSAT) ratings.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists customer satisfaction ratings with score, comment, reason and ticket ID, newest first. Requires an admin.',
    idempotent: true,
  },
  props: {
    score: Property.StaticDropdown({
      displayName: 'Score',
      description: 'Only return ratings with this score.',
      required: false,
      options: { options: [{ label: 'Offered', value: 'offered' }, { label: 'Unoffered', value: 'unoffered' }, { label: 'Received', value: 'received' }, { label: 'Good', value: 'good' }, { label: 'Bad', value: 'bad' }, { label: 'Good with comment', value: 'good_with_comment' }, { label: 'Bad with comment', value: 'bad_with_comment' }] },
    }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ satisfaction_ratings: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/satisfaction_ratings.json`,
      queryParams: {
        ...zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
        ...zendeskApi.query({ score: propsValue.score }),
      },
    });
    return {
      satisfaction_ratings: response.satisfaction_ratings,
      count: response.satisfaction_ratings.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
