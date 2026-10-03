import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, GroupMember } from '../common/client';
import { googleAdminProps } from '../common/props';

export const listGroupMembers = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'list_group_members',
  classification: 'SEARCH',
  displayName: 'List Group Members',
  description: 'Lists the members of a group.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the members of a Google Workspace group, optionally filtered by role and including members of nested groups. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    group: googleAdminProps.group({ required: true }),
    roles: Property.StaticMultiSelectDropdown({
      displayName: 'Roles',
      description: 'Only return members with these roles. Leave empty for all.',
      required: false,
      options: {
        options: [
          { label: 'Owner', value: 'OWNER' },
          { label: 'Manager', value: 'MANAGER' },
          { label: 'Member', value: 'MEMBER' },
        ],
      },
    }),
    includeDerivedMembership: Property.Checkbox({
      displayName: 'Include Members of Nested Groups',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({ displayName: 'Max Results', required: false, defaultValue: 200 }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.listAll<{ nextPageToken?: string; members?: GroupMember[] }, GroupMember>({
      auth,
      url: `${DIRECTORY_URL}/groups/${encodeURIComponent(propsValue.group)}/members`,
      getItems: (r) => r.members,
      queryParams: {
        roles: propsValue.roles?.length ? propsValue.roles.join(',') : undefined,
        includeDerivedMembership: propsValue.includeDerivedMembership ? true : undefined,
      },
      limit: propsValue.limit ?? 200,
    });
  },
});
