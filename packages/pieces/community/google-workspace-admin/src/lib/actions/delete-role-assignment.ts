import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const deleteRoleAssignment = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'delete_role_assignment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Role Assignment',
  description: 'Removes an admin role from a user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove one admin role assignment from a user. A retry after success fails because the assignment no longer exists.',
    idempotent: false,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    roleAssignment: googleAdminProps.roleAssignment({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.DELETE,
      url: `${DIRECTORY_URL}/customer/my_customer/roleassignments/${encodeURIComponent(propsValue.roleAssignment)}`,
    });
    return { success: true, role_assignment_id: propsValue.roleAssignment };
  },
});
