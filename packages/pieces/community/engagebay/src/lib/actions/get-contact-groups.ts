import { createAction } from '@activepieces/pieces-framework';
import { engagebayAuth } from '../auth';
import { engagebayRequest } from '../common/client';

export const getContactGroupsAction = createAction({
  auth: engagebayAuth,
  name: 'get_contact_groups',
  displayName: 'Get Contact Groups',
  description: 'Get a list of contact groups from EngageBay.',
  props: {},
  async run(context) {
    return await engagebayRequest({
      apiKey: context.auth,
      path: '/api/core/groups',
    });
  },
});
