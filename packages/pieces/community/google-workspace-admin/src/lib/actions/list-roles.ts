import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { AdminRole, DIRECTORY_URL, googleAdminClient } from '../common/client';

export const listRoles = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'list_roles',
  classification: 'SEARCH',
  displayName: 'List Admin Roles',
  description: 'Lists all admin roles in your organization.',
  audience: 'both',
  aiMetadata: {
    description:
      'List every Google Workspace admin role (system and custom) with its ID, e.g. to find the role ID for Assign Admin Role. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const roles = await googleAdminClient.listAll<{ nextPageToken?: string; items?: AdminRole[] }, AdminRole>({
      auth,
      url: `${DIRECTORY_URL}/customer/my_customer/roles`,
      getItems: (r) => r.items,
    });
    return roles.map((r) => ({
      role_id: r.roleId,
      role_name: r.roleName,
      role_description: r.roleDescription ?? null,
      is_system_role: r.isSystemRole ?? false,
      is_super_admin_role: r.isSuperAdminRole ?? false,
    }));
  },
});
