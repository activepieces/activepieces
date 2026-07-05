import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';

export const discordRemoveMemberFromGuild = createAction({
  auth: discordAuth,
  name: 'remove_member_from_guild',
  description: 'Remove Guild Member',
  audience: 'both',
  aiMetadata: { description: 'Kicks a member from a guild, identified by guild ID and user ID; the user may rejoin later via an invite. Use to remove someone without a permanent ban. Requires the bot to have Kick Members permission; idempotent, since removing an absent member yields the same end state.', idempotent: true },
  displayName: 'Remove member from guild',
  props: {
    guild_id: discordCommon.guilds,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The user id of the member',
      required: true,
    }),
  },

  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.DELETE,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members/${configValue.propsValue.user_id}`,
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
