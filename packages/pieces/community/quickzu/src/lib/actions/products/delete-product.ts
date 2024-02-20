import { createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../..';
import { makeClient, quickzuCommon } from '../../common';

export const deleteProductAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_delete_product',
  displayName: 'Delete Product',
  description: 'Deletes an existing product from store.',
  props: {
    productId: quickzuCommon.productId(true),
  },
  async run(context) {
    const { productId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.deleteProduct(productId!);
  },
});
