import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsClient } from '../../../common/client';

export const listAssociatedTeams = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_associated_teams',
  displayName: 'List Associated Teams',
  description: 'Lists the teams the signed-in user is associated with, including teams reached through shared channels.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the teams the signed-in user is associated with: teams they are a direct member of plus teams whose shared channels they belong to, with each team ID and tenant ID. Use List Joined Teams for direct memberships only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await microsoftTeamsClient.list({ auth: context.auth, path: '/me/teamwork/associatedTeams' });
  },
});
