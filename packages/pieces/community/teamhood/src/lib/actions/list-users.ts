import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  teamhoodApiCall,
  TeamhoodAuth,
  teamhoodAuth,
  TeamhoodUser,
} from '../common';

export const listUsersAction = createAction({
  auth: teamhoodAuth,
  name: 'list_users',
  displayName: 'List Users',
  description: 'List all users in your Teamhood account.',
  props: {},
  async run(context) {
    const response = await teamhoodApiCall<{ users: TeamhoodUser[] }>({
      auth: context.auth.props as TeamhoodAuth,
      method: HttpMethod.GET,
      path: '/users',
    });
    return response.body.users ?? [];
  },
});
