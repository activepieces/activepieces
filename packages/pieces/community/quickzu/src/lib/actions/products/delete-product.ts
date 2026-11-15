import { createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { quickzuOutputSchemas } from '../../common/output-schemas';
import { makeClient, quickzuCommon, requireValue } from '../../common';

export const deleteProductAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_delete_product',
  outputSchema: quickzuOutputSchemas.statusMessage,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Product',
  description: 'Deletes an existing product from store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently removes a product from a Quickzu store by its product ID. Use to delete a catalog item. Not idempotent: deleting a product that is already gone or does not exist fails with an error.',
    idempotent: false,
  },
  props: {
    productId: quickzuCommon.productId(true),
  },
  async run(context) {
    const { productId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.deleteProduct(requireValue({ value: productId, label: 'Product' }));
  },
});
