import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createCustomerAction = createAction({
  name: 'create_customer',
  auth: checkoutComAuth,
  displayName: 'Create Customer',
  description: 'Store new vault customer with email/name/phone/metadata.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
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
    const { email, name, phone, metadata } = context.propsValue;
    const body: Record<string, any> = { email };
    if (name) body.name = name;
    if (phone) body.phone = phone;
    if (metadata) body.metadata = metadata;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.checkout.com/customers',
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
}); 