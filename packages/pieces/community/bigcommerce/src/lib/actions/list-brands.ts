import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { pagingProps } from '../common/props';
import { bigCommerceApiService } from '../common/requests';
import { brandListOutputSchema } from '../common/schemas';
import { validatePaging } from '../common/shared-runs';

export const listBrands = createAction({
  auth: bigcommerceAuth,
  name: 'listBrands',
  classification: 'SEARCH',
  displayName: 'List Brands',
  description: 'Lists catalog brands, optionally filtered by name',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists product brands in a BigCommerce catalog, optionally filtered by exact brand name. Use to find a brand_id for creating, updating or searching products. Returns { data, meta.pagination }; limit (1-250, default 50) and page (from 1) control paging. Read-only.',
    idempotent: true,
  },
  outputSchema: brandListOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Brand Name',
      description: 'Filter by exact brand name',
      required: false,
    }),
    ...pagingProps,
  },
  async run(context) {
    const { name, limit, page } = context.propsValue;
    const paging = validatePaging({ limit, page });
    return await bigCommerceApiService.fetchBrands({
      auth: context.auth.props,
      query: { name, ...paging },
    });
  },
});
