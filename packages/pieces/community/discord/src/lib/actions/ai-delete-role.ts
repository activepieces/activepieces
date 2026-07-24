import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordDeleteRoleAi = createAction({
  auth: discordAuth,
  name: 'discord_delete_role',
  displayName: 'Delete Role',
  description: 'Permanently delete a role from a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a role from a guild by guild ID and role ID (DELETE /guilds/{guild_id}/roles/{role_id}); the role is removed from all members. Resolve role IDs with List Roles. Idempotent: deleting an already-removed role returns success (alreadyAbsent). Requires Manage Roles permission.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
    role_id: Property.ShortText({
      displayName: 'Role ID',
      description: 'The numeric role ID to delete. Resolve from a name with List Roles.',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Optional audit-log reason.',
      required: false,
    }),
  },
  async run(configValue) {
    const request: HttpRequest = {
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/roles/${configValue.propsValue.role_id}`,
      method: HttpMethod.DELETE,
      headers: {
        Authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': `${configValue.propsValue.reason ?? ''}`,
      },
    };

    try {
      const res = await httpClient.sendRequest(request);
      return {
        success: res.status === 204,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      // 404 (Unknown Role, 10011) -> already gone; idempotent success.
      if (status === 404) {
        return { success: true, alreadyAbsent: true };
      }
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Roles permission.'
        );
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
