import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateCustomerAction = createAction({
  name: 'update_customer',
  auth: checkoutComAuth,
  displayName: 'Update Customer',
  description: 'Update existing customer or their metadata.',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      required: false,
    }),
  },
  async run(context) {
    const { customerId, email, name, phone, metadata } = context.propsValue;
    const body: Record<string, any> = {};
    if (email) body.email = email;
    if (name) body.name = name;
    if (phone) body.phone = phone;
    if (metadata) body.metadata = metadata;
    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `https://api.checkout.com/customers/${customerId}`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
}); 