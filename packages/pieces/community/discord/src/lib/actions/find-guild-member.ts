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
    const members = await fetchAllMembers({
      guildId: configValue.propsValue.guild_id,
      token: configValue.auth.secret_text,
    });

    const search = configValue.propsValue.shortText?.trim().toLowerCase() ?? '';
    const matching =
      search.length === 0
        ? members
        : members.filter((member) => matchesSearch({ member, search }));

    if (matching.length === 0)
      return {
        disabled: true,
        options: [],
        placeholder: 'No members found',
      };

    return {
      options: matching.map((member) => ({
        value: member.user.id,
        label: member.user.username,
      })),
    };
  },
});

async function fetchAllMembers({
  guildId,
  token,
}: {
  guildId: string;
  token: string;
}): Promise<GuildMember[]> {
  const pages: GuildMember[][] = [];
  let after: string | undefined = undefined;

  do {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${guildId}/members`,
      queryParams: {
        limit: `${MEMBERS_PAGE_SIZE}`,
        ...(after ? { after } : {}),
      },
      headers: {
        authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
    };
    const res = await httpClient.sendRequest<GuildMember[]>(request);
    pages.push(res.body);
    after =
      res.body.length === MEMBERS_PAGE_SIZE
        ? res.body[res.body.length - 1].user.id
        : undefined;
  } while (after !== undefined);

  return pages.flat();
}

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

const MEMBERS_PAGE_SIZE = 1000;
