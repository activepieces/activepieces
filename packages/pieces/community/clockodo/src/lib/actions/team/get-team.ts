import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_team',
  displayName: 'Get Team',
  description: 'Retrieves a single team from clockodo',
  audience: 'both',
  aiMetadata: { description: 'Fetch one clockodo team by its numeric team ID. Read-only and repeatable. Use when you already have the team ID; to browse teams or resolve a team ID by name use Get Teams instead.', idempotent: true },
  props: {
    team_id: clockodoCommon.team_id(),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    const res = await client.getTeam(propsValue.team_id as number);
    return res.team;
  },
});
