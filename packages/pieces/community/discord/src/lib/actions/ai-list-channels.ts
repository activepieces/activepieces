import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

interface ChannelFull {
  id: string;
  name: string;
  type: number;
  parent_id?: string | null;
  position?: number;
  topic?: string | null;
}

export const discordListChannels = createAction({
  auth: discordAuth,
  name: 'discord_list_channels',
  displayName: 'List Channels',
  description: 'Enumerate all channels in a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all channels in a guild by guild ID (GET /guilds/{guild_id}/channels), returning IDs, names, and types. Use to enumerate channels or to resolve a name to an ID (use Find Channel for a single exact-name lookup). Read-only and idempotent.',
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
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/channels`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<ChannelFull[]>(request);
      const channels = (res.body ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parent_id: c.parent_id ?? null,
        position: c.position ?? null,
        topic: c.topic ?? null,
      }));
      return { channels, count: channels.length };
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
