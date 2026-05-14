import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';
import { Member } from '../common/models';

// Deprecated: Kept for backward compatibility
export const discordListGuildMembers = createAction({
  auth: discordAuth,
  name: 'list_guild_members',
  description: 'List Guild Members',
  displayName: 'List guild members',
  props: {
    guild_id: discordCommon.guilds,
  },

  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<Member[]>(request);

    return res.body;
  },
});

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
        limit: '10', // Search more to find exact match
      },
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<Member[]>(request);

    // Filter for exact match to resolve the "wrong user" concern
    const member = res.body.find(
      (m) =>
        m.user.username.toLowerCase() ===
        configValue.propsValue.username.toLowerCase()
    );

    return member || res.body[0] || null;
  },
});
