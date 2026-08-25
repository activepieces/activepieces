import { createAction } from '@activepieces/pieces-framework';
import { plausibleAuth } from '../..';
import { getTeams } from '../common';

export const listTeams = createAction({
  auth: plausibleAuth,
  name: 'list_teams',
  displayName: 'List Teams',
  description: 'Get a list of teams your Plausible account can access',
  audience: 'both',
  aiMetadata: { description: 'Lists the teams the authenticated Plausible account can access, with each team\'s id and name. Use to discover a team id before creating a site under a specific team. Takes no input; read-only and safe to repeat.', idempotent: true },
  props: {},
  async run(context) {
    const teams = await getTeams(context.auth.secret_text);
    return { teams };
  },
});
