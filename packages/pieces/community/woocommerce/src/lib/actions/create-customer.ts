import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { createCustomerOutputSchema } from '../output-schemas';

export const wooCreateCustomer = createAction({
  name: 'Create Customer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Create a customer account in your store',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new customer account in a WooCommerce store with email, name, username, password, and a billing/shipping address (the same address is applied to both). Use when an agent needs to register a shopper. Not idempotent: each call creates a new customer, and email and username must be unique in the store.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: createCustomerOutputSchema,
  propertyGroups: [
    {
      key: 'customer',
      display: 'section',
      label: 'Customer',
      icon: 'user',
      props: ['email', 'first_name', 'last_name'],
    },
    {
      key: 'login',
      display: 'section',
      label: 'Sign-in',
      icon: 'sliders',
      props: ['login_info', 'username', 'password'],
    },
    {
      key: 'address',
      display: 'section',
      label: 'Address',
      icon: 'location',
      props: [
        'address_info',
        'street_address',
        'city',
        'state',
        'postcode',
        'country',
        'phone',
      ],
    },
  ],
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Used to sign in and for order emails.',
      placeholder: 'jane@example.com',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      placeholder: 'Jane',
      width: 'half',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      placeholder: 'Doe',
      width: 'half',
      required: false,
    }),
    login_info: Property.MarkDown({
      value:
        'Leave both empty to let WooCommerce create them, if your store allows it.',
      variant: MarkdownVariant.INFO,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      width: 'half',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      width: 'half',
      required: false,
    }),
    address_info: Property.MarkDown({
      value:
        'This address and phone are saved as both billing and shipping details.',
      variant: MarkdownVariant.INFO,
    }),
    street_address: Property.ShortText({
      displayName: 'Street Address',
      placeholder: '1 Main Street',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      width: 'half',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State or county code.',
      placeholder: 'CA',
      width: 'half',
      required: false,
    }),
    postcode: Property.ShortText({
      displayName: 'Postcode',
      width: 'half',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter country code, e.g. GB',
      placeholder: 'GB',
      width: 'half',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      placeholder: '+1 555 123 4567',
      required: false,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');

    const {
      email,
      first_name,
      last_name,
      username,
      password,
      street_address,
      city,
      state,
      postcode,
      country,
      phone,
    } = configValue.propsValue;

    const billing = {
      ...(isFilled(first_name) ? { first_name } : {}),
      ...(isFilled(last_name) ? { last_name } : {}),
      ...(isFilled(street_address) ? { address_1: street_address } : {}),
      ...(isFilled(city) ? { city } : {}),
      ...(isFilled(state) ? { state } : {}),
      ...(isFilled(postcode) ? { postcode } : {}),
      ...(isFilled(country) ? { country } : {}),
      email,
      ...(isFilled(phone) ? { phone } : {}),
    };

    const request: HttpRequest = {
      url: `${trimmedBaseUrl}/wp-json/wc/v3/customers`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
      body: {
        email,
        ...(isFilled(first_name) ? { first_name } : {}),
        ...(isFilled(last_name) ? { last_name } : {}),
        ...(isFilled(username) ? { username } : {}),
        ...(isFilled(password) ? { password } : {}),
        billing,
        shipping: billing,
      },
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});

function isFilled(value: string | null | undefined): value is string {
  return value !== undefined && value !== null && value.trim() !== '';
}
