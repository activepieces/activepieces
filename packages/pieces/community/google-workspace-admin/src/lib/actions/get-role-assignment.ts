import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, RoleAssignment } from '../common/client';
import { googleAdminProps } from '../common/props';

export const getRoleAssignment = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'get_role_assignment',
  classification: 'READ',
  displayName: 'Get Role Assignment',
  description: 'Gets the details of an admin role assignment.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetch one admin role assignment by ID. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    roleAssignment: googleAdminProps.roleAssignment({ required: true }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<RoleAssignment>({
      auth,
      method: HttpMethod.GET,
      url: `${DIRECTORY_URL}/customer/my_customer/roleassignments/${encodeURIComponent(propsValue.roleAssignment)}`,
    });
  },
});
