import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordClearReactions = createAction({
  auth: discordAuth,
  name: 'discord_clear_reactions',
  displayName: 'Clear All Reactions',
  description: 'Remove all reactions from a message.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes ALL reactions from a message by channel ID and message ID (DELETE /channels/{channel_id}/messages/{message_id}/reactions). This is a destructive bulk operation. Not idempotent: it is not a stable single-target set-by-key. Requires the bot to have Manage Messages permission.',
    idempotent: false,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The numeric channel ID.',
      required: true,
    }),
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The numeric message ID to clear reactions from.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.DELETE,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/messages/${configValue.propsValue.message_id}/reactions`,
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
