import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const getTeam = createAction({
  auth: onfleetAuth,
  name: 'get_team',
  displayName: 'Get Team',
  description: 'Gets an existing team',
  audience: 'both',
  aiMetadata: { description: 'Fetches a single Onfleet team by team ID. Read-only and idempotent. Requires a known team ID; to list all teams and discover IDs use get-teams instead.', idempotent: true },
  props: {
    team: common.team,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.teams.get(context.propsValue.team as string);
  },
});
