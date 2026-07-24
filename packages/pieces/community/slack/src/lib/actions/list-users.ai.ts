import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { listUsers } from './list-users';

export const slackListUsers = createAction({
  auth: slackAuth,
  name: 'list_users',
  displayName: 'List Users',
  description: 'List all users in the workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Enumerates every member of the workspace, paging through all results, with toggles to include bots and disabled/deactivated users. Pick this to scan or enumerate users; use Get User, Find User by Email, or Find User by Handle when you already know the single user you want. Read-only and idempotent.',
    idempotent: true,
  },
  props: listUsers.props,
  run: listUsers.run,
});
