import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getProducts } from '../common';

export const getProductsAction = createAction({
  auth: shopifyAuth,
  name: 'get_products',
  displayName: 'Get Products',
  description: `Get existing products by title.`,
  audience: 'both',
  aiMetadata: { description: 'List Shopify products, optionally filtered by title, to discover products or look up their IDs. Use this read-only search before actions that need a product ID; omit the title to list products broadly. Read-only and idempotent.', idempotent: true },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { title } = propsValue;

    return await getProducts(auth, {
      title,
    });
  },
});
