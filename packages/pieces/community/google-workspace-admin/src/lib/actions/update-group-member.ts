import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, GroupMember } from '../common/client';
import { googleAdminProps } from '../common/props';
import { memberProps } from '../common/member-props';

export const updateGroupMember = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'update_group_member',
  classification: 'WRITE',
  displayName: 'Update Group Member',
  description: "Changes a group member's role or email delivery setting.",
  audience: 'both',
  aiMetadata: {
    description:
      "Change an existing group member's role (Owner / Manager / Member) or delivery setting. Safe to retry.",
    idempotent: true,
  },
  props: {
    group: googleAdminProps.group({ required: true }),
    member: googleAdminProps.member({ required: true }),
    role: memberProps.role(false),
    deliverySettings: memberProps.deliverySettings,
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<GroupMember>({
      auth,
      method: HttpMethod.PATCH,
      url: `${DIRECTORY_URL}/groups/${encodeURIComponent(propsValue.group)}/members/${encodeURIComponent(propsValue.member)}`,
      body: googleAdminClient.compact({
        role: propsValue.role,
        delivery_settings: propsValue.deliverySettings,
      }),
    });
  },
});
