import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const searchProduct = createAction({
  auth: bigcommerceAuth,
  name: 'searchProduct',
  displayName: 'Search Product',
  description: 'Searches for a product in the catalog',
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
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      required: false,
      options: {
        options: [
          { label: 'Physical', value: 'physical' },
          { label: 'Digital', value: 'digital' },
        ],
      },
    }),
    brand_id: Property.ShortText({
      displayName: 'Brand ID',
      description: 'Brand ID to search for',
      required: false,
    }),
    weight: Property.Number({
      displayName: 'Weight',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();
    if (context.propsValue.name) params.append('name', context.propsValue.name);
    if (context.propsValue.sku) params.append('sku', context.propsValue.sku);
    if (context.propsValue.brand_id)
      params.append('brand_id', context.propsValue.brand_id);
    if (context.propsValue.type)
      params.append('type', context.propsValue.type);
    if (context.propsValue.price)
      params.append('price', String(context.propsValue.price));
    if (context.propsValue.weight)
      params.append('weight', String(context.propsValue.weight));

    return await bigCommerceApiService.fetchProducts({
      auth: context.auth.props,
      queryString: params.toString(),
    });
  },
});
