import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostGetUsersByIdsOutputSchema } from '../../../output-schemas';

export const listUsersAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_users',
  outputSchema: mattermostGetUsersByIdsOutputSchema,
  displayName: 'List Users',
  description: 'Lists users, optionally filtered by team, channel, role or state.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of users, optionally only those in or not in a team or channel, without a team, active or deactivated, or with given roles. To match a name or email use Search Users. Not In Team cannot be combined with In Team; Channel Roles and sort "status" need In Channel; Team Roles and sorts "last_activity_at" / "create_at" need In Team.',
    idempotent: true,
  },
  props: {
    inTeam: mattermostAiProps.teamId({
      required: false,
      displayName: 'In Team',
      description: 'Only users in this team (team ID from List Teams or Get Team By Name).',
    }),
    notInTeam: mattermostAiProps.teamId({
      required: false,
      displayName: 'Not In Team',
      description: 'Only users not in this team (team ID). Cannot be used with In Team.',
    }),
    inChannel: mattermostAiProps.channelId({
      required: false,
      displayName: 'In Channel',
      description: 'Only users in this channel (channel ID from Get Channel By Name or Search Channels).',
    }),
    notInChannel: mattermostAiProps.channelId({
      required: false,
      displayName: 'Not In Channel',
      description: 'Only users not in this channel (channel ID). Pass the channel\'s team as In Team.',
    }),
    withoutTeam: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Without Team',
      description: 'True for only users that are on no team; overrides the team and channel filters.',
    }),
    active: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Active Only',
      description: 'True for only active users. Cannot be true together with Deactivated Only.',
    }),
    inactive: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Deactivated Only',
      description: 'True for only deactivated users. Cannot be true together with Active Only.',
    }),
    roles: Property.ShortText({
      displayName: 'System Roles',
      description: 'Comma-separated system roles; matches users with any of them, e.g. "system_admin,system_user".',
      required: false,
    }),
    teamRoles: Property.ShortText({
      displayName: 'Team Roles',
      description: 'Comma-separated team roles, e.g. "team_admin" or "team_user". Needs In Team.',
      required: false,
    }),
    channelRoles: Property.ShortText({
      displayName: 'Channel Roles',
      description: 'Comma-separated channel roles, e.g. "channel_admin" or "channel_user". Needs In Channel.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description:
        'Defaults to username. "last_activity_at" or "create_at" need In Team; "status" needs In Channel.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Last Activity', value: 'last_activity_at' },
          { label: 'Created', value: 'create_at' },
          { label: 'Status', value: 'status' },
        ],
      },
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const withoutTeam = mattermostUtils.parseBoolean({ value: p.withoutTeam });
    const active = mattermostUtils.parseBoolean({ value: p.active });
    const inactive = mattermostUtils.parseBoolean({ value: p.inactive });
    if (p.inTeam && p.notInTeam) {
      throw new Error('Not In Team cannot be used together with In Team.');
    }
    if (p.channelRoles && !p.inChannel) {
      throw new Error('Channel Roles needs In Channel.');
    }
    if (p.teamRoles && !p.inTeam) {
      throw new Error('Team Roles needs In Team.');
    }
    if (active === true && inactive === true) {
      throw new Error('Active Only and Deactivated Only cannot both be true.');
    }
    if (p.sort !== undefined && p.sort !== null && p.sort !== '') {
      if (!SORTS.includes(p.sort)) {
        throw new Error(`Sort must be one of ${SORTS.join(', ')}, got "${p.sort}".`);
      }
      if (p.sort === 'status' && !p.inChannel) {
        throw new Error('Sort "status" needs In Channel.');
      }
      if (p.sort !== 'status' && !p.inTeam) {
        throw new Error(`Sort "${p.sort}" needs In Team.`);
      }
    }
    const users = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/users',
      query: {
        ...mattermostUtils.paging({ page: p.page, perPage: p.perPage }),
        ...(p.inTeam ? { in_team: p.inTeam } : {}),
        ...(p.notInTeam ? { not_in_team: p.notInTeam } : {}),
        ...(p.inChannel ? { in_channel: p.inChannel } : {}),
        ...(p.notInChannel ? { not_in_channel: p.notInChannel } : {}),
        ...(withoutTeam !== undefined ? { without_team: String(withoutTeam) } : {}),
        ...(active !== undefined ? { active: String(active) } : {}),
        ...(inactive !== undefined ? { inactive: String(inactive) } : {}),
        ...(p.roles ? { roles: p.roles } : {}),
        ...(p.teamRoles ? { team_roles: p.teamRoles } : {}),
        ...(p.channelRoles ? { channel_roles: p.channelRoles } : {}),
        ...(p.sort ? { sort: p.sort } : {}),
      },
    });
    return { users, count: users.length };
  },
});

const SORTS = ['last_activity_at', 'create_at', 'status'];
