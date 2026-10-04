import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { customerOutputSchema } from '../output-schemas';
export const stripeUpdateCustomer = createAction({
  name: 'update_customer',
  classification: 'WRITE',
  auth: stripeAuth,
  displayName: 'Update Customer',
  description: "Change a customer's details. Empty fields keep their value.",
  audience: 'human',
  aiMetadata: {
    description:
      'Updates fields on an existing Stripe customer (email, name, description, phone, address); only the fields you provide are changed. Use to correct or enrich a customer record identified by its customer ID. Idempotent in effect: repeating the same update yields the same final state.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'contact',
      display: 'section',
      label: 'Customer',
      icon: 'user',
      props: ['customer', 'name', 'email', 'phone', 'description'],
    },
    {
      key: 'address',
      display: 'section',
      label: 'Address',
      icon: 'location',
      props: ['line1', 'postal_code', 'city', 'state', 'country'],
    },
  ],
  props: {
    customer: {
      ...stripeCommon.customer,
      description: 'Only the fields you fill in below are changed.',
    },

    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      width: 'half',
      placeholder: 'jane@example.com',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
      width: 'half',
      placeholder: 'Jane Doe',
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Internal note, not shown to the customer.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
      placeholder: '+1 555 123 4567',
    }),

    line1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
      placeholder: '123 Main St',
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      required: false,
      width: 'half',
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
      width: 'half',
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
      width: 'half',
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter country code, e.g. US or GB.',
      required: false,
      width: 'half',
      placeholder: 'US',
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

    if (Object.keys(address).length > 0) {
      body.address = address;
    }

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
      body: stripeCommon.toFormBody(body),
    });

    return response.body;
  },
});
