import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListDeletedTeamsOutputSchema } from '../../../output-schemas';

export const listDeletedTeams = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_deleted_teams',
  outputSchema: microsoftTeamsListDeletedTeamsOutputSchema,
  displayName: 'List Deleted Teams',
  description: 'Lists teams that were deleted and can still be restored.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists deleted teams that are still within their restore window, with each team ID. Read-only: restoring a team is not available.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await microsoftTeamsClient.list({ auth: context.auth, path: '/teamwork/deletedTeams' });
  },
});
