import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetRolesByNamesOutputSchema } from '../../../output-schemas';

export const getRolesByNamesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_roles_by_names',
  outputSchema: mattermostGetRolesByNamesOutputSchema,
  displayName: 'Get Roles By Names',
  description: 'Gets several roles and their permissions by name.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the roles matching the given names with their permissions; names that match no role are left out. Use List Roles to see every role.',
    idempotent: true,
  },
  props: {
    roleNames: Property.Array({
      displayName: 'Role Names',
      description: 'Role names, e.g. ["system_user", "team_admin"].',
      required: true,
    }),
  },
  async run(context) {
    const roles = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/roles/names',
      body: context.propsValue.roleNames,
    });
    return { roles, count: roles.length };
  },
});
