import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostGetUsersByIdsOutputSchema } from '../../../output-schemas';

export const searchUsersAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_search_users',
  outputSchema: mattermostGetUsersByIdsOutputSchema,
  displayName: 'Search Users',
  description: 'Searches users by username, name, nickname or email.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds users whose username, full name, nickname or email match a term, optionally only in or not in a team or channel. Use it to find a user ID for other actions. Not In Channel needs Team ID.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({
      displayName: 'Term',
      description: 'Text to match against username, full name, nickname and email.',
      required: true,
    }),
    teamId: mattermostAiProps.teamId({
      required: false,
      description: 'Only users on this team (team ID from List Teams or Get Team By Name).',
    }),
    notInTeamId: mattermostAiProps.teamId({
      required: false,
      displayName: 'Not In Team',
      description: 'Only users not on this team (team ID).',
    }),
    inChannelId: mattermostAiProps.channelId({
      required: false,
      displayName: 'In Channel',
      description: 'Only users in this channel (channel ID from Get Channel By Name or Search Channels).',
    }),
    notInChannelId: mattermostAiProps.channelId({
      required: false,
      displayName: 'Not In Channel',
      description: 'Only users not in this channel (channel ID). Needs Team ID.',
    }),
    withoutTeam: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Without Team',
      description: 'True for only users on no team; overrides the team and channel filters.',
    }),
    allowInactive: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Deactivated',
      description: 'True to also return deactivated users.',
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum users to return, 1 to 1000. Defaults to 100.',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    if (p.notInChannelId && !p.teamId) {
      throw new Error('Not In Channel needs Team ID.');
    }
    const users = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/users/search',
      body: {
        term: p.term,
        team_id: p.teamId,
        not_in_team_id: p.notInTeamId,
        in_channel_id: p.inChannelId,
        not_in_channel_id: p.notInChannelId,
        without_team: mattermostUtils.parseBoolean({ value: p.withoutTeam }),
        allow_inactive: mattermostUtils.parseBoolean({ value: p.allowInactive }),
        limit: Math.min(Math.max(p.limit ?? 100, 1), 1000),
      },
    });
    return { users, count: users.length };
  },
});
