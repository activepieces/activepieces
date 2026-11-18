import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { ProductStatus, sallaProducts } from '../common/products';
import { sallaProps } from '../common/props';
import { productStatusOptions } from './create-product';

export const findProductsAction = createAction({
  auth: sallaAuth,
  name: 'find_products',
  classification: 'SEARCH',
  displayName: 'Find Products',
  description: 'Searches the store products; with no filters it returns all products.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches Salla products by keyword, status or category and returns the matching products with price and stock. Use it to find product IDs before Get Product, Update Product or Adjust Stock. Read-only and safe to retry; Max Results caps the list (1 to 1000).',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.productList,
  propertyGroups: [
    {
      key: 'keyword',
      display: 'builder',
      label: 'Keyword',
      icon: 'text',
      props: ['keyword'],
    },
    {
      key: 'status',
      display: 'builder',
      label: 'Status',
      icon: 'tag',
      props: ['status'],
    },
    {
      key: 'category',
      display: 'builder',
      label: 'Category',
      icon: 'filter',
      props: ['category'],
    },
    {
      key: 'footer',
      display: 'footer',
      icon: 'sliders',
      props: ['max_results'],
    },
  ],
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Matches the product name or SKU, for example "t-shirt" or TSHIRT-RED-M.',
      placeholder: 't-shirt',
      icon: 'text',
      required: false,
    }),
    status: Property.StaticDropdown<ProductStatus, false>({
      displayName: 'Status',
      description: 'Only products with this status: On Sale (sale), Out of Stock (out) or Hidden (hidden).',
      icon: 'tag',
      required: false,
      options: { options: productStatusOptions() },
    }),
    category: {
      ...sallaProps.category({
        required: false,
        description: 'Only products in this category, for example Clothes > Shirts. In a flow, map a numeric category ID such as 1937598462.',
      }),
      icon: 'filter',
    },
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Stop after this many products, from 1 to 1000. Default 50.',
      display: 'stepper',
      min: 1,
      max: 1000,
      step: 1,
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaProducts.listProducts({
      auth,
      filters: {
        maxResults: clampMaxResults(propsValue.max_results),
        keyword: propsValue.keyword ?? undefined,
        status: propsValue.status ?? undefined,
        categoryId: propsValue.category ?? undefined,
      },
    });
  },
});

function clampMaxResults(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_LIMIT);
}

const DEFAULT_MAX_RESULTS = 50;
const MAX_RESULTS_LIMIT = 1000;
