import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createCollect } from '../common';

export const createCollectAction = createAction({
  auth: shopifyAuth,
  name: 'create_collect',
  displayName: 'Create Collect',
  description: `Add a product to a collection.`,
  audience: 'both',
  aiMetadata: { description: 'Add a product to a custom collection in Shopify by linking a product ID and collection ID (a "collect"). Use to organize a product into a manual collection; requires both IDs. Each call creates a new link, so repeating it may produce duplicate collects.', idempotent: false },
  props: {
    id: Property.Number({
      displayName: 'Product',
      description: 'The ID of the product.',
      required: true,
    }),
    collectionId: Property.Number({
      displayName: 'Collection',
      description: 'The ID of the collection.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { id, collectionId } = propsValue;

    return await createCollect(
      {
        product_id: id,
        collection_id: collectionId,
      },
      auth
    );
  },
});
