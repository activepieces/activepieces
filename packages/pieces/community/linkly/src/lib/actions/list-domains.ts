import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import { linklyApiCall, LinklyDomain } from '../common/client';
import { workspaceDropdown } from '../common/props';

export const listDomains = createAction({
  auth: linklyAuth,
  name: 'list_domains',
  displayName: 'List Domains',
  description: 'List the branded domains available for short links in a workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the custom (branded) domains configured in a Linkly workspace. Use the returned name as the domain when creating a link. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: workspaceDropdown,
  },
  async run({ auth, propsValue }) {
    return linklyApiCall<LinklyDomain[]>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/workspace/${propsValue.workspace_id}/domains`,
    });
  },
});
