import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzProps } from '../common/props';
import { reviewflowzSearch } from '../common/search';

export const lookUpBusinessListingAction = createAction({
  auth: reviewflowzAuth,
  name: 'look_up_business_listing',
  classification: 'SEARCH',
  displayName: 'Look Up Business Listing',
  description: "Finds a business's listing on a platform, to add it as a source.",
  audience: 'both',
  aiMetadata: {
    description:
      "Search a review platform for a business's listing by name and city, returning its URL to pass to Add Source. Returns found: false when the platform has no match. Read-only.",
    idempotent: true,
  },
  props: {
    q: Property.ShortText({ displayName: 'Business name and city', description: 'Like Tour Eiffel Paris.', required: true }),
    platform: reviewflowzProps.platform(),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    return reviewflowzSearch.first(
      await reviewflowzSearch.list({ auth, path: '/lookup', query: { q: input.q, platform: input.platform } }),
    );
  },
});
