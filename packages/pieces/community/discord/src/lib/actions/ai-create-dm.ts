import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordCreateDm = createAction({
  auth: discordAuth,
  name: 'discord_create_dm',
  displayName: 'Create DM Channel',
  description: 'Open (or fetch) a direct-message channel with a user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Opens a direct-message channel with a user by user ID (POST /users/@me/channels) and returns the DM channel ID. Discord returns the existing DM channel if one is already open, so this is idempotent. Pair the returned channel_id with Send Message to DM the user.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description:
        'The numeric user ID to DM. Resolve from a username with Find Member.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.POST,
      url: `https://discord.com/api/v9/users/@me/channels`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        recipient_id: configValue.propsValue.user_id,
      },
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      return {
        success: res.status === 200 || res.status === 201,
        channel_id: res.body?.id,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The user may not share a server with the bot or has DMs disabled.'
        );
      }
      if (status === 404) {
        throw new Error('User not found (404). Verify the user_id.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
