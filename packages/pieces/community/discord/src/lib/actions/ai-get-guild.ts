import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordGetGuild = createAction({
  auth: discordAuth,
  name: 'discord_get_guild',
  displayName: 'Get Guild',
  description: 'Fetch metadata about a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches metadata about a guild by guild ID (GET /guilds/{guild_id}?with_counts=), returning its name, owner, and optional member counts. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
    with_counts: Property.Checkbox({
      displayName: 'Include Member Counts',
      description: 'Whether to include approximate member and presence counts.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(configValue) {
    const withCounts = configValue.propsValue.with_counts ? 'true' : 'false';
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}?with_counts=${withCounts}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      const g = res.body ?? {};
      return {
        id: g.id,
        name: g.name,
        owner_id: g.owner_id ?? null,
        description: g.description ?? null,
        approximate_member_count: g.approximate_member_count ?? null,
        approximate_presence_count: g.approximate_presence_count ?? null,
      };
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
