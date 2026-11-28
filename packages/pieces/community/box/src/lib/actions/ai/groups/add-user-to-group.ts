import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxAddUserToGroupOutputSchema } from '../../../output-schemas';

const ROLES = ['member', 'admin'];

export const addUserToGroupAction = createAction({
  auth: boxAuth,
  name: 'box_add_user_to_group',
  outputSchema: boxAddUserToGroupOutputSchema,
  displayName: 'Add User To Group',
  description: 'Adds a Box user to a group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a user to a group as a member or group admin and returns the membership ID. Fails with 409 if the user is already in the group. Get the user ID from List Users and the group ID from List Groups or Create Group.',
    idempotent: false,
  },
  props: {
    userId: boxAiProps.userId({ required: true }),
    groupId: boxAiProps.groupId({ required: true }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: '"member" (default) or "admin".',
      required: false,
      options: { options: ROLES.map((value) => ({ label: value, value })) },
    }),
    configurablePermissions: Property.Json({
      displayName: 'Configurable Permissions',
      description: 'Admin-only permissions as true/false, e.g. {"can_run_reports": true, "can_instant_login": false}. Omitted ones are enabled. Ignored for members.',
      required: false,
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.role !== undefined && !ROLES.includes(propsValue.role)) {
      throw new Error(`Role must be one of: ${ROLES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/group_memberships',
      query: { fields: propsValue.fields },
      body: {
        user: { id: propsValue.userId },
        group: { id: propsValue.groupId },
        ...(propsValue.role !== undefined ? { role: propsValue.role } : {}),
        ...(propsValue.configurablePermissions !== undefined ? { configurable_permissions: propsValue.configurablePermissions } : {}),
      },
    });
  },
});
