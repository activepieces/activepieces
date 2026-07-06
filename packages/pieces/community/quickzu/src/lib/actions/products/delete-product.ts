import { createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { makeClient, quickzuCommon } from '../../common';

export const deleteProductAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_delete_product',
  displayName: 'Delete Product',
  description: 'Deletes an existing product from store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently removes a product from a Quickzu store by its product ID. Use to delete a catalog item. Idempotent: once the product is gone, repeating the call leaves the store in the same state.',
    idempotent: true,
  },
  props: {
    productId: quickzuCommon.productId(true),
  },
  async run(context) {
    const { productId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.deleteProduct(productId!);
  },
});
