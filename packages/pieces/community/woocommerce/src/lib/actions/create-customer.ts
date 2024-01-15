import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

import { wooAuth } from '../..';

export const wooCreateCustomer = createAction({
  name: 'Create Customer',
  displayName: 'Create Customer',
  description: 'Create a Customer',
  auth: wooAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Enter the email',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First name',
      description: 'Enter the first name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last name',
      description: 'Enter the last name',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Enter the username',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Enter the password',
      required: true,
    }),
    street_address: Property.ShortText({
      displayName: 'Address',
      description: 'Enter the street address',
      required: true,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'Enter the city',
      required: true,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'Enter the state',
      required: true,
    }),
    postcode: Property.ShortText({
      displayName: 'Postcode',
      description: 'Enter the postcode',
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Enter the country',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Enter the phone',
      required: true,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.baseUrl.replace(/\/$/, '');

    const email = configValue.propsValue['email'];
    const first_name = configValue.propsValue['first_name'];
    const last_name = configValue.propsValue['last_name'];
    const username = configValue.propsValue['username'];
    const password = configValue.propsValue['password'];

    const billing = {
      first_name,
      last_name,
      address_1: configValue.propsValue['street_address'],
      city: configValue.propsValue['city'],
      state: configValue.propsValue['state'],
      postcode: configValue.propsValue['postcode'],
      country: configValue.propsValue['country'],
      email,
      phone: configValue.propsValue['phone'],
    };

    const request: HttpRequest = {
      url: `${trimmedBaseUrl}//wp-json/wc/v3/customers`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.consumerKey,
        password: configValue.auth.consumerSecret,
      },
      body: {
        email,
        first_name,
        last_name,
        username,
        password,
        billing,
        shipping: billing,
      },
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});
