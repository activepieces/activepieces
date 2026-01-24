import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const findOrCreateProduct = createAction({
  auth: bigcommerceAuth,
  name: 'findOrCreateProduct',
  displayName: 'Find or Create Product',
  description: 'Finds or creates a product',
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
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'Brand ID',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();
    params.append('name', context.propsValue.name);

    const response = await bigCommerceApiService.fetchProducts({
      auth: context.auth.props,
      queryString: params.toString(),
    });

    if (response.data && response.data.length > 0) {
      return { found: true, data: response.data };
    }

    const newProduct = await bigCommerceApiService.createProduct({
      auth: context.auth.props,
      payload: {
        name: context.propsValue.name,
        type: context.propsValue.type,
        sku: context.propsValue.sku,
        description: context.propsValue.description,
        weight: context.propsValue.weight,
        price: context.propsValue.price,
        brand_id: context.propsValue.brand_id,
      },
    });

    return { found: false, data: newProduct.data };
  },
});
