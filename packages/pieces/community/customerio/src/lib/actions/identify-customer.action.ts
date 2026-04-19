import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { customerioAuth } from '../../..';

export const identifyCustomer = createAction({
  name: 'identify_customer',
  auth: customerioAuth,
  displayName: 'Identify Customer',
  description: 'Create or update a customer profile in Customer.io',
  props: {
    customer_id: Property.ShortText({ displayName: 'Customer ID', description: 'Unique identifier for this customer', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    attributes: Property.Json({ displayName: 'Attributes', description: 'Additional customer attributes as JSON', required: false }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.email) body['email'] = propsValue.email;
    if (propsValue.attributes) Object.assign(body, propsValue.attributes);

    const credentials = Buffer.from(`${auth.site_id}:${auth.api_key}`).toString('base64');
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://track.customer.io/api/v1/customers/${encodeURIComponent(propsValue.customer_id)}`,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
});
