import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';
import { Channel } from '../common/models';
import { discordSuccessWithChannelIdActionOutputSchema } from '../output-schemas';

export const discordFindChannel = createAction({
  auth: discordAuth,
  name: 'find_channel',
  classification: 'SEARCH',
  description: 'Look up a channel in a server by its exact name.',
  audience: 'human',
  aiMetadata: { description: 'Looks up a channel in a guild by its exact name and returns its channel ID, given the guild ID. Use to resolve a channel name into the ID required by message, rename, or delete actions. Read-only and idempotent; matching is exact and returns the first match.', idempotent: true },
  displayName: 'Find Channel',
  outputSchema: discordSuccessWithChannelIdActionOutputSchema,
  props: {
    guild_id: discordCommon.guilds,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Exact name without the leading #, case-sensitive.',
      placeholder: 'general',
      required: true,
    }),
  },

  async run(configValue) {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/channels`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<Channel[]>(request);

    const channel = res.body.find(
      (channel) => channel.name === configValue.propsValue.name
    );

    return {
      success: res.status === 200 && !!channel,
      channel_id: channel?.id,
    };
  },
});
