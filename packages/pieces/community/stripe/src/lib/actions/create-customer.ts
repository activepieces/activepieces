import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { customerOutputSchema } from '../output-schemas';
export const stripeCreateCustomer = createAction({
  name: 'create_customer',
  classification: 'WRITE',
  auth: stripeAuth,
  displayName: 'Create Customer',
  description: 'Create a customer with contact details and an address.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new customer record in Stripe from an email and name, with optional contact and address fields. Use when onboarding a new payer before charging, invoicing, or subscribing them. Not idempotent: each call creates a distinct customer even with identical input.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'contact',
      display: 'section',
      label: 'Contact',
      icon: 'user',
      props: ['name', 'email', 'phone', 'description'],
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
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      width: 'half',
      placeholder: 'jane@example.com',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
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
    const customer = {
      email: context.propsValue.email,
      name: context.propsValue.name,
      description: context.propsValue.description,
      phone: context.propsValue.phone,
      address: {
        line1: context.propsValue.line1,
        postal_code: context.propsValue.postal_code,
        city: context.propsValue.city,
        state: context.propsValue.state,
        country: context.propsValue.country,
      },
    };
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.stripe.com/v1/customers',
      headers: {
        Authorization: 'Bearer ' + context.auth.secret_text,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeCommon.toFormBody({
        email: customer.email,
        name: customer.name,
        description: customer.description,
        phone: customer.phone,
        address: customer.address,
      }),
    });
    return response.body;
  },
});
