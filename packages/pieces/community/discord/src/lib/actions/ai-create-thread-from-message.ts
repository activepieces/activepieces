import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordCreateThreadFromMessage = createAction({
  auth: discordAuth,
  name: 'discord_create_thread_from_message',
  displayName: 'Create Thread from Message',
  description: 'Start a thread attached to an existing message.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a thread anchored to an existing message by channel ID and message ID (POST /channels/{channel_id}/messages/{message_id}/threads). Each call creates a new thread, so it is not idempotent. Requires Create Public Threads permission (usually a default).',
    idempotent: false,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The numeric channel ID containing the message.',
      required: true,
    }),
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The numeric message ID to anchor the thread to.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Thread Name',
      description: 'The name of the new thread. Up to 100 characters.',
      required: true,
    }),
    auto_archive_duration: Property.StaticDropdown({
      displayName: 'Auto Archive Duration',
      description: 'Minutes of inactivity before the thread auto-archives.',
      required: false,
      defaultValue: 1440,
      options: {
        options: [
          { label: '1 hour', value: 60 },
          { label: '24 hours', value: 1440 },
          { label: '3 days', value: 4320 },
          { label: '1 week', value: 10080 },
        ],
      },
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.POST,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/messages/${configValue.propsValue.message_id}/threads`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: configValue.propsValue.name,
        auto_archive_duration: configValue.propsValue.auto_archive_duration,
      },
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      return {
        success: res.status === 201,
        thread: { id: res.body?.id, name: res.body?.name },
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Create Public Threads permission.'
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
