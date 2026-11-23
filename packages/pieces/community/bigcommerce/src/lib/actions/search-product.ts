import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { pagingProps } from '../common/props';
import { bigCommerceApiService } from '../common/requests';
import { productListOutputSchema } from '../common/schemas';
import { validatePaging } from '../common/shared-runs';

export const searchProduct = createAction({
  auth: bigcommerceAuth,
  name: 'searchProduct',
  classification: 'SEARCH',
  displayName: 'Search Product',
  description: 'Searches for a product in the catalog',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches the BigCommerce product catalog by exact name, SKU, type (physical or digital), brand id, weight and/or price. A value of 0 for weight or price is a real filter. With no filters it returns all products. Returns { data, meta.pagination }; limit (1-250, default 50) and page (from 1) control paging. Use to find a product id or check whether one exists before creating it. Read-only.',
    idempotent: true,
  },
  outputSchema: productListOutputSchema,
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
      description: 'Brand ID to search for. Use List Brands to find it.',
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
    ...pagingProps,
  },
  async run(context) {
    const { name, sku, type, brand_id, weight, price, limit, page } = context.propsValue;
    const paging = validatePaging({ limit, page });
    return await bigCommerceApiService.fetchProducts({
      auth: context.auth.props,
      query: { name, sku, brand_id, type, price, weight, ...paging },
    });
  },
});
