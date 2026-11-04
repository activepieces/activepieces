import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetTeamUnreadOutputSchema } from '../../../output-schemas';

export const getTeamUnreadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_team_unread',
  outputSchema: mattermostGetTeamUnreadOutputSchema,
  displayName: 'Get Team Unread',
  description: 'Gets a user\'s unread message and mention counts in one team.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the unread message and mention counts of a user in one team; pass "me" for the connected account. For all teams at once use List Team Unreads.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    const { userId, teamId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/unread`,
    });
  },
});
