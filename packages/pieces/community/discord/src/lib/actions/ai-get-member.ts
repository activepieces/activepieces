import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordGetMember = createAction({
  auth: discordAuth,
  name: 'discord_get_member',
  displayName: 'Get Member',
  description: 'Fetch a single guild member by user ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single guild member by guild ID and user ID (GET /guilds/{guild_id}/members/{user_id}), returning their nickname, roles, and join date. A single-member GET does NOT require the privileged Server Members intent. Read-only and idempotent.',
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
      description: 'The numeric user ID. Resolve from a username with Find Member.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members/${configValue.propsValue.user_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      const m = res.body ?? {};
      return {
        user_id: m.user?.id,
        username: m.user?.username,
        global_name: m.user?.global_name ?? null,
        nick: m.nick ?? null,
        roles: m.roles ?? [],
        joined_at: m.joined_at ?? null,
        communication_disabled_until: m.communication_disabled_until ?? null,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks access to this guild.'
        );
      }
      if (status === 404) {
        throw new Error('Guild or member not found (404). Verify guild_id and user_id.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
