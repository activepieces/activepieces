import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
export const searchProductAction = createAction({
  auth: bigcommerceAuth,
  name: 'search_product',
  displayName: 'Search Product',
  description: 'Searches for a product by name or SKU',
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Product name to search for',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Product SKU to search for',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();
    if (context.propsValue.name) params.append('name', context.propsValue.name);
    if (context.propsValue.sku) params.append('sku', context.propsValue.sku);
    
    const response = await makeRequest(
      context.auth,
      `/v3/catalog/products?${params.toString()}`,
      HttpMethod.GET
    );
    return response.body;
  },
});