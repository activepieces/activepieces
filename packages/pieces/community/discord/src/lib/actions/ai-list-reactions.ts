import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

interface ReactionUser {
  id: string;
  username: string;
  global_name?: string | null;
}

export const discordListReactions = createAction({
  auth: discordAuth,
  name: 'discord_list_reactions',
  displayName: 'List Reactions',
  description: 'List users who reacted to a message with an emoji.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the users who reacted to a message with a given emoji by channel ID, message ID, and emoji (GET /channels/{channel_id}/messages/{message_id}/reactions/{emoji}). Emoji format: unicode char for standard, name:id for custom (resolve via List Emojis). Paginated by after/limit. Read-only and idempotent.',
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
    after: Property.ShortText({
      displayName: 'After User ID',
      description: 'Return users after this user ID for pagination.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max users to return, 1-100. Defaults to 25.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(configValue) {
    const emoji = encodeURIComponent(configValue.propsValue.emoji);
    let limit = configValue.propsValue.limit ?? 25;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const params = new URLSearchParams();
    params.append('limit', String(limit));
    if (configValue.propsValue.after) {
      params.append('after', configValue.propsValue.after);
    }

    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/messages/${configValue.propsValue.message_id}/reactions/${emoji}?${params.toString()}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<ReactionUser[]>(request);
      const users = (res.body ?? []).map((u) => ({
        user_id: u.id,
        username: u.username,
        global_name: u.global_name ?? null,
      }));
      return { users, count: users.length };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks access to this channel.'
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
