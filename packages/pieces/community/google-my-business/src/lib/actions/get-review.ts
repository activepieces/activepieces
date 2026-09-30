import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { getReviewActionOutputSchema } from '../output-schemas';

export const getReview = createAction({
  name: 'get-review',
  outputSchema: getReviewActionOutputSchema,
  classification: 'READ',
  displayName: 'Get Review',
  description: 'Gets one customer review of a location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one customer review of a Google Business Profile location with reviewer, star rating, comment, timestamps and the current owner reply if any. Use to check a review before or after replying. Read-only and safe to repeat.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    account_id: gmbApi.props.accountId(),
    location_id: gmbApi.props.locationId(),
    review_id: gmbApi.props.reviewId(),
  },
  async run(ctx) {
    return gmbApi.request<Record<string, unknown>>({
      accessToken: ctx.auth.access_token,
      method: HttpMethod.GET,
      url: gmbApi.resourceNames.reviewUrl(ctx.propsValue),
    });
  },
});
