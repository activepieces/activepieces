import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListJoinedTeamsOutputSchema } from '../../../output-schemas';

export const listJoinedTeams = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_joined_teams',
  outputSchema: microsoftTeamsListJoinedTeamsOutputSchema,
  displayName: 'List Joined Teams',
  description: 'Lists the teams the signed-in user is a direct member of.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every team the signed-in user is a direct member of, with each team ID. Start here to get a team ID for channel, member and message actions; use List Teams to see teams across the organization.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await microsoftTeamsClient.list({ auth: context.auth, path: '/me/joinedTeams' });
  },
});
