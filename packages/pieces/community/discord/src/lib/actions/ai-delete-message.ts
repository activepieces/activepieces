import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordDeleteMessage = createAction({
  auth: discordAuth,
  name: 'discord_delete_message',
  displayName: 'Delete Message',
  description: 'Delete a single message from a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a single message by channel ID and message ID (DELETE /channels/{channel_id}/messages/{message_id}). Idempotent: deleting an already-removed message returns success (alreadyAbsent). Deleting another author\'s message requires the bot to have Manage Messages permission.',
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The numeric channel ID containing the message.',
      required: true,
    }),
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The numeric message ID to delete. Obtain from List Messages.',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Optional audit-log reason.',
      required: false,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.DELETE,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/messages/${configValue.propsValue.message_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': `${configValue.propsValue.reason ?? ''}`,
      },
    };

    try {
      const res = await httpClient.sendRequest<never>(request);
      return { success: res.status === 204 };
    } catch (error: any) {
      const status = error?.response?.status;
      // 404 (Unknown Message, 10008) -> already gone; idempotent success.
      if (status === 404) {
        return { success: true, alreadyAbsent: true };
      }
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot needs Manage Messages to delete another author\'s message.'
        );
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
