import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordDeleteScheduledEvent = createAction({
  auth: discordAuth,
  name: 'discord_delete_scheduled_event',
  displayName: 'Delete Scheduled Event',
  description: 'Delete a scheduled event.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a scheduled event by guild ID and event ID (DELETE /guilds/{guild_id}/scheduled-events/{event_id}). Idempotent: deleting an already-removed event returns success (alreadyAbsent). Requires the bot to have Manage Events permission.',
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
      description: 'The numeric scheduled event ID. Obtain from List Scheduled Events.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.DELETE,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/scheduled-events/${configValue.propsValue.event_id}`,
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
      // 404 -> already gone; idempotent success.
      if (status === 404) {
        return { success: true, alreadyAbsent: true };
      }
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Events permission.'
        );
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
