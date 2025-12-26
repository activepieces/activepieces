import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteCustomer = createAction({
  auth: sageworksAuth,
  name: 'customer_delete',
  displayName: 'Customer - Delete',
  description: 'Delete a customer by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
      description: 'The ID of the customer to delete',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/customers/${id}`,
      HttpMethod.DELETE
    );
  },
});
