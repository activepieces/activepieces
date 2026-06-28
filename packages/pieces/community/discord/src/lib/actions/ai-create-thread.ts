import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordCreateThread = createAction({
  auth: discordAuth,
  name: 'discord_create_thread',
  displayName: 'Create Thread',
  description: 'Create a standalone thread (or forum post) in a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a standalone thread or forum post in a channel by channel ID (POST /channels/{channel_id}/threads). Use Create Thread from Message instead to anchor a thread to a specific message. Each call creates a new thread, so it is not idempotent. Requires Create Threads permission.',
    idempotent: false,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The numeric parent channel ID.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Thread Name',
      description: 'The name of the new thread. Up to 100 characters.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Thread Type',
      description: 'The channel type of the thread.',
      required: false,
      defaultValue: 11,
      options: {
        options: [
          { label: 'Public Thread', value: 11 },
          { label: 'Private Thread', value: 12 },
          { label: 'Announcement Thread', value: 10 },
        ],
      },
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
    message: Property.LongText({
      displayName: 'Starter Message',
      description:
        'Required when the parent is a Forum or Media channel: the content of the initial post that starts the thread. Leave empty for text/announcement channel threads.',
      required: false,
    }),
  },
  async run(configValue) {
    const body: Record<string, unknown> = {
      name: configValue.propsValue.name,
      type: configValue.propsValue.type,
      auto_archive_duration: configValue.propsValue.auto_archive_duration,
    };
    // Forum / media channels reject thread creation without a starter message.
    if (configValue.propsValue.message) {
      body['message'] = { content: configValue.propsValue.message };
    }
    const request: HttpRequest<any> = {
      method: HttpMethod.POST,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/threads`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
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
          'Discord denied the request (403). The bot lacks permission to create threads here.'
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
