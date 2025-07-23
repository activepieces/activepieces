import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browseAiApiCall } from '../common/client';
import { browseAiAuth } from '../common/auth';

export const listRobotsAction = createAction({
  name: 'list-robots',
  auth: browseAiAuth,
  displayName: 'List Robots',
  description: 'Retrieve all robots available in your account, including their IDs and names.',
  props: {},
  async run({ auth }) {
    const { apiKey } = auth as unknown as { apiKey: string };

    const response = await browseAiApiCall({
      auth: { apiKey },
      method: HttpMethod.GET,
      resourceUri: '/robots',
    });

    return response;
  },
});
