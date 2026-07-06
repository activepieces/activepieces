import { createAction, Property } from '@activepieces/pieces-framework';
import { discordCommon } from '../common';
import { discordAuth } from '../auth';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const discordRemoveBanFromUser = createAction({
  auth: discordAuth,
  name: 'remove_ban_from_user',
  displayName: 'Remove ban from user',
  description: 'Removes the guild ban from a user',
  audience: 'both',
  aiMetadata: { description: 'Lifts a guild ban for a user, identified by guild ID and user ID, with an optional audit-log reason; the user may rejoin afterward. Use to reverse a previous ban. Requires the bot to have Ban Members permission; idempotent, since unbanning a user who is not banned yields the same end state.', idempotent: true },
  props: {
    guild_id: discordCommon.guilds,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user',
      required: true,
    }),
    unban_reason: Property.ShortText({
      displayName: 'Unban Reason',
      description: 'The reason for unbanning the user',
      required: false,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.DELETE,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/bans/${configValue.propsValue.user_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': `${configValue.propsValue.unban_reason}`,
      },
      body: {
        reason: `${configValue.propsValue.unban_reason}`,
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return {
      success: res.status === 204,
    };
  },
});
