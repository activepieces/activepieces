import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { Message } from '../common/models';

export const discordListPinnedMessages = createAction({
  auth: discordAuth,
  name: 'discord_list_pinned_messages',
  displayName: 'List Pinned Messages',
  description: 'List the pinned messages in a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the pinned messages in a channel by channel ID (GET /channels/{channel_id}/pins). Read-only and idempotent. Requires Read Message History access to the channel.',
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
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/pins`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<Message[]>(request);
      const messages = (res.body ?? []).map((m) => ({
        id: m.id,
        content: m.content,
        author_id: m.author?.id,
        author_username: m.author?.username,
        timestamp: m.timestamp,
      }));
      return { messages, count: messages.length };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Read Message History access.'
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
