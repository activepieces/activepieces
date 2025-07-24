import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { browseAiAuth } from '../common/auth';

export const listRobots = createAction({
 auth: browseAiAuth,
 name: 'listRobots',
  displayName: 'List Robots',
  description: '',
  props: {},
  async run({ auth }) {
    // Action logic here
    const robots = await makeRequest(auth as string, HttpMethod.GET, '/robots');
    return robots
  },
});
