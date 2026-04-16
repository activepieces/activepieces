import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';

export const listSolutionCategories = createAction({
  auth: freshserviceAuth,
  name: 'list_solution_categories',
  displayName: 'List Solution Categories',
  description: 'Lists all solution categories in Freshservice.',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (default: 1).',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Number of categories per page (default: 30, max: 100).',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (props.page) queryParams['page'] = String(props.page);
    if (props.per_page) queryParams['per_page'] = String(props.per_page);

    const response = await freshserviceApiCall<{ categories: Record<string, unknown>[] }>({
      method: HttpMethod.GET,
      endpoint: 'solutions/categories',
      auth: context.auth,
      queryParams,
    });

    return response.body.categories;
  },
});
