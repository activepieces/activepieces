import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth } from '../../index';
import { oktaApiCall, OktaAuthValue } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const oktaCreateUserAction = createAction({
  auth: oktaAuth,
  name: 'okta_create_user',
  displayName: 'Create User',
  description: 'Creates a user without credentials and sends them account creation prompt via email',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'User email address',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'User first name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'User last name',
      required: true,
    }),
    login: Property.ShortText({
      displayName: 'Login',
      description: 'User login (usually the email)',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      description: 'User mobile phone number (optional)',
      required: false,
    }),
    activate: Property.Checkbox({
      displayName: 'Activate User',
      description: 'If true, sends activation email to user',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const authValue = auth as OktaAuthValue;
    const { email, firstName, lastName, login, mobilePhone, activate } = propsValue;

    const profile: any = {
      firstName,
      lastName,
      email,
      login: login || email,
    };

    if (mobilePhone) {
      profile.mobilePhone = mobilePhone;
    }

    const response = await oktaApiCall({
      auth: authValue,
      method: HttpMethod.POST,
      resourceUri: '/api/v1/users',
      query: {
        activate: activate ? 'true' : 'false',
      },
      body: {
        profile,
      },
    });

    return response.body;
  },
});

