import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzProps } from '../common/props';
import { reviewflowzSearch } from '../common/search';

export const findReviewAction = createAction({
  auth: reviewflowzAuth,
  name: 'find_review',
  classification: 'SEARCH',
  displayName: 'Find Review',
  description: 'Finds a review by its ID, or the latest one matching words, a source or a rating.',
  audience: 'both',
  aiMetadata: {
    description:
      'Find one Reviewflowz review: by its ID (rev_...), or the latest review matching words in its text, a source and a maximum rating. Returns found: false when nothing matches. Read-only.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({ displayName: 'Review ID', description: 'Like rev_918273.', required: false }),
    q: Property.ShortText({ displayName: 'Words in the review', required: false }),
    source: reviewflowzProps.optionalSource(),
    rating_max: Property.Number({ displayName: 'Maximum rating', required: false }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    return reviewflowzSearch.first(
      await reviewflowzSearch.list({
        auth,
        path: '/reviews',
        query: {
          limit: 1,
          include: 'reply',
          id: input.id,
          q: input.q,
          source: input.source,
          rating_max: input.rating_max ?? undefined,
        },
      }),
    );
  },
});
