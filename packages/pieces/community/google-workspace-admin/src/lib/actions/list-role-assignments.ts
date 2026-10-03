import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, RoleAssignment } from '../common/client';
import { googleAdminProps } from '../common/props';

export const listRoleAssignments = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'list_role_assignments',
  classification: 'SEARCH',
  displayName: 'List Role Assignments',
  description: 'Lists admin role assignments, optionally for one user or one role.',
  audience: 'both',
  aiMetadata: {
    description:
      'List Google Workspace admin role assignments, filtered by user or by role (Google does not allow both filters at once). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: false, description: 'Only return assignments for this user.' }),
    role: googleAdminProps.role({
      required: false,
      description: 'Only return assignments of this role. Cannot be combined with User.',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.user && propsValue.role) {
      throw new Error('Filter by either User or Admin Role, not both.');
    }
    return googleAdminClient.listAll<{ nextPageToken?: string; items?: RoleAssignment[] }, RoleAssignment>({
      auth,
      url: `${DIRECTORY_URL}/customer/my_customer/roleassignments`,
      getItems: (r) => r.items,
      queryParams: { userKey: propsValue.user, roleId: propsValue.role },
    });
  },
});
