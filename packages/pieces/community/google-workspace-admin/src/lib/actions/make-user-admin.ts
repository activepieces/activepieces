import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const makeUserAdmin = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'make_user_admin',
  classification: 'WRITE',
  displayName: 'Make User Super Admin',
  description: 'Grants the super admin role to a user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Grant the Google Workspace super admin role to a user. For narrower privileges use Assign Admin Role instead. Safe to retry.',
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
      body: { status: true },
    });
    return { success: true, user: propsValue.user, is_admin: true };
  },
});
