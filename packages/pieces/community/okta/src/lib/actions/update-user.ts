import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth } from '../../index';
import { oktaApiCall, OktaAuthValue, oktaCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const oktaUpdateUserAction = createAction({
  auth: oktaAuth,
  name: 'okta_update_user',
  displayName: 'Update User',
  description: 'Updates user profile information',
  props: {
    userId: oktaCommon.userDropdown,
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'User first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'User last name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'User email address',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      description: 'User mobile phone number',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authValue = auth as OktaAuthValue;
    const { userId, firstName, lastName, email, mobilePhone } = propsValue;

    const profile: any = {};
    
    if (firstName) profile.firstName = firstName;
    if (lastName) profile.lastName = lastName;
    if (email) profile.email = email;
    if (mobilePhone) profile.mobilePhone = mobilePhone;

    const response = await oktaApiCall({
      auth: authValue,
      method: HttpMethod.POST,
      resourceUri: `/api/v1/users/${userId}`,
      body: {
        profile,
      },
    });

    return response.body;
  },
});

