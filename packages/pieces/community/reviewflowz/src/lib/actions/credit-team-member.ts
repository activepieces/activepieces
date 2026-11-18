import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';
import { reviewflowzProps } from '../common/props';
import { reviewflowzReviews } from '../common/reviews';

export const creditTeamMemberAction = createAction({
  auth: reviewflowzAuth,
  name: 'credit_team_member',
  classification: 'WRITE',
  displayName: 'Credit Team Member',
  description: 'Credits a team member for a review, for your staff reports.',
  audience: 'both',
  aiMetadata: {
    description:
      'Credit a Reviewflowz team member (a staff member named in reviews) for a review, so it counts in their staff reports. Crediting twice leaves one credit, so retries are safe.',
    idempotent: true,
  },
  props: {
    review: reviewflowzProps.reviewId(),
    owner: reviewflowzProps.owner(),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    await reviewflowzApi.call({ auth, method: HttpMethod.PUT, path: `/reviews/${encodeURIComponent(String(input.review))}/owners/${encodeURIComponent(String(input.owner))}` });
    return reviewflowzReviews.getReview({ auth, id: input.review });
  },
});
