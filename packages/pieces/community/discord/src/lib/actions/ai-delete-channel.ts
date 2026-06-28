import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discordAuth } from '../auth';

export const discordDeleteChannelAi = createAction({
  auth: discordAuth,
  name: 'discord_delete_channel',
  displayName: 'Delete Channel',
  description: 'Permanently delete a channel by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a channel by channel ID (DELETE /channels/{channel_id}). This is destructive and removes the channel and its messages. Idempotent: deleting an already-removed channel returns success (alreadyAbsent). Requires the bot to have Manage Channels permission.',
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'The numeric channel ID to delete (e.g. "1080123456789012345"). Resolve a name with Find Channel or List Channels.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<never>(request);
      return res.body ?? { success: true };
    } catch (error: any) {
      const status = error?.response?.status;
      // 404 (Unknown Channel, 10003) -> already gone; idempotent success.
      if (status === 404) {
        return { success: true, alreadyAbsent: true };
      }
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Channels permission.'
        );
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
