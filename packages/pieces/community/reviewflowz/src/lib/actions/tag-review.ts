import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';
import { reviewflowzProps } from '../common/props';
import { reviewflowzReviews } from '../common/reviews';

export const tagReviewAction = createAction({
  auth: reviewflowzAuth,
  name: 'tag_review',
  classification: 'WRITE',
  displayName: 'Tag Review',
  description: "Adds a tag to a review. A tag name we don't have yet is created.",
  audience: 'both',
  aiMetadata: {
    description:
      'Add a tag to a Reviewflowz review, by tag ID or by name (a new name creates the tag). Returns the review with its tags. Tagging twice leaves one tag, so retries are safe.',
    idempotent: true,
  },
  props: {
    review: reviewflowzProps.reviewId(),
    tag: reviewflowzProps.tag('Pick one, or map a tag name: a name we do not have yet is created.'),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const tag = await reviewflowzReviews.tagId({ auth, value: input.tag, create: true });
    await reviewflowzApi.call({ auth, method: HttpMethod.PUT, path: `/reviews/${encodeURIComponent(String(input.review))}/tags/${encodeURIComponent(String(tag))}` });
    return reviewflowzReviews.getReview({ auth, id: input.review });
  },
});
