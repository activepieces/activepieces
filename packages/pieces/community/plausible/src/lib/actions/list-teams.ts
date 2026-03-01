import { createAction } from '@activepieces/pieces-framework';
import { plausibleAuth } from '../..';
import { getTeams } from '../common';

export const listTeams = createAction({
  auth: plausibleAuth,
  name: 'list_teams',
  displayName: 'List Teams',
  description: 'Get a list of teams your Plausible account can access',
  props: {},
  async run(context) {
    const teams = await getTeams(context.auth.secret_text);
    return { teams };
  },
});
