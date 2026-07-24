import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordRemoveUserReaction = createAction({
  auth: discordAuth,
  name: 'discord_remove_user_reaction',
  displayName: 'Remove User Reaction',
  description: "Remove another user's reaction from a message (moderation).",
  audience: 'ai',
  aiMetadata: {
    description:
      "Removes a specific user's reaction from a message by channel ID, message ID, emoji, and user ID (DELETE /channels/{channel_id}/messages/{message_id}/reactions/{emoji}/{user_id}). Use for moderation. Emoji format: unicode char for standard, name:id for custom (resolve via List Emojis). Idempotent: removing an absent reaction returns success (alreadyAbsent). Requires Manage Messages permission.",
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
        'Standard emoji as a unicode character, or a custom emoji as name:id. Resolve custom emoji IDs with List Emojis.',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: "The numeric user ID whose reaction to remove.",
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
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/messages/${configValue.propsValue.message_id}/reactions/${emoji}/${configValue.propsValue.user_id}`,
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
      // 404 -> reaction not present; idempotent success.
      if (status === 404) {
        return { success: true, alreadyAbsent: true };
      }
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Messages permission.'
        );
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
