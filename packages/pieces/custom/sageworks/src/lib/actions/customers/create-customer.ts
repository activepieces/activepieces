import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCustomer = createAction({
  auth: sageworksAuth,
  name: 'customer_create',
  displayName: 'Customer - Create',
  description: 'Create a new customer',
  props: {
    data: Property.Json({
      displayName: 'Customer Data',
      required: true,
      description: 'Customer information as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      '/v1/customers',
      HttpMethod.POST,
      data
    );
  },
});
