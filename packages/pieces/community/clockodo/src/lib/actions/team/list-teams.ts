import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'list_teams',
  displayName: 'Get Teams',
  description: 'Fetches teams from clockodo',
  audience: 'both',
  aiMetadata: { description: 'List all clockodo teams. Read-only, repeatable, and takes no filters. Use to discover teams or resolve a team ID by name before assigning a user or another call.', idempotent: true },
  props: {},
  async run({ auth }) {
    const client = makeClient(auth.props);
    const res = await client.listTeams();
    return {
      teams: res.teams,
    };
  },
});
