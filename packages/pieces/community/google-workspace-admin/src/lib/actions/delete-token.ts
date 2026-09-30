import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const deleteToken = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'delete_token',
  classification: 'DESTRUCTIVE',
  displayName: 'Revoke Connected App Token',
  description: "Revokes a third-party app's access to a user account.",
  audience: 'both',
  aiMetadata: {
    description:
      "Revoke a third-party app's OAuth access to a user's account; the app must be re-authorized to regain access. A retry after success fails because the token no longer exists.",
    idempotent: false,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    clientId: googleAdminProps.token({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.DELETE,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/tokens/${encodeURIComponent(propsValue.clientId)}`,
    });
    return { success: true, user: propsValue.user, client_id: propsValue.clientId };
  },
});
