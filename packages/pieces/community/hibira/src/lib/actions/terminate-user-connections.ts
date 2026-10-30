import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient } from '../common/client';

export const terminateUserConnections = createAction({
  auth: hibiraAuth,
  name: 'terminate_user_connections',
  displayName: 'Disconnect User',
  description: 'Closes every connection of a signed-in user, for example after a ban or a password change.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Close all open Hibira connections of one user ID (users signed in through user authentication). Their clients may reconnect unless your auth endpoint refuses them.',
    idempotent: true,
  },
  props: {
    userId: Property.ShortText({ displayName: 'User ID', required: true }),
  },
  async run({ auth, propsValue }) {
    await hibiraClient.channels(auth, {
      method: 'POST',
      path: `/users/${encodeURIComponent(propsValue.userId)}/terminate_connections`,
      body: {},
    });
    return { userId: propsValue.userId, success: true };
  },
});
