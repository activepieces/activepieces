import { clockodoOutputSchemas } from '../../common/output-schemas';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'list_teams',
  classification: 'SEARCH',
  displayName: 'Get Teams',
  description: 'Fetches teams from Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.teams,
  aiMetadata: { description: 'List all Clockodo teams. Read-only, repeatable, and takes no filters. Use to discover teams or resolve a team ID by name before assigning a user or another call.', idempotent: true },
  props: {},
  async run({ auth }) {
    const teams = await makeClient(auth.props).listTeams();
    return {
      teams,
    };
  },
});
