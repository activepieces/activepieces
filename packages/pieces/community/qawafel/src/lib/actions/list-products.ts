import { createAction, Property } from '@activepieces/pieces-framework';
import { qawafelAuth } from '../common/auth';
import { qawafelPaginatedList } from '../common/client';

export const listProducts = createAction({
  auth: qawafelAuth,
  name: 'list_products',
  displayName: 'List Products',
  description:
    'Get products from your catalog, with optional filters by type, supplier, SKU, and active status. Returns up to 500 products (5 pages of 100).',
  props: {
    type: Property.StaticDropdown<'sale' | 'purchase'>({
      displayName: 'Product Type (filter)',
      description:
        'Optional. `Sale` returns products you sell. `Purchase` returns products you buy from suppliers. Leave blank to return both.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Sale', value: 'sale' },
          { label: 'Purchase', value: 'purchase' },
        ],
      },
    }),
    sku: Property.ShortText({
      displayName: 'SKU (filter)',
      description:
        'Optional. Return only the product with this exact SKU (case-sensitive).',
      required: false,
    }),
    supplier_id: Property.ShortText({
      displayName: 'Supplier ID (filter)',
      description:
        'Optional. Only applies when filtering Purchase products. Pass a merchant ID (starts with `mer_`).',
      required: false,
    }),
    is_active: Property.Checkbox({
      displayName: 'Active only',
      description:
        'Tick to return only active products, untick for inactive only. Leave blank to return both.',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created after',
      description:
        'Optional. Return only products created after this date and time.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams=new URLSearchParams();

    if (propsValue.type) {
      queryParams.append('type', propsValue.type);
    }
    if (propsValue.sku) {
      queryParams.append('sku', propsValue.sku);
    }
    if (propsValue.supplier_id) {
      queryParams.append('supplier_id', propsValue.supplier_id);
    }
    if (propsValue.is_active !== undefined) {
      queryParams.append('is_active', propsValue.is_active.toString());
    }
    if (propsValue.created_after) {
      queryParams.append('created_after', propsValue.created_after);
    }

    const data = await qawafelPaginatedList({
      auth,
      path: `/products?${queryParams.toString()}`,
    });
    return { count: data.length, data };
  },
});
