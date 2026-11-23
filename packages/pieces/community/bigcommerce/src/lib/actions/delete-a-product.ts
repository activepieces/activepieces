import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';
import { deleteProductOutputSchema } from '../common/schemas';

export const deleteAProduct = createAction({
  auth: bigcommerceAuth,
  name: 'deleteAProduct',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete a Product',
  description: 'Deletes an existing Product',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a catalog product from a BigCommerce store by its productId. Use to remove an item from the store. This is destructive and cannot be undone. Returns { deleted: true, id } on success. Idempotent: deleting an id that no longer exists also succeeds (BigCommerce returns 204).',
    idempotent: true,
  },
  outputSchema: deleteProductOutputSchema,
  props: {
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'The ID of the product to delete',
      required: true,
    }),
  },
  async run(context) {
    const productId = context.propsValue.productId.trim();
    await bigCommerceApiService.deleteProduct({
      auth: context.auth.props,
      productId,
    });
    return { deleted: true, id: productId };
  },
});
