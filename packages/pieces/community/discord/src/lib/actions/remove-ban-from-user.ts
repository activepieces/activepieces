import { createAction, Property } from '@activepieces/pieces-framework';
import { discordCommon } from '../common';
import { discordAuth } from '../auth';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { discordSuccessActionOutputSchema } from '../output-schemas';

export const discordRemoveBanFromUser = createAction({
  auth: discordAuth,
  name: 'remove_ban_from_user',
  classification: 'WRITE',
  displayName: 'Remove Ban from User',
  description: 'Lift a ban so the user can rejoin the server.',
  audience: 'both',
  aiMetadata: { description: 'Lifts a guild ban for a user, identified by guild ID and user ID, with an optional audit-log reason; the user may rejoin afterward. Use to reverse a previous ban. Requires the bot to have Ban Members permission; idempotent, since unbanning a user who is not banned yields the same end state.', idempotent: true },
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
    unban_reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Recorded in the server audit log.',
      required: false,
      advanced: true,
    }),
  },
  async run(configValue) {
    const reason = configValue.propsValue.unban_reason;

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
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
