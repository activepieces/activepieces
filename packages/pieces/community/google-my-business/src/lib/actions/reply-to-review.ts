import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { replyToReviewActionOutputSchema } from '../output-schemas';

export const replyToReview = createAction({
  name: 'reply-to-review',
  outputSchema: replyToReviewActionOutputSchema,
  classification: 'WRITE',
  displayName: 'Reply to Review',
  description: 'Creates or replaces the owner reply to a review.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts the business owner reply to a customer review of a Google Business Profile location, replacing any existing reply. The reply is public on Google Maps and Search. Safe to repeat with the same comment since it upserts.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    account_id: gmbApi.props.accountId(),
    location_id: gmbApi.props.locationId(),
    review_id: gmbApi.props.reviewId(),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The reply text.',
      required: true,
    }),
  },
  async run(ctx) {
    return gmbApi.request<Record<string, unknown>>({
      accessToken: ctx.auth.access_token,
      method: HttpMethod.PUT,
      url: `${gmbApi.resourceNames.reviewUrl(ctx.propsValue)}/reply`,
      body: { comment: ctx.propsValue.comment },
    });
  },
});
