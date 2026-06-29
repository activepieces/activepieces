import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const stripeCreateCustomerAi = createAction({
  name: 'create_customer_ai',
  auth: stripeAuth,
  displayName: 'Create Customer (Agent)',
  description: 'Create a customer in Stripe.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Stripe customer from an email and name, with optional phone and address. Use when onboarding a new payer before charging, invoicing, or subscribing them; to avoid duplicates, look the customer up first with Search Customers. Not idempotent: each call creates a distinct customer even with identical input.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
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
  async run(context) {
    const { email, name, description, phone, line1, postal_code, city, state, country } =
      context.propsValue;

    const body: { [key: string]: unknown } = {
      email,
      name,
    };
    if (description) body.description = description;
    if (phone) body.phone = phone;

    const address: { [key: string]: string } = {};
    if (line1) address.line1 = line1;
    if (postal_code) address.postal_code = postal_code;
    if (city) address.city = city;
    if (state) address.state = state;
    if (country) address.country = country;
    Object.keys(address).forEach((key) => {
      body[`address[${key}]`] = address[key];
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.stripe.com/v1/customers',
      headers: {
        Authorization: 'Bearer ' + context.auth.secret_text,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    return response.body;
  },
});
