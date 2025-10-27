import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const createUserAction = createAction({
  auth: oktaAuth,
  name: 'create_user',
  displayName: 'Create User',
  description: 'Creates a user without credentials and sends account creation prompt via email',
  props: {
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
    email: Property.ShortText({
      displayName: 'Email',
      description: 'User email address',
      required: true,
    }),
    login: Property.ShortText({
      displayName: 'Login',
      description: 'User login (typically same as email)',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      description: 'User mobile phone number',
      required: false,
    }),
    sendEmail: Property.Checkbox({
      displayName: 'Send Email',
      description: 'Send account creation email to user',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const userData = {
      profile: {
        firstName: context.propsValue.firstName,
        lastName: context.propsValue.lastName,
        email: context.propsValue.email,
        login: context.propsValue.login || context.propsValue.email,
      },
    };

    const queryParam = context.propsValue.sendEmail ? '?activate=true' : '';

    const response = await makeOktaRequest(
      context.auth,
      `/users${queryParam}`,
      HttpMethod.POST,
      userData
    );

    return response.body;
  },
});