import { createAction } from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { teamListOutputSchema } from '../common/output-schemas';

export const listTeams = createAction({
  auth: ninetyAuth,
  name: 'list_teams',
  classification: 'SEARCH',
  displayName: 'List Teams',
  description: 'List the Ninety teams this connection can see',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the Ninety teams the connected token can see, with their ids. Use it first when another step needs a team id and none is known. The list is limited to the token owner permissions. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: teamListOutputSchema,
  props: {},
  async run({ auth }) {
    const teams = await ninetyCommon.listTeams({ token: auth.secret_text });
    return { teams, count: teams.length };
  },
});
