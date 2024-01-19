import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createCollect } from '../common';

export const createCollectAction = createAction({
  auth: shopifyAuth,
  name: 'create_collect',
  displayName: 'Create Collect',
  description: `Add a product to a collection.`,
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
