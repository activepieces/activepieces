import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { deleteReviewReplyActionOutputSchema } from '../output-schemas';

export const deleteReviewReply = createAction({
  name: 'delete-review-reply',
  outputSchema: deleteReviewReplyActionOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Review Reply',
  description: 'Deletes the owner reply to a review.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes the business owner reply from a customer review of a Google Business Profile location. The review itself is not deleted. Use only when the user asks to take a reply down.',
    idempotent: false,
  },
  auth: googleAuth,
  props: {
    account_id: gmbApi.props.accountId(),
    location_id: gmbApi.props.locationId(),
    review_id: gmbApi.props.reviewId(),
  },
  async run(ctx) {
    await gmbApi.request<unknown>({
      accessToken: ctx.auth.access_token,
      method: HttpMethod.DELETE,
      url: `${gmbApi.resourceNames.reviewUrl(ctx.propsValue)}/reply`,
    });
    return { success: true };
  },
});
