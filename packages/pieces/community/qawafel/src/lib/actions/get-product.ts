import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';

export const getProduct = createAction({
  auth: qawafelAuth,
  name: 'get_product',
  displayName: 'Get Product',
  description:
    'Fetch a single product by its Qawafel ID. Returns the full product including price, descriptions, and active status.',
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description:
        'The Qawafel product ID (starts with `prod_`). You can find this on a product page in Qawafel, in the output of "List Products", or from a webhook trigger.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.GET,
      path: `/products/${propsValue.product_id}`,
    });
    return response.body;
  },
});
