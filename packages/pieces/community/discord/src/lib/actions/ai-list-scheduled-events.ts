import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

interface ScheduledEvent {
  id: string;
  name: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string | null;
  status?: number;
  entity_type?: number;
  user_count?: number;
}

export const discordListScheduledEvents = createAction({
  auth: discordAuth,
  name: 'discord_list_scheduled_events',
  displayName: 'List Scheduled Events',
  description: 'List the scheduled events of a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the scheduled events of a guild by guild ID (GET /guilds/{guild_id}/scheduled-events?with_user_count=). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
    with_user_count: Property.Checkbox({
      displayName: 'Include User Count',
      description: 'Whether to include the subscriber count for each event.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(configValue) {
    const withCount = configValue.propsValue.with_user_count ? 'true' : 'false';
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/scheduled-events?with_user_count=${withCount}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<ScheduledEvent[]>(request);
      const events = (res.body ?? []).map((e) => ({
        id: e.id,
        name: e.name,
        scheduled_start_time: e.scheduled_start_time ?? null,
        scheduled_end_time: e.scheduled_end_time ?? null,
        status: e.status ?? null,
        entity_type: e.entity_type ?? null,
        user_count: e.user_count ?? null,
      }));
      return { events, count: events.length };
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
