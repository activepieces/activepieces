import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, DirectoryUser, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const suspendUser = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'suspend_user',
  classification: 'DESTRUCTIVE',
  displayName: 'Suspend User',
  description: 'Blocks a user from signing in without deleting their data.',
  audience: 'both',
  aiMetadata: {
    description:
      'Suspend a Google Workspace user so they can no longer sign in; data is kept. Use Unsuspend User to restore access, or Delete User to remove the account. Safe to retry.',
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
  },
  async run({ auth, propsValue }) {
    const user = await googleAdminClient.request<DirectoryUser>({
      auth,
      method: HttpMethod.PATCH,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}`,
      body: { suspended: true },
    });
    return googleAdminClient.flattenUser(user);
  },
});
