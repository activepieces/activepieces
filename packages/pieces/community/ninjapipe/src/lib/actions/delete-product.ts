import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deleteProduct = createAction({
  auth: ninjapipeAuth,
  name: 'delete_product',
  displayName: 'Delete Product',
  description: 'Deletes a product by ID.',
  props: {
    productId: ninjapipeCommon.productDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.DELETE, path: `/products/${encodeURIComponent(String(context.propsValue.productId))}` });
    return { success: true, deleted_id: context.propsValue.productId };
  },
});
