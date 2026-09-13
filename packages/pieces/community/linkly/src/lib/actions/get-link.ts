import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import { linklyApiCall } from '../common/client';
import { linkDropdown, workspaceDropdown } from '../common/props';

export const getLink = createAction({
  auth: linklyAuth,
  name: 'get_link',
  displayName: 'Get Link',
  description: 'Fetch a link with its settings and lifetime click count.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one Linkly link by ID, returning its settings (destination, slug, domain, UTM tags, rules) plus click statistics. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: workspaceDropdown,
    id: linkDropdown,
  },
  async run({ auth, propsValue }) {
    return linklyApiCall({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/get_link/${propsValue.id}`,
    });
  },
});
