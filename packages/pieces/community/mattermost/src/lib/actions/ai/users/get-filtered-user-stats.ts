import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostGetFilteredUserStatsOutputSchema } from '../../../output-schemas';

export const getFilteredUserStatsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_filtered_user_stats',
  outputSchema: mattermostGetFilteredUserStatsOutputSchema,
  displayName: 'Get Filtered User Count',
  description: 'Counts the users matching filters.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many users match the filters: in a team or channel, with given roles, optionally counting bots and deactivated users. Needs a system admin connection. Team Roles needs In Team; Channel Roles needs In Channel.',
    idempotent: true,
  },
  props: {
    inTeam: mattermostAiProps.teamId({
      required: false,
      displayName: 'In Team',
      description: 'Only count users in this team (team ID from List Teams or Get Team By Name).',
    }),
    inChannel: mattermostAiProps.channelId({
      required: false,
      displayName: 'In Channel',
      description: 'Only count users in this channel (channel ID from Get Channel By Name or Search Channels).',
    }),
    includeDeleted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Deactivated',
      description: 'True to also count deactivated users.',
    }),
    includeBots: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Bots',
      description: 'True to also count bot accounts.',
    }),
    roles: Property.ShortText({
      displayName: 'System Roles',
      description: 'Comma-separated system roles; counts users with any of them, e.g. "system_admin,system_user".',
      required: false,
    }),
    teamRoles: Property.ShortText({
      displayName: 'Team Roles',
      description: 'Comma-separated team roles, e.g. "team_admin". Needs In Team.',
      required: false,
    }),
    channelRoles: Property.ShortText({
      displayName: 'Channel Roles',
      description: 'Comma-separated channel roles, e.g. "channel_admin". Needs In Channel.',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const includeDeleted = mattermostUtils.parseBoolean({ value: p.includeDeleted });
    const includeBots = mattermostUtils.parseBoolean({ value: p.includeBots });
    if (p.teamRoles && !p.inTeam) {
      throw new Error('Team Roles needs In Team.');
    }
    if (p.channelRoles && !p.inChannel) {
      throw new Error('Channel Roles needs In Channel.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/users/stats/filtered',
      query: {
        ...(p.inTeam ? { in_team: p.inTeam } : {}),
        ...(p.inChannel ? { in_channel: p.inChannel } : {}),
        ...(includeDeleted !== undefined ? { include_deleted: String(includeDeleted) } : {}),
        ...(includeBots !== undefined ? { include_bots: String(includeBots) } : {}),
        ...(p.roles ? { roles: p.roles } : {}),
        ...(p.teamRoles ? { team_roles: p.teamRoles } : {}),
        ...(p.channelRoles ? { channel_roles: p.channelRoles } : {}),
      },
    });
  },
});
