import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetRoleOutputSchema } from '../../../output-schemas';

export const getRoleByNameAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_role_by_name',
  outputSchema: mattermostGetRoleOutputSchema,
  displayName: 'Get Role By Name',
  description: 'Gets a role and its permissions by name.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one role with its permissions by its name, e.g. "system_user", "team_admin" or "channel_user". Use Get Roles By Names for several at once.',
    idempotent: true,
  },
  props: {
    roleName: Property.ShortText({
      displayName: 'Role Name',
      description: 'Role name, e.g. "system_user", "team_admin" or "channel_user".',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/roles/name/${encodeURIComponent(context.propsValue.roleName)}`,
    });
  },
});
