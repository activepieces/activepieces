import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';
import { AppPassword, securityHelpers } from '../common/security';

export const listAppPasswords = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'list_app_passwords',
  classification: 'SEARCH',
  displayName: 'List App Passwords',
  description: 'Lists the app-specific passwords a user has created.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the app-specific passwords (ASPs) a Google Workspace user has issued for legacy apps. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await googleAdminClient.request<{ items?: AppPassword[] }>({
      auth,
      method: HttpMethod.GET,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/asps`,
    });
    return (response.items ?? []).map(securityHelpers.flattenAppPassword);
  },
});
