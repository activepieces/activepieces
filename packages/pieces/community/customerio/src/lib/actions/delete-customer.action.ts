import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { customerioAuth } from '../../..';

export const deleteCustomer = createAction({
  name: 'delete_customer',
  auth: customerioAuth,
  displayName: 'Delete Customer',
  description: 'Remove a customer from Customer.io',
  props: {
    customer_id: Property.ShortText({ displayName: 'Customer ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const credentials = Buffer.from(`${auth.site_id}:${auth.api_key}`).toString('base64');
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://track.customer.io/api/v1/customers/${encodeURIComponent(propsValue.customer_id)}`,
      headers: { Authorization: `Basic ${credentials}` },
    });
    return { success: true, customer_id: propsValue.customer_id };
  },
});
