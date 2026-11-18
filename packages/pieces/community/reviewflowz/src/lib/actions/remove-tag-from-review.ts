import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';
import { reviewflowzProps } from '../common/props';
import { reviewflowzReviews } from '../common/reviews';

export const removeTagFromReviewAction = createAction({
  auth: reviewflowzAuth,
  name: 'remove_tag_from_review',
  classification: 'WRITE',
  displayName: 'Remove Tag From Review',
  description: 'Takes a tag off a review.',
  audience: 'both',
  aiMetadata: {
    description:
      'Take a tag off a Reviewflowz review, by tag ID or exact name. The tag itself stays on the account. A tag already off is not an error, so retries are safe.',
    idempotent: true,
  },
  props: {
    review: reviewflowzProps.reviewId(),
    tag: reviewflowzProps.tag(),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const tag = await reviewflowzReviews.tagId({ auth, value: input.tag, create: false });
    const response = await reviewflowzApi.send({ auth, method: HttpMethod.DELETE, path: `/reviews/${encodeURIComponent(String(input.review))}/tags/${encodeURIComponent(String(tag))}` });
    if (!response.ok && response.status !== 404) {
      throw new Error(reviewflowzApi.errorMessage({ status: response.status, body: response.body }));
    }
    return reviewflowzReviews.getReview({ auth, id: input.review });
  },
});
