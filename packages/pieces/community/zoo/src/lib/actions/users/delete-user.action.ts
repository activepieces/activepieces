import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteUserAction = createAction({
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Delete your user account',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete the authenticated Zoo user account. Destructive and irreversible; the first call removes the account and subsequent calls have no further effect. Use only when intentionally closing the current account.', idempotent: false },
  auth: zooAuth,
  // category: 'Users',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: 'https://api.zoo.dev/user',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
