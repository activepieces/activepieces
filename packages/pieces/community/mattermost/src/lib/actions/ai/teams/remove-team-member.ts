import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const removeTeamMemberAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_remove_team_member',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Remove Team Member',
  description: 'Removes a user from a team.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes a user from a team and its channels; pass "me" to leave the team as the connected user. Add Team Member adds them back. Removing someone else needs the remove_user_from_team permission.',
    idempotent: false,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    const { teamId, userId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
    });
  },
});
