import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const listCategories = createAction({
  auth: bigcommerceAuth,
  name: 'listCategories',
  displayName: 'List Categories',
  description: 'Lists all categories',
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
