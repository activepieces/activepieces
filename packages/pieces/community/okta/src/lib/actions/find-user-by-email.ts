import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const findUserByEmailAction = createAction({
  auth: oktaAuth,
  name: 'find_user_by_email',
  displayName: 'Find User by Email',
  description: 'Look up an Okta user by their email address',
  props: {
    domain: Property.ShortText({
      displayName: 'Okta Domain',
      description: 'Your Okta organization domain',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The user email address',
      required: true,
    }),
  },
  async run(context) {
    const email = context.propsValue.email;

    const response = await makeOktaRequest(
      context.auth,
      `/users?search=profile.email eq "${email}"`,
      HttpMethod.GET,
      context.propsValue.domain
    );

    if (response.body && response.body.length > 0) {
      return response.body[0];
    }

    return {
      success: false,
      message: `No user found with email: ${email}`,
      data: [],
    };
  },
});