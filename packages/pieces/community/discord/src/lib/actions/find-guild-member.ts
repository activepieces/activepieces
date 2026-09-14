import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';
import { discordListGuildMembersActionOutputSchema } from '../output-schemas';

export const discordFindGuildMemberByUsername = createAction({
  auth: discordAuth,
  name: 'list_guild_members',
  classification: 'SEARCH',
  description: 'List server members, optionally filtered by name.',
  audience: 'human',
  aiMetadata: { description: 'Lists members of a guild, returning their user IDs and usernames for the given guild ID. Use to look up a member ID before role, kick, or ban actions, or to enumerate who is in a server. Read-only and idempotent; requires the Server Members privileged intent to be enabled for the bot.', idempotent: true },
  displayName: 'List Members',
  outputSchema: discordListGuildMembersActionOutputSchema,
  props: {
    guild_id: discordCommon.guilds,
    shortText: Property.ShortText({
      displayName: 'Search',
      description:
        'Only members whose username or nickname contains this text.',
      placeholder: 'jane',
      required: false,
    }),
  },

  async run(configValue) {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members?limit=1000`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<GuildMember[]>(request);

    const search = configValue.propsValue.shortText?.trim().toLowerCase() ?? '';
    const members =
      search.length === 0
        ? res.body
        : res.body.filter((member) => matchesSearch({ member, search }));

    if (members.length === 0)
      return {
        disabled: true,
        options: [],
        placeholder: 'No members found',
      };

    return {
      options: members.map((member) => ({
        value: member.user.id,
        label: member.user.username,
      })),
    };
  },
});

function matchesSearch({
  member,
  search,
}: {
  member: GuildMember;
  search: string;
}): boolean {
  const haystack = [member.user.username, member.user.global_name, member.nick];
  return haystack.some(
    (value) => typeof value === 'string' && value.toLowerCase().includes(search)
  );
}

interface GuildMember {
  user: {
    id: string;
    username: string;
    global_name?: string | null;
  };
  nick?: string | null;
}
