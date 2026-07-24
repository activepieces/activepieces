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
  thread_metadata?: { archived?: boolean; auto_archive_duration?: number };
}

export const discordListActiveThreads = createAction({
  auth: discordAuth,
  name: 'discord_list_active_threads',
  displayName: 'List Active Threads',
  description: 'List all active threads in a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all active (non-archived) threads in a guild by guild ID (GET /guilds/{guild_id}/threads/active). Read-only and idempotent. Requires the bot to be able to view the parent channels.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/threads/active`,
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
        archived: t.thread_metadata?.archived ?? false,
      }));
      return { threads, count: threads.length };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks access to this guild.'
        );
      }
      if (status === 404) {
        throw new Error('Guild not found (404). Verify the guild_id.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
