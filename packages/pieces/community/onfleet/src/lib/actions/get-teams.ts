import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const getTeams = createAction({
  auth: onfleetAuth,
  name: 'get_teams',
  displayName: 'Get Teams',
  description: 'Gets many existing team',
  props: {},
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.teams.get();
  },
});
