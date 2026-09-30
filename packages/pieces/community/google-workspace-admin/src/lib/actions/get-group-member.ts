import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, GroupMember } from '../common/client';
import { googleAdminProps } from '../common/props';

export const getGroupMember = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'get_group_member',
  classification: 'READ',
  displayName: 'Get Group Member',
  description: "Gets a member's role and status in a group.",
  audience: 'both',
  aiMetadata: {
    description:
      "Fetch one member's role, type and status in a Google Workspace group. Fails with 404 if they are not a direct member. Read-only and safe to retry.",
    idempotent: true,
  },
  props: {
    group: googleAdminProps.group({ required: true }),
    member: googleAdminProps.member({ required: true }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<GroupMember>({
      auth,
      method: HttpMethod.GET,
      url: `${DIRECTORY_URL}/groups/${encodeURIComponent(propsValue.group)}/members/${encodeURIComponent(propsValue.member)}`,
    });
  },
});
