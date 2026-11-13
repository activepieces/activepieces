import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { wooPathId } from '../common/path-id';
import { updateCustomerOutputSchema } from '../output-schemas';

export const wooUpdateCustomer = createAction({
  name: 'Update Customer',
  classification: 'WRITE',
  displayName: 'Update Customer',
  description: 'Update a customer name, email or billing details',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates an existing WooCommerce customer by ID. Can change the email, first and last name, and billing phone, city, postcode and country. Only the fields provided are changed. Idempotent: sending the same values twice leaves the customer in the same state.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateCustomerOutputSchema,
  propertyGroups: [
    {
      key: 'customer',
      display: 'section',
      label: 'Customer to Update',
      icon: 'user',
      props: ['id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: [
        'changes_info',
        'email',
        'first_name',
        'last_name',
        'city',
        'postcode',
        'country',
        'phone',
      ],
    },
  ],
  props: {
    id: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'Find it in WooCommerce under Customers, or from Find Customer.',
      placeholder: '123',
      required: true,
    }),
    changes_info: Property.MarkDown({
      value: 'Empty fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Changes the email the customer signs in with.',
      placeholder: 'jane@example.com',
      required: false,
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
    city: Property.ShortText({
      displayName: 'Billing City',
      width: 'half',
      required: false,
    }),
    postcode: Property.ShortText({
      displayName: 'Billing Postcode',
      width: 'half',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Billing Country',
      description: 'Two-letter country code, e.g. GB',
      placeholder: 'GB',
      width: 'half',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Billing Phone',
      width: 'half',
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
      url: `${trimmedBaseUrl}/wp-json/wc/v3/customers/${wooPathId.encode({ id, label: 'Customer ID' })}`,
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
