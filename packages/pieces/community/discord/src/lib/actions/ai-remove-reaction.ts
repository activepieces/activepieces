import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordRemoveReaction = createAction({
  auth: discordAuth,
  name: 'discord_remove_reaction',
  displayName: 'Remove Own Reaction',
  description: "Remove the bot's own reaction from a message.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Removes the bot's OWN reaction from a message by channel ID, message ID, and emoji (DELETE /channels/{channel_id}/messages/{message_id}/reactions/{emoji}/@me). Emoji format: unicode char for standard, name:id for custom (resolve via List Emojis). Idempotent: removing a reaction that is not present returns success (alreadyAbsent).",
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
      description: 'The numeric message ID.',
      required: true,
    }),
    emoji: Property.ShortText({
      displayName: 'Emoji',
      description:
        'Standard emoji as a unicode character (e.g. "🔥"), or a custom emoji as name:id. Resolve custom emoji IDs with List Emojis.',
      required: true,
    }),
  },
  async run(configValue) {
    // Custom emoji must keep the name:id colon literal in the route segment;
    // only unicode emoji (and the custom emoji's name part) are percent-encoded.
    const rawEmoji = configValue.propsValue.emoji;
    const customEmoji = /^(.+):(\d+)$/.exec(rawEmoji);
    const emoji = customEmoji
      ? `${encodeURIComponent(customEmoji[1])}:${customEmoji[2]}`
      : encodeURIComponent(rawEmoji);
    const request: HttpRequest<any> = {
      method: HttpMethod.DELETE,
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
      // 404 -> reaction/message not found; idempotent success.
      if (status === 404) {
        return { success: true, alreadyAbsent: true };
      }
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks access to this channel.'
        );
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
