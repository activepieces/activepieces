import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordUpdateScheduledEvent = createAction({
  auth: discordAuth,
  name: 'discord_update_scheduled_event',
  displayName: 'Update Scheduled Event',
  description: 'Edit, start, or cancel a scheduled event.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a scheduled event by guild ID and event ID (PATCH /guilds/{guild_id}/scheduled-events/{event_id}) — edit fields or change status to start (ACTIVE) or cancel (CANCELED) it. Idempotent: setting the same values yields the same state. Requires the bot to have Manage Events permission.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description:
        'The numeric scheduled event ID. Obtain from List Scheduled Events.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New event name. Leave empty to keep the current name.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description. Leave empty to keep the current one.',
      required: false,
    }),
    scheduled_start_time: Property.ShortText({
      displayName: 'Scheduled Start Time',
      description: 'New ISO 8601 start time. Leave empty to keep the current one.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Optionally change the event status.',
      required: false,
      options: {
        options: [
          { label: 'Scheduled', value: 1 },
          { label: 'Active (start)', value: 2 },
          { label: 'Completed', value: 3 },
          { label: 'Canceled', value: 4 },
        ],
      },
    }),
  },
  async run(configValue) {
    const body: Record<string, unknown> = {};
    if (configValue.propsValue.name) body['name'] = configValue.propsValue.name;
    if (configValue.propsValue.description) {
      body['description'] = configValue.propsValue.description;
    }
    if (configValue.propsValue.scheduled_start_time) {
      body['scheduled_start_time'] = configValue.propsValue.scheduled_start_time;
    }
    if (
      configValue.propsValue.status !== undefined &&
      configValue.propsValue.status !== null
    ) {
      body['status'] = configValue.propsValue.status;
    }

    const request: HttpRequest<any> = {
      method: HttpMethod.PATCH,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/scheduled-events/${configValue.propsValue.event_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      return {
        success: res.status === 200,
        event: { id: res.body?.id, name: res.body?.name, status: res.body?.status },
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Events permission.'
        );
      }
      if (status === 404) {
        throw new Error('Guild or event not found (404). Verify guild_id and event_id.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
