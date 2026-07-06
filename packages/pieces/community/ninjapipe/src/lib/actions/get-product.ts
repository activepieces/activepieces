import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getProduct = createAction({
  auth: ninjapipeAuth,
  name: 'get_product',
  displayName: 'Get Product',
  description: 'Retrieves a product by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single product by its ID to read its current details. Use when you already have the product ID; to find a product by name or SKU, list/search products first. Read-only and idempotent.', idempotent: true },
  props: {
    productId: ninjapipeCommon.productDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/products/${encodeURIComponent(String(context.propsValue.productId))}` });
    return flattenCustomFields(response.body);
  },
});
