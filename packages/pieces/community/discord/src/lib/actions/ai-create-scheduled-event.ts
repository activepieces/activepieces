import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordCreateScheduledEvent = createAction({
  auth: discordAuth,
  name: 'discord_create_scheduled_event',
  displayName: 'Create Scheduled Event',
  description: 'Create a scheduled event in a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a scheduled event in a guild by guild ID (POST /guilds/{guild_id}/scheduled-events). Required fields depend on Entity Type: EXTERNAL needs both a Location and a Scheduled End Time; STAGE_INSTANCE and VOICE need a Channel ID. Each call creates a new event, so it is not idempotent. Requires the bot to have Manage Events permission.',
    idempotent: false,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The event name.',
      required: true,
    }),
    scheduled_start_time: Property.ShortText({
      displayName: 'Scheduled Start Time',
      description: 'ISO 8601 start time (e.g. "2026-07-01T18:00:00Z").',
      required: true,
    }),
    entity_type: Property.StaticDropdown({
      displayName: 'Entity Type',
      description:
        'Where the event happens. EXTERNAL requires Location + Scheduled End Time; STAGE/VOICE require a Channel ID.',
      required: true,
      defaultValue: 3,
      options: {
        options: [
          { label: 'Stage Instance', value: 1 },
          { label: 'Voice', value: 2 },
          { label: 'External', value: 3 },
        ],
      },
    }),
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'Required for STAGE_INSTANCE and VOICE entity types. The numeric voice/stage channel ID.',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description:
        'Required for the EXTERNAL entity type. A free-text location (e.g. "https://zoom.us/..." or "Main Hall").',
      required: false,
    }),
    scheduled_end_time: Property.ShortText({
      displayName: 'Scheduled End Time',
      description:
        'ISO 8601 end time. Required for the EXTERNAL entity type (e.g. "2026-07-01T20:00:00Z").',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional event description.',
      required: false,
    }),
  },
  async run(configValue) {
    const {
      entity_type,
      channel_id,
      location,
      scheduled_end_time,
    } = configValue.propsValue;

    if (entity_type === 3) {
      if (!location || !scheduled_end_time) {
        throw new Error(
          'An EXTERNAL event requires both a Location and a Scheduled End Time.'
        );
      }
    } else if (!channel_id) {
      throw new Error(
        'A STAGE_INSTANCE or VOICE event requires a Channel ID.'
      );
    }

    const body: Record<string, unknown> = {
      name: configValue.propsValue.name,
      scheduled_start_time: configValue.propsValue.scheduled_start_time,
      entity_type,
      privacy_level: 2, // GUILD_ONLY (the only valid value)
    };
    if (configValue.propsValue.description) {
      body['description'] = configValue.propsValue.description;
    }
    if (entity_type === 3) {
      body['entity_metadata'] = { location };
      body['scheduled_end_time'] = scheduled_end_time;
    } else {
      body['channel_id'] = channel_id;
    }

    const request: HttpRequest<any> = {
      method: HttpMethod.POST,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/scheduled-events`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      return {
        success: res.status === 200 || res.status === 201,
        event: { id: res.body?.id, name: res.body?.name },
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Events permission.'
        );
      }
      if (status === 400) {
        throw new Error(
          'Bad request (400). Check entity_type required fields and ISO 8601 timestamps.'
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
