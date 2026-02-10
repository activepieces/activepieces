import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest, userIdDropdown } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';



export const updateUserAction = createAction({
  auth: oktaAuth,
  name: 'update_user',
  displayName: 'Update User',
  description: 'Update user profile information',
  props: {
    userId: userIdDropdown(),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Updated first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Updated last name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Updated email address',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      description: 'Updated mobile phone number',
      required: false,
    }),
    customAttributes: Property.Json({
      displayName: 'Custom Attributes',
      description: 'JSON object with custom profile attributes',
      required: false,
    }),
  },
  async run(context) {
    const userId = context.propsValue.userId;
    const userData: any = {
      profile: {},
    };

    if (context.propsValue.firstName) {
      userData.profile.firstName = context.propsValue.firstName;
    }
    if (context.propsValue.lastName) {
      userData.profile.lastName = context.propsValue.lastName;
    }
    if (context.propsValue.email) {
      userData.profile.email = context.propsValue.email;
    }
    if (context.propsValue.mobilePhone) {
      userData.profile.mobilePhone = context.propsValue.mobilePhone;
    }
    if (context.propsValue.customAttributes) {
      userData.profile = { ...userData.profile, ...context.propsValue.customAttributes };
    }

    const response = await makeOktaRequest(
      context.auth,
      `/users/${userId}`,
      HttpMethod.POST,
      userData
    );

    return response.body;
  },
});