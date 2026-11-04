import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetRoleOutputSchema } from '../../../output-schemas';

export const patchRoleAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_patch_role',
  outputSchema: mattermostGetRoleOutputSchema,
  displayName: 'Update Role Permissions',
  description: 'Replaces the permissions a role grants.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces a role\'s whole permission list with the one given, so read it first with Get Role or Get Role By Name and send the full list. Without an Enterprise license the server only lets a few permissions be added or removed (such as bot, slash command, webhook and channel mention permissions) and rejects the rest. Needs a system admin connection.',
    idempotent: true,
  },
  props: {
    roleId: Property.ShortText({
      displayName: 'Role ID',
      description: 'Role ID (26 characters). Use List Roles or Get Role By Name to find it.',
      required: true,
    }),
    permissions: Property.Array({
      displayName: 'Permissions',
      description: 'Full list of permission names the role should grant, e.g. ["create_post", "manage_slash_commands"]. Permissions left out are removed.',
      required: true,
    }),
  },
  async run(context) {
    const { roleId, permissions } = context.propsValue;
    if (permissions.length === 0) {
      throw new Error('Permissions must list at least one permission; an empty list would remove every permission from the role.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/roles/${encodeURIComponent(roleId)}/patch`,
      body: { permissions },
    });
  },
});
