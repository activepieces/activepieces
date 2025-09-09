import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubFindUserAction = createAction({
  
  auth: githubAuth,
  name: 'find_user',
  displayName: 'Find User',
  description: 'Lookup a user by their login name.',
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The GitHub username (login) to look up.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { username } = propsValue;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/users/${username}`,
    });

    return response.body;
  },
});