import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const getTeam = createAction({
  auth: onfleetAuth,
  name: 'get_team',
  displayName: 'Get Team',
  description: 'Gets an existing team',
  props: {
    team: common.team,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.teams.get(context.propsValue.team as string);
  },
});
