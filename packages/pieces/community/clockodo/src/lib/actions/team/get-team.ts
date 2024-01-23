import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../../';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_team',
  displayName: 'Get Team',
  description: 'Retrieves a single team from clockodo',
  props: {
    team_id: clockodoCommon.team_id(),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.getTeam(propsValue.team_id as number);
    return res.team;
  },
});
