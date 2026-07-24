import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordAddThreadMember = createAction({
  auth: discordAuth,
  name: 'discord_add_thread_member',
  displayName: 'Add Thread Member',
  description: 'Add a user to a thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a user to a thread by thread (channel) ID and user ID (PUT /channels/{channel_id}/thread-members/{user_id}). Idempotent: re-adding a user already in the thread is a no-op. Requires the bot to be in the thread and have Send Messages in it.',
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The numeric thread (channel) ID.',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The numeric user ID to add. Resolve from a username with Find Member.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.PUT,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/thread-members/${configValue.propsValue.user_id}`,
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
        throw new Error('Thread or user not found (404). Verify the IDs.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
