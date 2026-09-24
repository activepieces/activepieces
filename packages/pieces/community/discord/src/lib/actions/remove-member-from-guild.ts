import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';
import { discordSuccessActionOutputSchema } from '../output-schemas';

export const discordRemoveMemberFromGuild = createAction({
  auth: discordAuth,
  name: 'remove_member_from_guild',
  classification: 'DESTRUCTIVE',
  description: 'Kick a member; they can rejoin with an invite.',
  audience: 'both',
  aiMetadata: { description: 'Kicks a member from a guild, identified by guild ID and user ID; the user may rejoin later via an invite. Use to remove someone without a permanent ban. Requires the bot to have Kick Members permission; idempotent, since removing an absent member yields the same end state.', idempotent: true },
  outputSchema: discordSuccessActionOutputSchema,
  displayName: 'Remove Member from Server',
  props: {
    guild_id: discordCommon.guilds,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description:
        'Right-click the member and choose Copy User ID in Developer Mode.',
      placeholder: '123456789012345678',
      required: true,
    }),
  },

  async run(configValue) {
    const request: HttpRequest = {
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
