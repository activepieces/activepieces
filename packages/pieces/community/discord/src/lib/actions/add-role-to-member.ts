import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';

export const discordAddRoleToMember = createAction({
  auth: discordAuth,
  name: 'add_role_to_member',
  description: 'Add Guild Member Role',
  audience: 'both',
  aiMetadata: { description: 'Assigns a role to a guild member, identified by guild ID, user ID, and role ID. Use to grant permissions or tag a user. Requires the bot to have Manage Roles and a higher role than the target; idempotent, since re-adding an already-assigned role leaves the member unchanged.', idempotent: true },
  displayName: 'Add role to member',
  props: {
    guild_id: discordCommon.guilds,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The user id of the member',
      required: true,
    }),
    role_id: discordCommon.roles,
  },

  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.PUT,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members/${configValue.propsValue.user_id}/roles/${configValue.propsValue.role_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return {
      success: res.status === 204,
    };
  },
});
