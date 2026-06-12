import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const deleteTeam = createAction({
  auth: onfleetAuth,
  name: 'delete_team',
  displayName: 'Delete Team',
  description: 'Delete an existing team',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete an Onfleet team by its ID. Idempotent in effect: once removed the result is the same, though deleting an already-removed team may error. Destructive and irreversible, so confirm the team selection before calling.',
    idempotent: true,
  },
  props: {
    team: common.team,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.teams.deleteOne(context.propsValue.team as string);
  },
});
