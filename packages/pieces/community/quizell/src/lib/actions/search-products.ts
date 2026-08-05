import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quizellAuth } from '../../';
import { quizellApiCall } from '../common/client';

type ProductRecord = Record<string, unknown>;

export const searchProducts = createAction({
  auth: quizellAuth,
  name: 'search_products',
  displayName: 'Search Products',
  description: 'Searches for products in your Quizell catalog by title or SKU.',
  audience: 'both',
  aiMetadata: { description: 'Searches the Quizell product catalog with paginated results; leaving title and SKU empty returns all products, while supplying either filters the catalog, and an optional active/inactive status filter narrows further. Use to browse the catalog or resolve a product by title/SKU when you lack its ID. Read-only and idempotent.', idempotent: true },
  props: {
    title: Property.ShortText({
      displayName: 'Product Title',
      description: 'Search by product name. Leave empty to return all products.',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Search by product SKU (stock keeping unit). Leave empty to skip this filter.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by product status.',
      required: false,
      defaultValue: '',
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Active', value: '1' },
          { label: 'Inactive', value: '0' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for results. Starts at 1.',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'How many products to return per page.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { title, sku, status, page, per_page } = context.propsValue;

    const queryParams: Record<string, string> = {
      page: String(page ?? 1),
      per_page: String(per_page ?? 25),
    };
    if (title) queryParams['title'] = title;
    if (sku) queryParams['sku'] = sku;
    if (status) queryParams['status'] = status;

    const response = await quizellApiCall<{
      status: boolean;
      message: string;
      data: {
        data: ProductRecord[];
        current_page: number;
        per_page: number;
        total: number;
      };
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/products/search',
      queryParams,
    });

    const pagination = response.body.data;
    const products = pagination.data ?? [];

    return {
      total: pagination.total ?? null,
      current_page: pagination.current_page ?? null,
      per_page: pagination.per_page ?? null,
      products: products.map((p) => ({
        id: p['id'] ?? null,
        title: p['title'] ?? null,
        sku: p['sku'] ?? null,
        price: p['price'] ?? null,
        compare_at_price: p['compare_at_price'] ?? null,
        status: p['status'] === 1 ? 'active' : 'inactive',
        description: p['description'] ?? null,
        image: p['image'] ?? null,
        vendor: p['vendor'] ?? null,
        quantity: p['quantity'] ?? null,
        tags: Array.isArray(p['tags']) ? (p['tags'] as string[]).join(', ') : (p['tags'] ?? null),
        detail_link: p['detail_link'] ?? null,
        external_id: p['external_id'] ?? null,
        created_at: p['created_at'] ?? null,
        updated_at: p['updated_at'] ?? null,
      })),
    };
  },
});
