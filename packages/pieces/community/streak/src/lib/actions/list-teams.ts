import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { teamListOutputSchema } from '../common/output-schemas';
import { StreakTeamsResponse } from '../common/types';

export const listTeamsAction = createAction({
  auth: streakAuth,
  name: 'list_teams',
  classification: 'SEARCH',
  displayName: 'List Teams',
  description: 'List the teams the connected user belongs to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the Streak teams the connected user belongs to, returning each team_key and name. Use to get the team_key needed by Create or Find Contact and Create or Find Organization. Read-only and idempotent; takes no input.',
    idempotent: true,
  },
  outputSchema: teamListOutputSchema,
  props: {},
  async run(context) {
    const response = await streakApiCall<StreakTeamsResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/v2/users/me/teams',
    });
    return (response.body?.results ?? []).map((t) => ({
      team_key: t.key,
      name: t.name,
    }));
  },
});
