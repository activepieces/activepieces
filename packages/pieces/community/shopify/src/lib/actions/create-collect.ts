import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createCollect } from '../common';

export const createCollectAction = createAction({
  auth: shopifyAuth,
  name: 'create_collect',
  classification: 'WRITE',
  displayName: 'Add Product to Collection',
  description: `Add a product to a collection.`,
  audience: 'both',
  aiMetadata: { description: 'Add a product to a custom collection in Shopify by linking a product ID and collection ID (a "collect"). Use to organize a product into a manual collection; requires both IDs. Each call creates a new link, so repeating it may produce duplicate collects.', idempotent: false },
  propertyGroups: [
    {
      key: 'link',
      display: 'section',
      label: 'Product and collection',
      icon: 'tag',
      props: ['id', 'collectionId'],
    },
  ],
  props: {
    id: Property.Number({
      displayName: 'Product ID',
      description: "The number at the end of the product's URL in Shopify admin.",
      required: true,
      width: 'half',
    }),
    collectionId: Property.Number({
      displayName: 'Collection ID',
      description: "The number at the end of the collection's URL in Shopify admin.",
      required: true,
      width: 'half',
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
