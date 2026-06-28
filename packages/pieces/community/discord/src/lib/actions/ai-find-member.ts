import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

interface GuildMember {
  user?: { id: string; username: string; global_name?: string | null };
  nick?: string | null;
  roles?: string[];
  joined_at?: string;
}

export const discordFindMember = createAction({
  auth: discordAuth,
  name: 'discord_find_member',
  displayName: 'Find Member',
  description: 'Search guild members by username/nickname prefix.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches guild members by a username or nickname prefix (GET /guilds/{guild_id}/members/search?query=&limit=) and returns matching user IDs. Use to resolve a name into the user ID needed by role, kick, ban, or timeout actions. This server-side prefix search does NOT require the privileged Server Members intent. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Username or nickname prefix to match (e.g. "jane"). Matched against the start of the name.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max members to return, 1-1000. Defaults to 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(configValue) {
    const limit = configValue.propsValue.limit ?? 10;
    const query = encodeURIComponent(configValue.propsValue.query);
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members/search?query=${query}&limit=${limit}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<GuildMember[]>(request);
      const members = (res.body ?? []).map((m) => ({
        user_id: m.user?.id,
        username: m.user?.username,
        global_name: m.user?.global_name ?? null,
        nick: m.nick ?? null,
        joined_at: m.joined_at ?? null,
        roles: m.roles ?? [],
      }));
      return { members, count: members.length };
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
