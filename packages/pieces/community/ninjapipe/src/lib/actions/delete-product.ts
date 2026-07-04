import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deleteProduct = createAction({
  auth: ninjapipeAuth,
  name: 'delete_product',
  displayName: 'Delete Product',
  description: 'Deletes a product by ID.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a product identified by Product ID. Pick this to remove a product from the catalog; the change is destructive and cannot be undone. Re-running after deletion typically fails since the ID no longer exists.', idempotent: false },
  props: {
    productId: ninjapipeCommon.productDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.DELETE, path: `/products/${encodeURIComponent(String(context.propsValue.productId))}` });
    return { success: true, deleted_id: context.propsValue.productId };
  },
});
