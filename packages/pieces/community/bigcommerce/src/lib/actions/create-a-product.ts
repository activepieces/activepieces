import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';
import { productOutputSchema } from '../common/schemas';

export const createAProduct = createAction({
  auth: bigcommerceAuth,
  name: 'createAProduct',
  classification: 'WRITE',
  displayName: 'Create a Product',
  description: 'Creates a Product',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new catalog product in a BigCommerce store. Use to add an item to the store. Requires name, type (physical or digital), weight, and price; SKU, description, and brand_id are optional. Not idempotent: each call adds a new product, so search the catalog first if it may already exist.',
    idempotent: false,
  },
  outputSchema: productOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Name of the product as shown in the store',
      placeholder: 'Blue T-Shirt',
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
    weight: Property.Number({
      displayName: 'Weight',
      description: 'Product weight in the weight unit set in your store settings (for example lb or kg)',
      placeholder: '1.5',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Product price in the store default currency',
      placeholder: '19.99',
      required: true,
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
    });
  },
});
