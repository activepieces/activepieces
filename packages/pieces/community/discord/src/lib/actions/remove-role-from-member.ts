import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../../index';
import { discordCommon } from '../common';

export const discordRemoveRoleFromMember = createAction({
  auth: discordAuth,
  name: 'remove_role_from_member',
  description: 'Remove Guild Member Role',
  displayName: 'Remove role from member',
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
      method: HttpMethod.DELETE,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members/${configValue.propsValue.user_id}/roles/${configValue.propsValue.role_id}`,
      headers: {
        authorization: `Bot ${configValue.auth}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return {
      success: res.status === 204,
    };
  },
});
