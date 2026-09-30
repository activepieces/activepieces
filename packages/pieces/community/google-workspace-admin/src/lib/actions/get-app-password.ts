import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';
import { AppPassword, securityHelpers } from '../common/security';

export const getAppPassword = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'get_app_password',
  classification: 'READ',
  displayName: 'Get App Password',
  description: 'Gets the details of one app-specific password.',
  audience: 'both',
  aiMetadata: {
    description:
      "Fetch one app-specific password's name, creation and last-used time. The password itself is never returned. Read-only and safe to retry.",
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    codeId: googleAdminProps.appPassword({ required: true }),
  },
  async run({ auth, propsValue }) {
    const asp = await googleAdminClient.request<AppPassword>({
      auth,
      method: HttpMethod.GET,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/asps/${propsValue.codeId}`,
    });
    return securityHelpers.flattenAppPassword(asp);
  },
});
