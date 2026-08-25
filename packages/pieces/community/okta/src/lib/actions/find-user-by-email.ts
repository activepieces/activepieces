import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const findUserByEmailAction = createAction({
  auth: oktaAuth,
  name: 'find_user_by_email',
  displayName: 'Find User by Email',
  description: 'Look up an Okta user by their email address',
  audience: 'both',
  aiMetadata: { description: 'Searches Okta for a user by exact email address and returns the first match. Use as a read-only lookup to resolve an email to an Okta user (e.g. to obtain a user ID before a lifecycle or group action). Idempotent — returns a not-found indicator when no user matches.', idempotent: true },
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