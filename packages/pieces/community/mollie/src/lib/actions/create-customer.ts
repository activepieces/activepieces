import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { localeDropdown } from '../common/props';

export const createCustomer = createAction({
  auth: MollieAuth,
  name: 'createCustomer',
  displayName: 'Create Customer',
  description:
    'Create a new customer in Mollie for subscription billing and recurring payments',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Customer full name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
      required: false, // Changed from true to false
    }),
    locale: localeDropdown,
    metadata: Property.Object({
      displayName: 'Metadata',
      description:
        'Custom metadata object for storing additional customer information',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const customerData: any = {};

    // Add optional fields if provided
    if (propsValue.name) {
      customerData.name = propsValue.name;
    }
    if (propsValue.email) {
      customerData.email = propsValue.email;
    }
    if (propsValue.locale) {
      customerData.locale = propsValue.locale;
    }
    if (propsValue.metadata) {
      customerData.metadata = propsValue.metadata;
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/customers',
      customerData
    );

    return response;
  },
});
