import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';
import { discordSuccessActionOutputSchema } from '../output-schemas';

export const discordBanGuildMember = createAction({
  auth: discordAuth,
  name: 'ban_guild_member',
  classification: 'DESTRUCTIVE',
  description: 'Ban a user from a server so they cannot rejoin.',
  audience: 'both',
  aiMetadata: { description: 'Bans a user from a guild, identified by guild ID and user ID, with an optional audit-log reason; this removes them and blocks rejoining until unbanned. Use to permanently remove a disruptive user. Requires the bot to have Ban Members permission; idempotent, since re-banning an already-banned user yields the same end state.', idempotent: true },
  outputSchema: discordSuccessActionOutputSchema,
  displayName: 'Ban Member',
  props: {
    guild_id: discordCommon.guilds,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description:
        'Right-click the member and choose Copy User ID in Developer Mode.',
      placeholder: '123456789012345678',
      required: true,
    }),
    ban_reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Recorded in the server audit log.',
      required: false,
      advanced: true,
    }),
  },

  async run(configValue) {
    const reason = configValue.propsValue.ban_reason;

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/bans/${configValue.propsValue.user_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
        ...(reason ? { 'X-Audit-Log-Reason': reason } : {}),
      },
      body: reason ? { reason } : undefined,
    };

    const res = await httpClient.sendRequest<never>(request);

    return {
      success: res.status === 204,
    };
  },
});
