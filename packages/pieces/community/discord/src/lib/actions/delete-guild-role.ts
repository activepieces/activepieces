import { createAction, Property } from '@activepieces/pieces-framework';
import { discordCommon } from '../common';
import { discordAuth } from '../../index';
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
        Authorization: `Bot ${configValue.auth}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': `${configValue.propsValue.deletion_reason}`,
      },
    };

    const res = await httpClient.sendRequest(request);

    return {
      success: res.status === 204,
    };
  },
});
