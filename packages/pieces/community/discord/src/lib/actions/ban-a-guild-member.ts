import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';

export const discordBanGuildMember = createAction({
  auth: discordAuth,
  name: 'ban_guild_member',
  description: 'Bans a guild member',
  audience: 'both',
  aiMetadata: { description: 'Bans a user from a guild, identified by guild ID and user ID, with an optional audit-log reason; this removes them and blocks rejoining until unbanned. Use to permanently remove a disruptive user. Requires the bot to have Ban Members permission; idempotent, since re-banning an already-banned user yields the same end state.', idempotent: true },
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
        authorization: `Bot ${configValue.auth.secret_text}`,
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
