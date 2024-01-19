import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const stripeCreateCustomer = createAction({
  name: 'create_customer',
  auth: stripeAuth,
  displayName: 'Create Customer',
  description: 'Create a customer in stripe',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: undefined,
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
        Authorization: 'Bearer ' + context.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        email: customer.email,
        name: customer.name,
        description: customer.description,
        phone: customer.phone,
        address: customer.address,
      },
    });
    return response.body;
  },
});
