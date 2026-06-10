import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall } from '../common';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { HttpStatusCode } from 'axios';

export const githubFindUserAction = createAction({
  auth: githubAuth,
  name: 'find_user',
  displayName: 'Find User',
  description: 'Finds a user by their login name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a GitHub user by their login (username) and reports whether they exist along with their public profile. Use to verify a username or fetch a user profile; an unknown username is reported as not-found rather than raising an error. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The GitHub username (login) to look up.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { username } = propsValue;

    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/users/${username}`,
      });

      return {
        found: true,
        result: response.body,
      };
    } catch (e) {
      const status = (e as HttpError).response.status;
      if (status === HttpStatusCode.NotFound) {
        return {
          found: false,
          result: {},
        };
      }
      throw e;
    }
  },
});
