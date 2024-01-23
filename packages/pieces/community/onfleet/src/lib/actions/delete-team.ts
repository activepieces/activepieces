import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const deleteTeam = createAction({
  auth: onfleetAuth,
  name: 'delete_team',
  displayName: 'Delete Team',
  description: 'Delete an existing team',
  props: {
    team: common.team,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.teams.deleteOne(context.propsValue.team as string);
  },
});
