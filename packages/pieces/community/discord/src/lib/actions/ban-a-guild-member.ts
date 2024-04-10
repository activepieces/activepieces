import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../../index';
import { discordCommon } from '../common';

export const discordBanGuildMember = createAction({
  auth: discordAuth,
  name: 'ban_guild_member',
  description: 'Bans a guild member',
  displayName: 'Ban guild member',
  props: {
    guild_id: discordCommon.guilds,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The user id of the member',
      required: true,
    }),
    ban_reason: Property.ShortText({
      displayName: 'Ban Reason',
      description: 'The reason for banning the member',
      required: false,
    }),
  },

  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.PUT,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/bans/${configValue.propsValue.user_id}`,
      headers: {
        authorization: `Bot ${configValue.auth}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': `${configValue.propsValue.ban_reason}`,
      },
      body: {
        reason: `${configValue.propsValue.ban_reason}`,
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return {
      success: res.status === 204,
    };
  },
});
