import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsGetTeamOutputSchema } from '../../../output-schemas';

export const getTeam = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_team',
  outputSchema: microsoftTeamsGetTeamOutputSchema,
  displayName: 'Get Team',
  description: 'Gets a team by ID, with its settings.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one team by its ID, including its description, visibility, archive state, web URL and member, messaging, guest and fun settings. Team IDs come from List Joined Teams or List Teams.',
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
  },
  async run(context) {
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api(`/teams/${context.propsValue.teamId}`).get());
  },
});
