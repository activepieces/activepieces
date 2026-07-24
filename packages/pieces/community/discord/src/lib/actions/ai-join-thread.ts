import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordJoinThread = createAction({
  auth: discordAuth,
  name: 'discord_join_thread',
  displayName: 'Join Thread',
  description: 'Have the bot join a thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds the bot itself to a thread by channel (thread) ID (PUT /channels/{channel_id}/thread-members/@me). Idempotent: re-joining a thread the bot is already in is a no-op.',
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The numeric thread (channel) ID to join.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.PUT,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/thread-members/@me`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<never>(request);
      return { success: res.status === 204 };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks access to this thread.'
        );
      }
      if (status === 404) {
        throw new Error('Thread not found (404). Verify the thread ID.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
