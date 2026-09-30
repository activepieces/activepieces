import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const deleteUser = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'delete_user',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete User',
  description: 'Deletes a user account. It can be restored from the Admin console for 20 days.',
  audience: 'both',
  aiMetadata: {
    description:
      'Delete a Google Workspace user account and its data (restorable from the Admin console for 20 days). Prefer Suspend User to only block access. A retry after success fails because the user no longer exists.',
    idempotent: false,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.DELETE,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}`,
    });
    return { success: true, user: propsValue.user };
  },
});
