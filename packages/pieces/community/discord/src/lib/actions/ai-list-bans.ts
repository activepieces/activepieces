import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

interface Ban {
  reason?: string | null;
  user?: { id: string; username: string };
}

export const discordListBans = createAction({
  auth: discordAuth,
  name: 'discord_list_bans',
  displayName: 'List Bans',
  description: 'List the banned users of a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the banned users of a guild by guild ID (GET /guilds/{guild_id}/bans?limit=&before=&after=), returning user IDs and ban reasons. Paginated. Read-only and idempotent. Requires the bot to have Ban Members permission.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max bans to return, 1-1000. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
    before: Property.ShortText({
      displayName: 'Before User ID',
      description: 'Return bans before this user ID for pagination.',
      required: false,
    }),
    after: Property.ShortText({
      displayName: 'After User ID',
      description: 'Return bans after this user ID for pagination.',
      required: false,
    }),
  },
  async run(configValue) {
    let limit = configValue.propsValue.limit ?? 100;
    if (limit < 1) limit = 1;
    if (limit > 1000) limit = 1000;

    const params = new URLSearchParams();
    params.append('limit', String(limit));
    if (configValue.propsValue.before) {
      params.append('before', configValue.propsValue.before);
    }
    if (configValue.propsValue.after) {
      params.append('after', configValue.propsValue.after);
    }

    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/bans?${params.toString()}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<Ban[]>(request);
      const bans = (res.body ?? []).map((b) => ({
        user_id: b.user?.id,
        username: b.user?.username,
        reason: b.reason ?? null,
      }));
      return { bans, count: bans.length };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Ban Members permission.'
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
