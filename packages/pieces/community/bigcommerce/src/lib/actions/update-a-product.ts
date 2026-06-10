import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const updateAProduct = createAction({
  auth: bigcommerceAuth,
  name: 'updateAProduct',
  displayName: 'Update a Product',
  description: 'Updates an existing Product',
  props: {
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'The ID of the product to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Name of the product',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'Type of product',
      required: false,
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
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Product price',
      required: false,
    }),
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'Brand ID',
      required: false,
    }),
  },
  async run(context) {
    const { productId, ...payload } = context.propsValue;

    // Filter out null/undefined values to prevent overwriting existing data with nulls
    const filteredPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== null && v !== undefined)
    );

    return await bigCommerceApiService.updateProduct({
      auth: context.auth.props,
      productId,
      payload: filteredPayload,
    });
  },
});
