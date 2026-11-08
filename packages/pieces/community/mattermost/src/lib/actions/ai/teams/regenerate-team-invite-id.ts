import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateTeamOutputSchema } from '../../../output-schemas';

export const regenerateTeamInviteIdAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_regenerate_team_invite_id',
  outputSchema: mattermostCreateTeamOutputSchema,
  displayName: 'Regenerate Team Invite ID',
  description: 'Replaces a team\'s invite ID, so old invite links stop working.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Issues a new invite ID for the team and returns the team with it; every earlier invite link stops working. Needs the manage_team permission. Not idempotent: each call issues a different ID.',
    idempotent: false,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${encodeURIComponent(context.propsValue.teamId)}/regenerate_invite_id`,
    });
  },
});
