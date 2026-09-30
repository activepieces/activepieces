import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, DirectoryUser, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const unsuspendUser = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'unsuspend_user',
  classification: 'WRITE',
  displayName: 'Unsuspend User',
  description: 'Restores sign-in access for a suspended user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Unsuspend a previously suspended Google Workspace user so they can sign in again. Safe to retry.',
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
      body: { suspended: false },
    });
    return googleAdminClient.flattenUser(user);
  },
});
