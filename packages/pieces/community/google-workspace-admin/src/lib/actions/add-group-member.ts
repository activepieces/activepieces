import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, GroupMember } from '../common/client';
import { googleAdminProps } from '../common/props';
import { memberProps } from '../common/member-props';

export const addGroupMember = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'add_group_member',
  classification: 'WRITE',
  displayName: 'Add Group Member',
  description: 'Adds a user, group or external email to a group.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add a member (user, nested group or external email) to a Google Workspace group with a role. Use Update Group Member to change the role of an existing member. A retry fails with "Member already exists".',
    idempotent: false,
  },
  props: {
    group: googleAdminProps.group({ required: true }),
    email: Property.ShortText({
      displayName: 'Member Email',
      description: 'Email of the user, group or external address to add, e.g. jane@yourcompany.com.',
      required: true,
    }),
    role: memberProps.role(true),
    deliverySettings: memberProps.deliverySettings,
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<GroupMember>({
      auth,
      method: HttpMethod.POST,
      url: `${DIRECTORY_URL}/groups/${encodeURIComponent(propsValue.group)}/members`,
      body: googleAdminClient.compact({
        email: propsValue.email,
        role: propsValue.role,
        delivery_settings: propsValue.deliverySettings,
      }),
    });
  },
});
