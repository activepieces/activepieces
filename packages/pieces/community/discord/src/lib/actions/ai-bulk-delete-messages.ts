import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordBulkDeleteMessages = createAction({
  auth: discordAuth,
  name: 'discord_bulk_delete_messages',
  displayName: 'Bulk Delete Messages',
  description: 'Delete 2-100 recent messages from a channel in one call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes 2-100 messages in one batch by channel ID (POST /channels/{channel_id}/messages/bulk-delete). All target messages must be newer than 14 days. Not idempotent: a re-run with the same IDs fails because the messages are already gone. Requires the bot to have Manage Messages permission.',
    idempotent: false,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The numeric channel ID.',
      required: true,
    }),
    message_ids: Property.Array({
      displayName: 'Message IDs',
      description:
        'A list of 2-100 message IDs to delete, all less than 14 days old. Obtain from List Messages.',
      required: true,
    }),
  },
  async run(configValue) {
    const messageIds = (configValue.propsValue.message_ids as string[]) ?? [];
    if (messageIds.length < 2 || messageIds.length > 100) {
      throw new Error(
        'Bulk delete requires between 2 and 100 message IDs.'
      );
    }

    const request: HttpRequest<any> = {
      method: HttpMethod.POST,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/messages/bulk-delete`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        messages: messageIds,
      },
    };

    try {
      const res = await httpClient.sendRequest<never>(request);
      return { success: res.status === 204, deleted_count: messageIds.length };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Messages permission.'
        );
      }
      if (status === 400) {
        throw new Error(
          'Bad request (400). Messages may be older than 14 days, or the ID list is invalid.'
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
