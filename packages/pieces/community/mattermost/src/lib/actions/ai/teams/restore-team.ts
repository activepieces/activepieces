import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateTeamOutputSchema } from '../../../output-schemas';

export const restoreTeamAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_restore_team',
  outputSchema: mattermostCreateTeamOutputSchema,
  displayName: 'Restore Team',
  description: 'Restores a team that was archived.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Brings back a team archived with Archive Team, with its channels and members. Needs the manage_team permission.',
    idempotent: false,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${encodeURIComponent(context.propsValue.teamId)}/restore`,
    });
  },
});
