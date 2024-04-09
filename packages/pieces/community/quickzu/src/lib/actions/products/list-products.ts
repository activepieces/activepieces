import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../..';
import { makeClient, quickzuCommon } from '../../common';

export const listProductsAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_list_products',
  displayName: 'List Products',
  description: 'Retrieves all or single product details from store.',
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
