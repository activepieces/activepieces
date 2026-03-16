import { createAction, Property } from '@activepieces/pieces-framework';
import { openSeaAuth } from '../auth';
import { getListings } from '../opensea-api';

export const getListingsAction = createAction({
  auth: openSeaAuth,
  name: 'get_listings',
  displayName: 'Get Best Listings',
  description: 'Get the best (lowest price) active listings for a collection.',
  props: {
    collection_slug: Property.ShortText({
      displayName: 'Collection Slug',
      description: 'The unique identifier (slug) for the collection, e.g. "boredapeyachtclub".',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of listings to return (max 100).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { collection_slug, limit } = context.propsValue;
    return await getListings(context.auth, collection_slug, String(limit ?? 20));
  },
});
