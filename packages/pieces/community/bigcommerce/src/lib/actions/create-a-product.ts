import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const createAProduct = createAction({
  auth: bigcommerceAuth,
  name: 'createAProduct',
  displayName: 'Create a Product',
  description: 'Creates a Product',
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
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'Brand ID',
      required: false,
    }),
  },
  async run(context) {
    return await bigCommerceApiService.createProduct({
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
    });;
  },
});
