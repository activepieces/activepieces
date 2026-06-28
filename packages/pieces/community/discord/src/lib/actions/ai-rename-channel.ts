import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordRenameChannelAi = createAction({
  auth: discordAuth,
  name: 'discord_rename_channel',
  displayName: 'Rename Channel',
  description: 'Change the name of an existing channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames a channel by channel ID (PATCH /channels/{channel_id} with the name field only). Idempotent: setting the same name repeatedly yields the same result. Requires the bot to have Manage Channels permission.',
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'The numeric channel ID to rename (e.g. "1080123456789012345"). Resolve a name with Find Channel or List Channels.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'The new channel name.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.PATCH,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}`,
      body: {
        name: configValue.propsValue.name,
      },
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<never>(request);
      return {
        success: res.status === 200 || res.status === 204,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Channels permission.'
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
