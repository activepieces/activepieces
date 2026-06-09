import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getProduct = createAction({
  auth: ninjapipeAuth,
  name: 'get_product',
  displayName: 'Get Product',
  description: 'Retrieves a product by ID.',
  props: {
    productId: ninjapipeCommon.productDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/products/${encodeURIComponent(String(context.propsValue.productId))}` });
    return flattenCustomFields(response.body);
  },
});
