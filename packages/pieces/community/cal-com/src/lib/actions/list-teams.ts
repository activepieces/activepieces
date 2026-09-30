import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';

export const calcomListTeams = createAction({
  auth: calcomAuth,
  name: 'calcom_list_teams',
  classification: 'SEARCH',
  displayName: 'List Teams',
  description: 'List the teams the connected Cal.com user belongs to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the authenticated user\'s teams, with their ids. Use to resolve a team id for filtering List Bookings by team.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const { auth } = context;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/teams',
    });
  },
});
