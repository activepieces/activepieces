import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getProduct = createAction({
  auth: ninjapipeAuth,
  name: 'get_product',
  displayName: 'Get Product',
  description: 'Retrieves a product by ID.',
  props: {
    productId: Property.ShortText({ displayName: 'Product ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.GET, path: `/products/${context.propsValue.productId}` });
    return flattenCustomFields(response.body);
  },
});
