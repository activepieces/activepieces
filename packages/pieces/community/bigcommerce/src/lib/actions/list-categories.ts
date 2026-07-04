import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const listCategories = createAction({
  auth: bigcommerceAuth,
  name: 'listCategories',
  displayName: 'List Categories',
  description: 'Lists all categories',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists product categories from a BigCommerce store. With no name filter it returns all categories; provide a name to filter to matching categories. Use to discover category names or ids before assigning products. Idempotent read-only query with no side effects.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Category Name',
      description: 'Filter by category name',
      required: false,
    }),
  },
  async run(context) {
    const qParams = new URLSearchParams();
    if (context.propsValue.name) qParams.append('name', context.propsValue.name);
    return await bigCommerceApiService.fetchCategories({
      auth: context.auth.props,
      queryString: qParams.toString(),
    });
  },
});
