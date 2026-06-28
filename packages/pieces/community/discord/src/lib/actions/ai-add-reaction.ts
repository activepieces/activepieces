import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordAddReaction = createAction({
  auth: discordAuth,
  name: 'discord_add_reaction',
  displayName: 'Add Reaction',
  description: "Add the bot's reaction emoji to a message.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Adds the bot's reaction to a message by channel ID, message ID, and emoji (PUT /channels/{channel_id}/messages/{message_id}/reactions/{emoji}/@me). For a standard emoji pass the unicode character (e.g. \"👍\"); for a custom emoji pass name:id (e.g. \"partyblob:12345\"), resolved via List Emojis. Idempotent: re-adding the same reaction is a no-op.",
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The numeric channel ID.',
      required: true,
    }),
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The numeric message ID to react to.',
      required: true,
    }),
    emoji: Property.ShortText({
      displayName: 'Emoji',
      description:
        'Standard emoji as a unicode character (e.g. "🔥"), or a custom emoji as name:id (e.g. "partyblob:123456789"). Resolve custom emoji IDs with List Emojis.',
      required: true,
    }),
  },
  async run(configValue) {
    const emoji = encodeURIComponent(configValue.propsValue.emoji);
    const request: HttpRequest<any> = {
      method: HttpMethod.PUT,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/messages/${configValue.propsValue.message_id}/reactions/${emoji}/@me`,
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
          'Discord denied the request (403). The bot lacks Add Reactions / Read Message History access.'
        );
      }
      if (status === 400) {
        throw new Error(
          'Bad request (400). Check the emoji format: unicode char for standard, name:id for custom (resolve via List Emojis).'
        );
      }
      if (status === 404) {
        throw new Error('Channel, message, or emoji not found (404). Verify the inputs.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
