import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
export const searchCustomerAddressAction = createAction({
  auth: bigcommerceAuth,
  name: 'search_customer_address',
  displayName: 'Search Customer Address',
  description: 'Searches for customer addresses',
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'ID of the customer',
      required: true,
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth,
      `/v3/customers/addresses?customer_id:in=${context.propsValue.customer_id}`,
      HttpMethod.GET
    );
    return response.body;
  },
});