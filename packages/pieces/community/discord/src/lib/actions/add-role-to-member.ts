import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';
import { discordSuccessActionOutputSchema } from '../output-schemas';

export const discordAddRoleToMember = createAction({
  auth: discordAuth,
  name: 'add_role_to_member',
  classification: 'WRITE',
  description: 'Give a member of a server a role.',
  audience: 'human',
  aiMetadata: { description: 'Assigns a role to a guild member, identified by guild ID, user ID, and role ID. Use to grant permissions or tag a user. Requires the bot to have Manage Roles and a higher role than the target; idempotent, since re-adding an already-assigned role leaves the member unchanged.', idempotent: true },
  displayName: 'Add Role to Member',
  outputSchema: discordSuccessActionOutputSchema,
  props: {
    guild_id: discordCommon.guilds,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description:
        'Right-click the member and choose Copy User ID in Developer Mode.',
      placeholder: '123456789012345678',
      required: true,
    }),
    role_id: discordCommon.roles,
  },

  async run(configValue) {
    const request: HttpRequest = {
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
