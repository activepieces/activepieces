import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../../index';
import { discordCommon } from '../common';
import { Member } from '../common/models';

export const discordFindGuildMemberByUsername = createAction({
  auth: discordAuth,
  name: 'list_guild_members',
  description: 'List Guild Members',
  displayName: 'List guild members',
  props: {
    guild_id: discordCommon.guilds,
    shortText: Property.ShortText({
      displayName: 'Search',
      description: 'Search for a member',
      required: true,
    }),
  },

  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members`,
      headers: {
        authorization: `Bot ${configValue.auth}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<Member[]>(request);

    const options: { options: { value: string; label: string }[] } = {
      options: [],
    };

    if (res.body.length === 0)
      return {
        disabled: true,
        options: [],
        placeholder: 'No members found, please add the bot to a guild first',
      };

    await Promise.all(
      res.body.map(async (member) => {
        options.options.push({
          value: member.user.id,
          label: member.user.username,
        });
      })
    );

    return options;
  },
});
