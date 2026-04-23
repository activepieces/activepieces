import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deleteProduct = createAction({
  auth: ninjapipeAuth,
  name: 'delete_product',
  displayName: 'Delete Product',
  description: 'Deletes a product by ID.',
  props: {
    productId: Property.ShortText({ displayName: 'Product ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.DELETE, path: `/products/${context.propsValue.productId}` });
    return { success: true, deleted_id: context.propsValue.productId };
  },
});
