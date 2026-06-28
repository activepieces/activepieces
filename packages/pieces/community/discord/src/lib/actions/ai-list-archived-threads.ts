import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

interface ThreadChannel {
  id: string;
  name: string;
  parent_id?: string | null;
  owner_id?: string;
  thread_metadata?: { archived?: boolean; archive_timestamp?: string };
}

export const discordListArchivedThreads = createAction({
  auth: discordAuth,
  name: 'discord_list_archived_threads',
  displayName: 'List Archived Threads',
  description: 'List public archived threads in a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists PUBLIC archived threads in a channel by channel ID (GET /channels/{channel_id}/threads/archived/public). Read-only and idempotent. Requires Read Message History access to the channel.',
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The numeric parent channel ID.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/threads/archived/public`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<{ threads: ThreadChannel[] }>(
        request
      );
      const threads = (res.body?.threads ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        parent_id: t.parent_id ?? null,
        owner_id: t.owner_id ?? null,
        archive_timestamp: t.thread_metadata?.archive_timestamp ?? null,
      }));
      return { threads, count: threads.length };
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
