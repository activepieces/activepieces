import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordLeaveThread = createAction({
  auth: discordAuth,
  name: 'discord_leave_thread',
  displayName: 'Leave Thread',
  description: 'Have the bot leave a thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes the bot itself from a thread by channel (thread) ID (DELETE /channels/{channel_id}/thread-members/@me). Idempotent: leaving a thread the bot is not in returns success (alreadyAbsent).',
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The numeric thread (channel) ID to leave.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.DELETE,
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
      // 404 -> not a member; idempotent success.
      if (status === 404) {
        return { success: true, alreadyAbsent: true };
      }
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks access to this thread.'
        );
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
