import { createAction } from '@activepieces/pieces-framework';
import { provenExpertAuth } from '../common/auth';
import { provenExpertCommon } from '../common';

export const getRatingSummaryAction = createAction({
  auth: provenExpertAuth,
  name: 'get_rating_summary',
  displayName: 'Get Rating Summary',
  description: 'Retrieves the overall rating value and total review count for your ProvenExpert profile.',
  audience: 'both',
  aiMetadata: { description: 'Fetches the aggregate rating value and total review count for the authenticated ProvenExpert profile. Use to read a single profile-wide rating score, not individual reviews. Takes no input; read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    const response = await provenExpertCommon.apiCall<{
      status: string;
      ratingValue?: number;
      reviewCount?: number;
    }>({
      auth: context.auth.props,
      path: '/rating/summary/get',
    });
    return {
      status: response.body.status,
      rating_value: response.body.ratingValue ?? null,
      review_count: response.body.reviewCount ?? null,
    };
  },
});
