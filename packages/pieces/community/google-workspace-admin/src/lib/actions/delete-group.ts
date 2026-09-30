import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const deleteGroup = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'delete_group',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Group',
  description: 'Permanently deletes a group.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete a Google Workspace group, its membership and its archive. Cannot be undone; a retry after success fails because the group no longer exists.',
    idempotent: false,
  },
  props: {
    group: googleAdminProps.group({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.DELETE,
      url: `${DIRECTORY_URL}/groups/${encodeURIComponent(propsValue.group)}`,
    });
    return { success: true, group: propsValue.group };
  },
});
