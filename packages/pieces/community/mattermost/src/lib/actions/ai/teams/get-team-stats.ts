import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetTeamStatsOutputSchema } from '../../../output-schemas';

export const getTeamStatsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_team_stats',
  outputSchema: mattermostGetTeamStatsOutputSchema,
  displayName: 'Get Team Stats',
  description: 'Gets the member counts of a team.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns how many members a team has. To list them use List Team Members.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/teams/${encodeURIComponent(context.propsValue.teamId)}/stats`,
    });
  },
});
