import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const removeGroupMember = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'remove_group_member',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Group Member',
  description: 'Removes a member from a group.',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove a member from a Google Workspace group. A retry after success fails because they are no longer a member.',
    idempotent: false,
  },
  props: {
    group: googleAdminProps.group({ required: true }),
    member: googleAdminProps.member({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.DELETE,
      url: `${DIRECTORY_URL}/groups/${encodeURIComponent(propsValue.group)}/members/${encodeURIComponent(propsValue.member)}`,
    });
    return { success: true, group: propsValue.group, member: propsValue.member };
  },
});
