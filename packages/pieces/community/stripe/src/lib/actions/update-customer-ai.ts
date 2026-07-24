import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

import { customerOutputSchema } from '../output-schemas';
export const stripeUpdateCustomerAi = createAction({
  name: 'update_customer_ai',
  auth: stripeAuth,
  displayName: 'Update Customer (Agent)',
  description: 'Modify an existing Stripe customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates fields on an existing Stripe customer (email, name, description, phone, address); only the fields you supply change. Use to correct or enrich a customer record identified by its customer ID. Idempotent: repeating the same update yields the same final state.',
    idempotent: true,
  },
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The Stripe customer ID (e.g., cus_...) to update. Obtain it from Search Customers or List Customers.',
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
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    line1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
  },
  outputSchema: customerOutputSchema,
  async run(context) {
    const { customer, ...propsValue } = context.propsValue;

    const body: { [key: string]: unknown } = {};

    if (propsValue.name) body.name = propsValue.name;
    if (propsValue.email) body.email = propsValue.email;
    if (propsValue.description) body.description = propsValue.description;
    if (propsValue.phone) body.phone = propsValue.phone;

    const address: { [key: string]: string } = {};
    if (propsValue.line1) address.line1 = propsValue.line1;
    if (propsValue.city) address.city = propsValue.city;
    if (propsValue.state) address.state = propsValue.state;
    if (propsValue.postal_code) address.postal_code = propsValue.postal_code;
    if (propsValue.country) address.country = propsValue.country;

    Object.keys(address).forEach((key) => {
      body[`address[${key}]`] = address[key];
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.stripe.com/v1/customers/${customer}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    return response.body;
  },
});
