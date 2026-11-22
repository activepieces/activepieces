import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';
import { findOrCreateProductOutputSchema } from '../common/schemas';

export const findOrCreateProduct = createAction({
  auth: bigcommerceAuth,
  name: 'findOrCreateProduct',
  classification: 'WRITE',
  displayName: 'Find or Create Product',
  description: 'Finds or creates a product',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a catalog product by SKU (when given), then by exact name, and returns the match if found, otherwise creates a new product from the supplied details (type, weight, and price required). Use instead of Create a Product when the item may already exist, to avoid duplicates. Idempotent: repeated calls match the same existing product by name rather than creating duplicates. When found, data is a list of matching products; when created, data is the new product object.',
    idempotent: true,
  },
  outputSchema: findOrCreateProductOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Name of the product as shown in the store',
      placeholder: 'Blue T-Shirt',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'Physical or digital product',
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
      description: 'Product SKU. When given, an existing product with this SKU is found first.',
      required: false,
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
    const sku = context.propsValue.sku?.trim();
    if (sku) {
      const bySku = await bigCommerceApiService.fetchProducts({
        auth: context.auth.props,
        query: { sku },
      });
      if (bySku.data.length > 0) {
        return { found: true, data: bySku.data };
      }
    }

    const response = await bigCommerceApiService.fetchProducts({
      auth: context.auth.props,
      query: { name: context.propsValue.name },
    });

    if (response.data.length > 0) {
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

    return { found: false, data: newProduct?.data };
  },
});
