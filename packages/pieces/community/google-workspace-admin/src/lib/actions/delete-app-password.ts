import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const deleteAppPassword = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'delete_app_password',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete App Password',
  description: 'Revokes an app-specific password so it can no longer be used to sign in.',
  audience: 'both',
  aiMetadata: {
    description:
      'Revoke one app-specific password; apps using it lose access immediately. A retry after success fails because it no longer exists.',
    idempotent: false,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    codeId: googleAdminProps.appPassword({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.DELETE,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/asps/${propsValue.codeId}`,
    });
    return { success: true, user: propsValue.user, code_id: propsValue.codeId };
  },
});
