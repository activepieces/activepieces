import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
export const findOrCreateProductAction = createAction({
  auth: bigcommerceAuth,
  name: 'find_or_create_product',
  displayName: 'Find or Create Product',
  description: 'Finds an existing product or creates a new one',
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      required: true,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      required: true,
      options: {
        options: [
          { label: 'Physical', value: 'physical' },
          { label: 'Digital', value: 'digital' },
        ],
      },
    }),
    weight: Property.Number({
      displayName: 'Weight',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run(context) {
    // Search for existing product by SKU or name
    const searchParams = new URLSearchParams();
    if (context.propsValue.sku) {
      searchParams.append('sku', context.propsValue.sku);
    } else {
      searchParams.append('name', context.propsValue.name);
    }
    
    const searchResponse = await makeRequest(
      context.auth,
      `/v3/catalog/products?${searchParams.toString()}`,
      HttpMethod.GET
    );
    
    if (searchResponse.body.data && searchResponse.body.data.length > 0) {
      return { found: true, product: searchResponse.body.data[0] };
    }
    
    // Create new product
    const createResponse = await makeRequest(
      context.auth,
      '/v3/catalog/products',
      HttpMethod.POST,
      {
        name: context.propsValue.name,
        sku: context.propsValue.sku,
        type: context.propsValue.type,
        weight: context.propsValue.weight,
        price: context.propsValue.price,
        description: context.propsValue.description,
      }
    );
    
    return { found: false, product: createResponse.body.data };
  },
});
