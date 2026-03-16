import { createAction, Property } from '@activepieces/pieces-framework';
import { openSeaAuth } from '../auth';
import { getCollectionStats } from '../opensea-api';

export const getCollectionStatsAction = createAction({
  auth: openSeaAuth,
  name: 'get_collection_stats',
  displayName: 'Get Collection Stats',
  description: 'Get floor price, total volume, number of owners, and other statistics for a collection.',
  props: {
    collection_slug: Property.ShortText({
      displayName: 'Collection Slug',
      description: 'The unique identifier (slug) for the collection, e.g. "boredapeyachtclub".',
      required: true,
    }),
  },
  async run(context) {
    const { collection_slug } = context.propsValue;
    return await getCollectionStats(context.auth, collection_slug);
  },
});
