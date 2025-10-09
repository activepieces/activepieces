import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oktaAuth } from '../../index';

export const updateUser = createAction({
  auth: oktaAuth,
  name: 'update_user',
  displayName: 'Update User',
  description: 'Updates a user profile in Okta',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'An ID, login, or login shortname of an existing Okta user',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      required: false,
    }),
    secondEmail: Property.ShortText({
      displayName: 'Secondary Email',
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
    zipCode: Property.ShortText({
      displayName: 'Zip Code',
      required: false,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha 2 country code',
      required: false,
    }),
  },
  async run(context) {
    const { domain, apiToken } = context.auth;
    const { userId, firstName, lastName, email, mobilePhone, secondEmail, city, state, zipCode, countryCode } = context.propsValue;

    const profile: any = {};

    if (firstName) profile.firstName = firstName;
    if (lastName) profile.lastName = lastName;
    if (email) profile.email = email;
    if (mobilePhone) profile.mobilePhone = mobilePhone;
    if (secondEmail) profile.secondEmail = secondEmail;
    if (city) profile.city = city;
    if (state) profile.state = state;
    if (zipCode) profile.zipCode = zipCode;
    if (countryCode) profile.countryCode = countryCode;

    const url = `https://${domain}/api/v1/users/${userId}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SSWS ${apiToken}`,
      },
      body: { profile },
    });

    return response.body;
  },
});
