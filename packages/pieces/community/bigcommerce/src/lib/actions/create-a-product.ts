import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createProductAction = createAction({
  auth: bigcommerceAuth,
  name: 'create_product',
  displayName: 'Create Product',
  description: 'Creates a new product in BigCommerce',
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Name of the product',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'Type of product',
      required: true,
      options: {
        options: [
          { label: 'Physical', value: 'physical' },
          { label: 'Digital', value: 'digital' },
        ],
      },
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Product SKU',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Product description',
      required: false,
    }),
    weight: Property.Number({
      displayName: 'Weight',
      description: 'Product weight',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Product price',
      required: true,
    }),
    categories: Property.Array({
      displayName: 'Category IDs',
      description: 'Array of category IDs',
      required: false,
    }),
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'Brand ID',
      required: false,
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth,
      '/v3/catalog/products',
      HttpMethod.POST,
      {
        name: context.propsValue.name,
        type: context.propsValue.type,
        sku: context.propsValue.sku,
        description: context.propsValue.description,
        weight: context.propsValue.weight,
        price: context.propsValue.price,
        categories: context.propsValue.categories,
        brand_id: context.propsValue.brand_id,
      }
    );
    return response.body;
  },
});