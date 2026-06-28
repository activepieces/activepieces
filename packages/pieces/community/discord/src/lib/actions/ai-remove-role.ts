import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordRemoveRoleAi = createAction({
  auth: discordAuth,
  name: 'discord_remove_role',
  displayName: 'Remove Role from Member',
  description: 'Remove a role from a guild member.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a role from a guild member by guild ID, user ID, and role ID (DELETE /guilds/{guild_id}/members/{user_id}/roles/{role_id}). Resolve role IDs with List Roles and user IDs with Find Member. Idempotent: removing a role the member does not have is a no-op. Requires Manage Roles and the bot role above the target role.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description:
        'The numeric user ID of the member. Resolve from a username with Find Member.',
      required: true,
    }),
    role_id: Property.ShortText({
      displayName: 'Role ID',
      description: 'The numeric role ID. Resolve from a name with List Roles.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.DELETE,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members/${configValue.propsValue.user_id}/roles/${configValue.propsValue.role_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<never>(request);
      return {
        success: res.status === 204,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      // Removing a role the member does not have can surface as 404; treat as
      // an idempotent no-op success.
      if (status === 404) {
        return { success: true, alreadyAbsent: true };
      }
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot needs Manage Roles and a role higher than the target role.'
        );
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
