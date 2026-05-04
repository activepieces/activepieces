import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const deleteAProduct = createAction({
  auth: bigcommerceAuth,
  name: 'deleteAProduct',
  displayName: 'Delete a Product',
  description: 'Deletes an existing Product',
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
