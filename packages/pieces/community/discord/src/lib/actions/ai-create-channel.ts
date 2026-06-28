import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordCreateChannelAi = createAction({
  auth: discordAuth,
  name: 'discord_create_channel',
  displayName: 'Create Channel',
  description: 'Create a new channel in a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new channel in a guild by guild ID (POST /guilds/{guild_id}/channels). Each call creates a separate channel even with the same name, so it is not idempotent. Requires the bot to have Manage Channels permission in the guild.',
    idempotent: false,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description:
        'The numeric guild (server) ID (e.g. "974519864045756446"). Find it in Discord server settings or via Get Guild / List ... actions.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the new channel (e.g. "support").',
      required: true,
    }),
    topic: Property.LongText({
      displayName: 'Topic',
      description: 'Optional channel topic / description.',
      required: false,
    }),
  },
  async run(configValue) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/channels`,
      body: {
        name: configValue.propsValue.name,
        topic: configValue.propsValue.topic,
      },
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest(request);
      return {
        success: res.status === 201,
        channel: {
          id: res.body.id,
          name: res.body.name,
        },
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Channels permission in this guild.'
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
