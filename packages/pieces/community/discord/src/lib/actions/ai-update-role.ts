import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordUpdateRole = createAction({
  auth: discordAuth,
  name: 'discord_update_role',
  displayName: 'Update Role',
  description: "Update a role's name, color, hoist, or mentionable settings.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a role by guild ID and role ID (PATCH /guilds/{guild_id}/roles/{role_id}) — name, color, hoist, and mentionable only; it deliberately does NOT touch the permissions bitfield. Resolve role IDs with List Roles. Idempotent: setting the same values yields the same state. Requires Manage Roles permission.',
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
    role_id: Property.ShortText({
      displayName: 'Role ID',
      description: 'The numeric role ID to update. Resolve from a name with List Roles.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New role name. Leave empty to keep the current name.',
      required: false,
    }),
    color: Property.Number({
      displayName: 'Color',
      description:
        'New role color as an integer RGB value (e.g. 3447003). Leave empty to keep the current color.',
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
    const body: Record<string, unknown> = {};
    if (configValue.propsValue.name !== undefined && configValue.propsValue.name !== '') {
      body['name'] = configValue.propsValue.name;
    }
    if (configValue.propsValue.color !== undefined && configValue.propsValue.color !== null) {
      body['color'] = configValue.propsValue.color;
    }
    if (configValue.propsValue.hoist !== undefined) {
      body['hoist'] = configValue.propsValue.hoist;
    }
    if (configValue.propsValue.mentionable !== undefined) {
      body['mentionable'] = configValue.propsValue.mentionable;
    }

    const request: HttpRequest<any> = {
      method: HttpMethod.PATCH,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/roles/${configValue.propsValue.role_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': `${configValue.propsValue.reason ?? ''}`,
      },
      body,
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      return {
        success: res.status === 200,
        role: { id: res.body?.id, name: res.body?.name },
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Roles permission.'
        );
      }
      if (status === 404) {
        throw new Error('Guild or role not found (404). Verify guild_id and role_id.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
