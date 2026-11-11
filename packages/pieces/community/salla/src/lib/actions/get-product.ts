import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { ProductLookup, sallaProducts } from '../common/products';

export const getProductAction = createAction({
  auth: sallaAuth,
  name: 'get_product',
  classification: 'READ',
  displayName: 'Get Product',
  description: 'Gets one product by its product ID or SKU.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one Salla product by its numeric product ID (1672932878) or its exact SKU (TSHIRT-RED-M), with prices, stock, images, categories, options and variants. Use List Products to search by keyword, status or category when you do not have the ID or SKU. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.product,
  props: {
    find_by: Property.StaticDropdown<ProductLookup, true>({
      displayName: 'Find By',
      description: 'What the value below is: Product ID (a number such as 1672932878) or SKU (the store code such as TSHIRT-RED-M).',
      required: true,
      defaultValue: 'id',
      options: {
        options: [
          { label: 'Product ID', value: 'id' },
          { label: 'SKU', value: 'sku' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Product ID or SKU',
      description: 'The numeric product ID, for example 1672932878, or the exact SKU, for example TSHIRT-RED-M, matching Find By.',
      placeholder: '1672932878',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaProducts.getProduct({
      auth,
      by: propsValue.find_by === 'sku' ? 'sku' : 'id',
      value: propsValue.value,
    });
  },
});
