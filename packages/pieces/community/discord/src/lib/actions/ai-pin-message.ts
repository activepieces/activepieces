import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordPinMessage = createAction({
  auth: discordAuth,
  name: 'discord_pin_message',
  displayName: 'Pin Message',
  description: 'Pin a message in a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pins a message in a channel by channel ID and message ID (PUT /channels/{channel_id}/pins/{message_id}). Idempotent: re-pinning an already-pinned message is a no-op. A channel holds at most 50 pins. Requires the bot to have Manage Messages permission.',
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
      description: 'The numeric message ID to pin. Obtain from List Messages.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.PUT,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/pins/${configValue.propsValue.message_id}`,
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
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Messages permission.'
        );
      }
      if (status === 404) {
        throw new Error('Channel or message not found (404). Verify the IDs.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
