import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { updateCustomerOutputSchema } from '../output-schemas';

export const wooUpdateCustomer = createAction({
  name: 'Update Customer',
  classification: 'WRITE',
  displayName: 'Update Customer',
  description: 'Update a customer name, email or billing details',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing WooCommerce customer by ID. Can change the email, first and last name, and billing phone, city, postcode and country. Only the fields provided are changed. Idempotent: sending the same values twice leaves the customer in the same state.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateCustomerOutputSchema,
  props: {
    id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Enter the customer ID',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Billing Phone',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'Billing City',
      required: false,
    }),
    postcode: Property.ShortText({
      displayName: 'Billing Postcode',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Billing Country',
      description: 'Two-letter country code, e.g. GB',
      required: false,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const { id, email, first_name, last_name, phone, city, postcode, country } =
      configValue.propsValue;

    const billing: Record<string, string> = {};
    if (phone) {
      billing['phone'] = phone;
    }
    if (city) {
      billing['city'] = city;
    }
    if (postcode) {
      billing['postcode'] = postcode;
    }
    if (country) {
      billing['country'] = country;
    }

    const body: Record<string, unknown> = {};
    if (email) {
      body['email'] = email;
    }
    if (first_name) {
      body['first_name'] = first_name;
    }
    if (last_name) {
      body['last_name'] = last_name;
    }
    if (Object.keys(billing).length > 0) {
      body['billing'] = billing;
    }

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/customers/${id}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
      body,
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});
