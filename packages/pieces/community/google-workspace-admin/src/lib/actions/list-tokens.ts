import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';
import { OAuthToken, securityHelpers } from '../common/security';

export const listTokens = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'list_tokens',
  classification: 'SEARCH',
  displayName: 'List Connected App Tokens',
  description: 'Lists the third-party apps a user has granted access to their account.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the OAuth tokens (third-party apps and their scopes) a Google Workspace user has authorized. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await googleAdminClient.request<{ items?: OAuthToken[] }>({
      auth,
      method: HttpMethod.GET,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/tokens`,
    });
    return (response.items ?? []).map(securityHelpers.flattenToken);
  },
});
