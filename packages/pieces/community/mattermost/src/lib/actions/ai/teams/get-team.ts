import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetTeamOutputSchema } from '../../../output-schemas';

export const getTeamAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_team',
  outputSchema: mattermostGetTeamOutputSchema,
  displayName: 'Get Team',
  description: 'Gets a team by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one team by ID, including its type and invite ID. If you only have the team handle, use Get Team By Name.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/teams/${encodeURIComponent(context.propsValue.teamId)}`,
    });
  },
});
