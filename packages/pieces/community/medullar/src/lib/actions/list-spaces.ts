import { medullarAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listSpaces = createAction({
  auth: medullarAuth,
  name: 'listSpaces',
  displayName: 'List Spaces',
  description: 'List all user Spaces',
  props: {},
  async run(context) {
    const userResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.medullar.com/auth/v1/users/me/',
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
    });

    const userData = userResponse.body;

    if (!userData) {
      throw new Error('User data not found.');
    }

    if (!userData.company) {
      throw new Error('User does not belong to any company.');
    }

    const spaceListResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.medullar.com/explorator/v1/spaces/?user=${userData.uuid}&limit=1000&offset=0`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
    });

    return spaceListResponse.body.results;
  },
});
