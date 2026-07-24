import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubGetUserAction = createAction({
  auth: githubAuth,
  name: 'get_user',
  displayName: 'Get User (Agent)',
  description: "Fetches a user's public profile by login.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Fetches a user's public profile (GET /users/{username}) — name, bio, public repo/follower counts, type (User or Organization). Resolve logins via Search Users. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The user or organization login.',
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
      return response.body;
    } catch (error: any) {
      throw githubError(error, `User "${username}"`);
    }
  },
});
