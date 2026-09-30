import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, DirectoryGroup, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const getGroup = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'get_group',
  classification: 'READ',
  displayName: 'Get Group',
  description: 'Gets the details of a group.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one Google Workspace group by email, alias or ID. Use Search Groups when you only know part of the name. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    group: googleAdminProps.group({ required: true }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<DirectoryGroup>({
      auth,
      method: HttpMethod.GET,
      url: `${DIRECTORY_URL}/groups/${encodeURIComponent(propsValue.group)}`,
    });
  },
});
