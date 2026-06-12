import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const deleteAProduct = createAction({
  auth: bigcommerceAuth,
  name: 'deleteAProduct',
  displayName: 'Delete a Product',
  description: 'Deletes an existing Product',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a catalog product from a BigCommerce store by its productId. Use to remove an item from the store. This is destructive and cannot be undone. Effectively idempotent: deleting an already-removed product has no further effect, though the call may error if the id no longer exists.',
    idempotent: true,
  },
  props: {
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'The ID of the product to delete',
      required: true,
    }),
  },
  async run(context) {
    return await bigCommerceApiService.deleteProduct({
      auth: context.auth.props,
      productId: context.propsValue.productId,
    });
  },
});
