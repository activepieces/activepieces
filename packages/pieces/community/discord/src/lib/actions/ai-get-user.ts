import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordGetUser = createAction({
  auth: discordAuth,
  name: 'discord_get_user',
  displayName: 'Get User',
  description: 'Fetch a global Discord user object by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a global Discord user by user ID (GET /users/{user_id}), returning username, global name, and avatar. This is the account-wide user object, distinct from the guild-scoped Get Member. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The numeric user ID.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/users/${configValue.propsValue.user_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      const u = res.body ?? {};
      return {
        id: u.id,
        username: u.username,
        global_name: u.global_name ?? null,
        bot: u.bot ?? false,
        avatar: u.avatar ?? null,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Discord denied the request (403).');
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
