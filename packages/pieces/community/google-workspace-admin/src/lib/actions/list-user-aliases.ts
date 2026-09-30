import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const listUserAliases = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'list_user_aliases',
  classification: 'SEARCH',
  displayName: 'List User Aliases',
  description: 'Lists all email aliases of a user.',
  audience: 'both',
  aiMetadata: {
    description: 'List every email alias on a Google Workspace user. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await googleAdminClient.request<{ aliases?: { id: string; primaryEmail: string; alias: string }[] }>({
      auth,
      method: HttpMethod.GET,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/aliases`,
    });
    return (response.aliases ?? []).map((a) => ({ user_id: a.id, primary_email: a.primaryEmail, alias: a.alias }));
  },
});
