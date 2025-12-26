import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const listCustomers = createAction({
  auth: sageworksAuth,
  name: 'customer_list',
  displayName: 'Customer - List',
  description: 'Retrieve a list of customers',
  props: {
    page: Property.Number({
      displayName: 'Page',
      required: false,
      description: 'Page number for pagination (starts at 1)',
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      required: false,
      description: 'Number of items per page',
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { page, perPage } = propsValue;

    const queryParams: Record<string, any> = {};
    if (page) queryParams['page'] = page;
    if (perPage) queryParams['perPage'] = perPage;

    return await makeSageworksRequest(
      sageworksAuth,
      '/v1/customers',
      HttpMethod.GET,
      undefined,
      queryParams
    );
  },
});
