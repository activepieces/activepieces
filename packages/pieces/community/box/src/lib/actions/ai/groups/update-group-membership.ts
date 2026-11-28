import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetGroupMembershipOutputSchema } from '../../../output-schemas';

const ROLES = ['member', 'admin'];
const CLEARABLE = ['configurable_permissions'];

export const updateGroupMembershipAction = createAction({
  auth: boxAuth,
  name: 'box_update_group_membership',
  outputSchema: boxGetGroupMembershipOutputSchema,
  displayName: 'Update Group Membership',
  description: 'Changes a user\'s role or admin permissions in a Box group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a membership\'s role (member or admin) or a group admin\'s permissions; only the fields given change. Get the ID from List Group Memberships or List User Memberships.',
    idempotent: true,
  },
  props: {
    groupMembershipId: boxAiProps.groupMembershipId({ required: true }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: '"member" or "admin".',
      required: false,
      options: { options: ROLES.map((value) => ({ label: value, value })) },
    }),
    configurablePermissions: Property.Json({
      displayName: 'Configurable Permissions',
      description: 'Admin-only permissions as true/false, e.g. {"can_run_reports": true, "can_instant_login": false}. They replace the current ones; omitted ones are enabled.',
      required: false,
    }),
    clearFields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: '"configurable_permissions" to disable all configurable admin permissions. Do not also give Configurable Permissions.',
      required: false,
      options: { options: CLEARABLE.map((value) => ({ label: value, value })) },
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.role !== undefined && !ROLES.includes(propsValue.role)) {
      throw new Error(`Role must be one of: ${ROLES.join(', ')}.`);
    }
    const clear = propsValue.clearFields ?? [];
    if (clear.some((field) => !CLEARABLE.includes(field))) {
      throw new Error(`Clear Fields must be from: ${CLEARABLE.join(', ')}.`);
    }
    if (clear.includes('configurable_permissions') && propsValue.configurablePermissions !== undefined) {
      throw new Error('Give either Configurable Permissions or "configurable_permissions" in Clear Fields, not both.');
    }
    const body = {
      ...(propsValue.role !== undefined ? { role: propsValue.role } : {}),
      ...(propsValue.configurablePermissions !== undefined ? { configurable_permissions: propsValue.configurablePermissions } : {}),
      ...(clear.includes('configurable_permissions') ? { configurable_permissions: null } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/group_memberships/${encodeURIComponent(propsValue.groupMembershipId)}`,
      query: { fields: propsValue.fields },
      body,
    });
  },
});
