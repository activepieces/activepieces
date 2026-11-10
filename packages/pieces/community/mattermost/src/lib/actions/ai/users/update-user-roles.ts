import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const updateUserRolesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_user_roles',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Update User Roles',
  description: 'Sets a user\'s system roles.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces a user\'s system roles: "system_user" for a regular member or "system_user system_admin" to make them a system admin. Needs a connection allowed to manage roles. Team and channel roles are not changed.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    roles: Property.StaticDropdown({
      displayName: 'Roles',
      description: '"system_user" for a regular member, "system_user system_admin" for a system admin.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Member', value: 'system_user' },
          { label: 'System Admin', value: 'system_user system_admin' },
        ],
      },
    }),
  },
  async run(context) {
    const { userId, roles } = context.propsValue;
    if (!ROLES.includes(roles)) {
      throw new Error(`Roles must be one of ${ROLES.map((role) => `"${role}"`).join(', ')}, got "${roles}".`);
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(userId)}/roles`,
      body: { roles },
    });
  },
});

const ROLES = ['system_user', 'system_user system_admin'];
