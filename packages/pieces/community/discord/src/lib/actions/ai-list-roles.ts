import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

interface Role {
  id: string;
  name: string;
  color?: number;
  hoist?: boolean;
  position?: number;
  mentionable?: boolean;
}

export const discordListRoles = createAction({
  auth: discordAuth,
  name: 'discord_list_roles',
  displayName: 'List Roles',
  description: 'List the roles of a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the roles of a guild by guild ID (GET /guilds/{guild_id}/roles), returning role IDs and names. Use this resolver to turn a role name into the ID needed by Add Role, Remove Role, Update Role, or Delete Role. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/roles`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<Role[]>(request);
      const roles = (res.body ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color ?? null,
        hoist: r.hoist ?? null,
        position: r.position ?? null,
        mentionable: r.mentionable ?? null,
      }));
      return { roles, count: roles.length };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks access to this guild.'
        );
      }
      if (status === 404) {
        throw new Error('Guild not found (404). Verify the guild_id.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
