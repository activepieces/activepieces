import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_team',
  classification: 'READ',
  displayName: 'Get Team',
  description: 'Retrieves a single team from Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.team,
  aiMetadata: { description: 'Fetch one Clockodo team by its numeric team ID. Read-only and repeatable. Use when you already have the team ID; to browse teams or resolve a team ID by name use Get Teams instead.', idempotent: true },
  props: {
    team_id: clockodoCommon.team_id(),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.team_id, field: 'Team' });
    return makeClient(auth.props).getTeam(id);
  },
});
