import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { pagingProps } from '../common/props';
import { bigCommerceApiService } from '../common/requests';
import { categoryListOutputSchema } from '../common/schemas';
import { validatePaging } from '../common/shared-runs';

export const listCategories = createAction({
  auth: bigcommerceAuth,
  name: 'listCategories',
  classification: 'SEARCH',
  displayName: 'List Categories',
  description:
    'Lists product categories. Uses the BigCommerce categories endpoint, which is deprecated in favour of category trees but still supported.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists product categories from a BigCommerce store, optionally filtered by exact name. Returns { data, meta.pagination }; limit (1-250, default 50) and page (from 1) control paging, and meta.pagination.total_pages tells you whether more pages exist. Use to find category ids before assigning products. Read-only.',
    idempotent: true,
  },
  outputSchema: categoryListOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Category Name',
      description: 'Filter by category name',
      required: false,
    }),
    ...pagingProps,
  },
  async run(context) {
    const { name, limit, page } = context.propsValue;
    const paging = validatePaging({ limit, page });
    return await bigCommerceApiService.fetchCategories({
      auth: context.auth.props,
      query: { name, ...paging },
    });
  },
});
