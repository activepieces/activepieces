import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { Message } from '../common/models';

export const discordListMessages = createAction({
  auth: discordAuth,
  name: 'discord_list_messages',
  displayName: 'List Messages',
  description: 'Read recent messages from a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads messages from a channel by channel ID (GET /channels/{channel_id}/messages?limit=&before=&after=&around=). The before, after, and around cursors are MUTUALLY EXCLUSIVE — supply at most one. Read-only and idempotent. Requires Read Message History access to the channel.',
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The numeric channel ID. Resolve a name with Find Channel.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max messages to return, 1-100. Defaults to 50.',
      required: false,
      defaultValue: 50,
    }),
    before: Property.ShortText({
      displayName: 'Before Message ID',
      description:
        'Return messages before this message ID. Mutually exclusive with After and Around.',
      required: false,
    }),
    after: Property.ShortText({
      displayName: 'After Message ID',
      description:
        'Return messages after this message ID. Mutually exclusive with Before and Around.',
      required: false,
    }),
    around: Property.ShortText({
      displayName: 'Around Message ID',
      description:
        'Return messages around this message ID. Mutually exclusive with Before and After.',
      required: false,
    }),
  },
  async run(configValue) {
    const { before, after, around } = configValue.propsValue;
    const cursors = [before, after, around].filter((c) => !!c);
    if (cursors.length > 1) {
      throw new Error(
        'before, after, and around are mutually exclusive — supply at most one.'
      );
    }

    let limit = configValue.propsValue.limit ?? 50;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const params = new URLSearchParams();
    params.append('limit', String(limit));
    if (before) params.append('before', before);
    if (after) params.append('after', after);
    if (around) params.append('around', around);

    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/messages?${params.toString()}`,
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
        pinned: m.pinned,
        timestamp: m.timestamp,
        edited_timestamp: m.edited_timestamp,
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
