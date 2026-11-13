import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListArchivedChannelsOutputSchema } from '../../../output-schemas';

export const listUserTeamChannelsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_user_team_channels',
  outputSchema: mattermostListArchivedChannelsOutputSchema,
  displayName: 'List User Team Channels',
  description: 'Lists the channels a user belongs to in a team.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every channel a user is a member of in one team, including private channels and direct and group messages; pass "me" for the connected account. Across all teams use List User Channels.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
    includeDeleted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Archived',
      description: '"true" to include archived channels. Defaults to "false".',
    }),
  },
  async run(context) {
    const { userId, teamId, includeDeleted } = context.propsValue;
    const deleted = mattermostUtils.parseBoolean({ value: includeDeleted });
    const channels = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/channels`,
      query: deleted !== undefined ? { include_deleted: String(deleted) } : undefined,
    });
    return { channels, count: channels.length };
  },
});
