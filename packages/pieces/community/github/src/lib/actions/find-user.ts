import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubFindUser = createAction({
  auth: githubAuth,
  name: 'findUser',
  displayName: 'Find User',
  description: 'Get information about a GitHub user by their username',
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The GitHub username to search for (e.g., octocat, torvalds)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const username = propsValue.username;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/users/${encodeURIComponent(username)}`,
    });

    return response;
  },
});
