import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { makeClient, quickzuCommon } from '../../common';

export const listProductsAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_list_products',
  displayName: 'List Products',
  description: 'Retrieves all or single product details from store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves products from a Quickzu store. With no search term or category it returns all products; supplying a name term and/or a category filters the result to matches. Use to look up products or resolve a product ID before another action. Idempotent read-only lookup.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({
      displayName: 'Product name that need to be search.',
      required: false,
    }),
    categoryId: quickzuCommon.categoryId(false),
  },
  async run(context) {
    const { term, categoryId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.listProducts(term, categoryId);
  },
});
