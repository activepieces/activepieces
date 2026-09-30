import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const revokeUserAdmin = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'revoke_user_admin',
  classification: 'DESTRUCTIVE',
  displayName: 'Revoke User Super Admin',
  description: 'Removes the super admin role from a user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove the Google Workspace super admin role from a user. Other admin role assignments are kept; remove those with Delete Role Assignment. Safe to retry.',
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.POST,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/makeAdmin`,
      body: { status: false },
    });
    return { success: true, user: propsValue.user, is_admin: false };
  },
});
