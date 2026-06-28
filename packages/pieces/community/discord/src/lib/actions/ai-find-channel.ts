import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { Channel } from '../common/models';

export const discordFindChannelAi = createAction({
  auth: discordAuth,
  name: 'discord_find_channel',
  displayName: 'Find Channel',
  description: 'Resolve a channel name to its ID within a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up a channel in a guild by exact name and returns its channel ID (GET /guilds/{guild_id}/channels, client-side match). Use this resolver before any channel-scoped action (Send Message, Rename Channel, Delete Channel). Read-only and idempotent; returns the first exact-name match.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description:
        'The numeric guild (server) ID (e.g. "974519864045756446").',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Channel Name',
      description: 'The exact channel name to find (e.g. "general").',
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
      const res = await httpClient.sendRequest<Channel[]>(request);
      const channel = res.body.find(
        (channel) => channel.name === configValue.propsValue.name
      );
      return {
        found: !!channel,
        channel_id: channel?.id,
        name: channel?.name,
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
