import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const getCustomer = createAction({
  auth: sageworksAuth,
  name: 'customer_get',
  displayName: 'Customer - Get',
  description: 'Retrieve a customer by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
      description: 'The ID of the customer to retrieve',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/customers/${id}`,
      HttpMethod.GET
    );
  },
});
