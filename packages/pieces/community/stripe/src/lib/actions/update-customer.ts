import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import Stripe from 'stripe';
import { customerIdDropdown } from '../common';

export const updateCustomer = createAction({
  auth: stripeAuth,
  name: 'updateCustomer',
  displayName: 'Update Customer',
  description: 'Update a Stripe customer by ID.',
  props: {
    customerId: customerIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.ShortText({
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
    metadata: Property.Object({
      displayName: 'Metadata',
      required: false,
      description: 'Key-value pairs to attach to the customer.',
    }),
  },
  async run({ auth, propsValue }) {
    const {
      customerId,
      email,
      name,
      description,
      phone,
      line1,
      postal_code,
      city,
      state,
      country,
      metadata,
    } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.stripe.com/v1/customers/${customerId}`,
      headers: {
        Authorization: 'Bearer ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        email,
        name,
        description,
        phone,
        address: {
          line1,
          postal_code,
          city,
          state,
          country,
        },
        metadata: metadata as unknown as Stripe.MetadataParam,
      },
    });
    return response.body;
  },
});
