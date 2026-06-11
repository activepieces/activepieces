import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const getTeams = createAction({
  auth: onfleetAuth,
  name: 'get_teams',
  displayName: 'Get Teams',
  description: 'Gets many existing team',
  audience: 'both',
  aiMetadata: { description: 'Lists all teams in the Onfleet organization. Read-only and idempotent, taking no input. Use it to discover team IDs before assigning workers, hubs, or tasks; to fetch a single team by ID use get-team instead.', idempotent: true },
  props: {},
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.teams.get();
  },
});
