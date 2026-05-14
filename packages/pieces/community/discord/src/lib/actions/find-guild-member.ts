import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';
import { Member } from '../common/models';

export const discordFindGuildMemberByUsername = createAction({
  auth: discordAuth,
  name: 'find_guild_member',
  description: 'Find a Guild Member by username',
  displayName: 'Find Guild Member',
  props: {
    guild_id: discordCommon.guilds,
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The username to search for',
      required: true,
    }),
  },

  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members/search`,
      queryParams: {
        query: configValue.propsValue.username,
        limit: '1',
      },
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<Member[]>(request);

    if (res.body.length === 0) {
      return null;
    }

    return res.body[0];
  },
});
