import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { productSummaryKeys, sallaOutputSchemas } from '../../common/output-schemas';
import { PRODUCT_STATUSES, ProductStatus, sallaProducts } from '../../common/products';

export const aiListProductsAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_products',
  classification: 'SEARCH',
  displayName: 'List Products',
  description: 'Lists store products that match the given filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Salla products matching an optional keyword, status and category, returning each product summary with its id, SKU, price, stock and status. Use it to find the product_id or SKU that Get Product, Update Product, Adjust Stock and Add Product Image need; call Get Product for one product\'s variants (skus), options and images. Returns at most max_results products (cap 200) and truncated=true when more exist.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.productList,
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Free-text search over product name and SKU, for example T-Shirt or TSHIRT-RED-M. Leave empty for all products.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only products with this status: sale (on sale), out (out of stock) or hidden. Leave empty for all statuses.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'On Sale', value: 'sale' },
          { label: 'Out of Stock', value: 'out' },
          { label: 'Hidden', value: 'hidden' },
        ],
      },
    }),
    category_id: Property.Number({
      displayName: 'Category ID',
      description: 'Numeric category ID from List Categories, for example 1340423950. Returns only products in that category.',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of products to return, from 1 to 200, for example 20. Default 20.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ auth, propsValue }) {
    const result = await sallaProducts.listProducts({
      auth,
      filters: {
        maxResults: clampMaxResults(propsValue.max_results),
        keyword: propsValue.keyword,
        status: toStatus(propsValue.status),
        categoryId: propsValue.category_id ?? undefined,
      },
    });
    return { ...result, products: result.products.map(toSummary) };
  },
});

function toSummary(product: Record<string, unknown>): Record<string, unknown> {
  const summary: Record<string, unknown> = {};
  for (const key of productSummaryKeys) {
    if (key in product) {
      summary[key] = product[key];
    }
  }
  return summary;
}

function clampMaxResults(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_CAP);
}

function toStatus(value: unknown): ProductStatus | undefined {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }
  const match = PRODUCT_STATUSES.find((status) => status === value);
  if (!match) {
    throw new Error(`status must be sale, out or hidden. Got "${String(value)}".`);
  }
  return match;
}

const DEFAULT_MAX_RESULTS = 20;
const MAX_RESULTS_CAP = 200;
