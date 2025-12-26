import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateCustomer = createAction({
  auth: sageworksAuth,
  name: 'customer_update',
  displayName: 'Customer - Update',
  description: 'Update an existing customer',
  props: {
    id: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
      description: 'The ID of the customer to update',
    }),
    data: Property.Json({
      displayName: 'Customer Data',
      required: true,
      description: 'Customer information to update as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id, data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/customers/${id}`,
      HttpMethod.PATCH,
      data
    );
  },
});
