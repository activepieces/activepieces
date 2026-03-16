import { createAction, Property } from '@activepieces/pieces-framework';
import { openSeaAuth } from '../auth';
import { listNftsByCollection } from '../opensea-api';

export const listNftsByCollectionAction = createAction({
  auth: openSeaAuth,
  name: 'list_nfts_by_collection',
  displayName: 'List NFTs by Collection',
  description: 'List NFTs within a specific collection by collection slug.',
  props: {
    collection_slug: Property.ShortText({
      displayName: 'Collection Slug',
      description: 'The unique identifier (slug) for the collection, e.g. "boredapeyachtclub".',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of NFTs to return (max 200).',
      required: false,
      defaultValue: 20,
    }),
    next: Property.ShortText({
      displayName: 'Cursor (next page)',
      description: 'Pagination cursor from a previous response to get the next page.',
      required: false,
    }),
  },
  async run(context) {
    const { collection_slug, limit, next } = context.propsValue;
    return await listNftsByCollection(
      context.auth,
      collection_slug,
      String(limit ?? 20),
      next ?? undefined
    );
  },
});
