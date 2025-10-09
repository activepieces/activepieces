import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth } from '../../index';
import { oktaApiCall, OktaAuthValue } from '../common';
import { HttpMethod, HttpError } from '@activepieces/pieces-common';

export const oktaFindUserByEmailAction = createAction({
  auth: oktaAuth,
  name: 'okta_find_user_by_email',
  displayName: 'Find User by Email',
  description: 'Look up an Okta user by their email address',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'User email address to search for',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const authValue = auth as OktaAuthValue;
    const { email } = propsValue;

    try {
      const response = await oktaApiCall({
        auth: authValue,
        method: HttpMethod.GET,
        resourceUri: '/api/v1/users',
        query: {
          search: `profile.email eq "${email}"`,
        },
      });

      const users = response.body as any[];
      
      if (users.length === 0) {
        return {
          found: false,
          user: null,
        };
      }

      return {
        found: true,
        user: users[0],
      };
    } catch (error) {
      if ((error as HttpError).response?.status === 404) {
        return {
          found: false,
          user: null,
        };
      }
      throw error;
    }
  },
});

