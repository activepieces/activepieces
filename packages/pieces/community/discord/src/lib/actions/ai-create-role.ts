import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordCreateRoleAi = createAction({
  auth: discordAuth,
  name: 'discord_create_role',
  displayName: 'Create Role',
  description: 'Create a new role in a guild.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new role in a guild by guild ID (POST /guilds/{guild_id}/roles) with name and optional color, hoist, and mentionable settings. Each call creates a separate role even with the same name, so it is not idempotent. Requires the bot to have Manage Roles permission.',
    idempotent: false,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Role Name',
      description: 'The name of the new role.',
      required: true,
    }),
    color: Property.Number({
      displayName: 'Color',
      description:
        'Optional role color as an integer RGB value (e.g. 3447003 for blue). Omit for the default color.',
      required: false,
    }),
    hoist: Property.Checkbox({
      displayName: 'Display Separately',
      description: 'Whether members with this role show separately in the sidebar.',
      required: false,
    }),
    mentionable: Property.Checkbox({
      displayName: 'Mentionable',
      description: 'Whether the role can be mentioned by other members.',
      required: false,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Optional audit-log reason.',
      required: false,
    }),
  },
  async run(configValue) {
    const request: HttpRequest = {
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/roles`,
      method: HttpMethod.POST,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': `${configValue.propsValue.reason ?? ''}`,
      },
      body: {
        name: configValue.propsValue.name,
        color: configValue.propsValue.color,
        hoist: configValue.propsValue.hoist,
        mentionable: configValue.propsValue.mentionable,
      },
    };

    try {
      const res = await httpClient.sendRequest(request);
      return {
        success: res.status === 200 || res.status === 201,
        role: {
          id: res.body.id,
          name: res.body.name,
        },
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Roles permission.'
        );
      }
      if (status === 404) {
        throw new Error('Guild not found (404). Verify the guild_id.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
