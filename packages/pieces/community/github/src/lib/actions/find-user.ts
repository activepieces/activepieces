import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findUser = createAction({
  auth: githubAuth,
  name: 'findUser',
  displayName: 'Find User',
  description: '',
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The username of the user to find',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/users/${propsValue.username}`,
    });

    return response.body;
  },
});
