import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetRoleOutputSchema } from '../../../output-schemas';

export const getRoleAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_role',
  outputSchema: mattermostGetRoleOutputSchema,
  displayName: 'Get Role',
  description: 'Gets a role and its permissions by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one role with its permissions by role ID. Use Get Role By Name when only the name (e.g. "system_user") is known.',
    idempotent: true,
  },
  props: {
    roleId: Property.ShortText({
      displayName: 'Role ID',
      description: 'Role ID (26 characters). Use List Roles or Get Role By Name to find it.',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/roles/${encodeURIComponent(context.propsValue.roleId)}`,
    });
  },
});
