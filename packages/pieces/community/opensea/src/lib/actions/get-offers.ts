import { createAction, Property } from '@activepieces/pieces-framework';
import { openSeaAuth } from '../auth';
import { getOffers } from '../opensea-api';

export const getOffersAction = createAction({
  auth: openSeaAuth,
  name: 'get_offers',
  displayName: 'Get Best Offers',
  description: 'Get the best (highest value) active offers for a collection.',
  props: {
    collection_slug: Property.ShortText({
      displayName: 'Collection Slug',
      description: 'The unique identifier (slug) for the collection, e.g. "boredapeyachtclub".',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of offers to return (max 100).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { collection_slug, limit } = context.propsValue;
    return await getOffers(context.auth, collection_slug, String(limit ?? 20));
  },
});
