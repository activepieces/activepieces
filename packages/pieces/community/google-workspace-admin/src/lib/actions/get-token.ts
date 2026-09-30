import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';
import { OAuthToken, securityHelpers } from '../common/security';

export const getToken = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'get_token',
  classification: 'READ',
  displayName: 'Get Connected App Token',
  description: 'Gets the access a third-party app has to a user account.',
  audience: 'both',
  aiMetadata: {
    description:
      "Fetch the scopes one third-party app has been granted on a user's account. Read-only and safe to retry.",
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    clientId: googleAdminProps.token({ required: true }),
  },
  async run({ auth, propsValue }) {
    const token = await googleAdminClient.request<OAuthToken>({
      auth,
      method: HttpMethod.GET,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/tokens/${encodeURIComponent(propsValue.clientId)}`,
    });
    return securityHelpers.flattenToken(token);
  },
});
