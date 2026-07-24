import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordGetChannel = createAction({
  auth: discordAuth,
  name: 'discord_get_channel',
  displayName: 'Get Channel',
  description: 'Fetch the details of a single channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single channel by channel ID (GET /channels/{channel_id}), returning its name, type, topic, and parent. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The numeric channel ID.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      const c = res.body ?? {};
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        guild_id: c.guild_id ?? null,
        parent_id: c.parent_id ?? null,
        topic: c.topic ?? null,
        nsfw: c.nsfw ?? null,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks access to this channel.'
        );
      }
      if (status === 404) {
        throw new Error('Channel not found (404). Verify the channel_id.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
