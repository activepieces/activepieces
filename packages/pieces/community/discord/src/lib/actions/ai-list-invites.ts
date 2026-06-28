import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

interface Invite {
  code: string;
  uses?: number;
  max_uses?: number;
  channel?: { id: string; name: string } | null;
  inviter?: { id: string; username: string } | null;
  expires_at?: string | null;
}

export const discordListInvites = createAction({
  auth: discordAuth,
  name: 'discord_list_invites',
  displayName: 'List Invites',
  description: 'List the active invites of a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the active invites of a guild by guild ID (GET /guilds/{guild_id}/invites), returning invite codes and their usage. Read-only and idempotent. Requires the bot to have Manage Guild permission.',
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
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/invites`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<Invite[]>(request);
      const invites = (res.body ?? []).map((i) => ({
        code: i.code,
        uses: i.uses ?? null,
        max_uses: i.max_uses ?? null,
        channel_id: i.channel?.id ?? null,
        channel_name: i.channel?.name ?? null,
        inviter_id: i.inviter?.id ?? null,
        expires_at: i.expires_at ?? null,
      }));
      return { invites, count: invites.length };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Guild permission.'
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
