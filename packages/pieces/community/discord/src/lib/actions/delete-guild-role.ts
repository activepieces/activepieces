import { createAction, Property } from '@activepieces/pieces-framework';
import { discordCommon } from '../common';
import { discordAuth } from '../auth';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const discordDeleteGuildRole = createAction({
  auth: discordAuth,
  name: 'deleteGuildRole',
  displayName: 'Delete guild role',
  description: 'Deletes the specified role from the specified guild',
  audience: 'human',
  aiMetadata: { description: 'Permanently deletes a role from a guild, identified by guild ID and role ID, with an optional audit-log reason; the role is removed from all members. Use to remove an unwanted role. Requires the bot to have Manage Roles permission; idempotent in end state, since deleting an already-removed role leaves it gone.', idempotent: true },
  props: {
    guild_id: discordCommon.guilds,
    role_id: discordCommon.roles,
    deletion_reason: Property.ShortText({
      displayName: 'Deletion reason',
      description: 'The reason for deleting the role',
      required: false,
    }),
  },
  async run(configValue) {
    const request: HttpRequest = {
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/roles/${configValue.propsValue.role_id}`,
      method: HttpMethod.DELETE,
      headers: {
        Authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': `${configValue.propsValue.deletion_reason}`,
      },
    };

    try {
      const res = await httpClient.sendRequest(request);
      return {
        success: res.status === 204,
      };
    } catch (error: any) {
      // Discord returns 404 (Unknown Role, 10011) when the role is already
      // gone. Treat that as success so the action is idempotent.
      if (error?.response?.status === 404) {
        return { success: true, alreadyAbsent: true };
      }
      throw error;
    }
  },
});
