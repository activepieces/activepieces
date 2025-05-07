import { medullarAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { medullarCommon, getUser } from '../common';

export const listSpaces = createAction({
  auth: medullarAuth,
  name: 'listSpaces',
  displayName: 'List Spaces',
  description: 'List all user Spaces',
  props: {},
  async run(context) {
    const userData = await getUser(context.auth);

    const spaceListResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${medullarCommon.exploratorUrl}/spaces/?user=${userData.uuid}&limit=1000&offset=0`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
    });

    return spaceListResponse.body.results;
  },
});
