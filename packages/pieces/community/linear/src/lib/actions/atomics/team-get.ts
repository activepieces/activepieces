import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearTeamNode } from './common';
import { TEAM_GET_QUERY } from './queries';
import { atomicTeamDetailsOutputSchema } from './output-schemas';

export const linearTeamGetAtomic = createAction({
  auth: linearAuth,
  name: 'linear_team_get',
  classification: 'READ',
  displayName: 'Get Team (AI)',
  description: 'Get one team with its issue defaults (default status, estimate, triage, cycles).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Linear team by ID with the defaults new issues get: default status, default estimate and estimation scale, and whether triage and cycles are on, plus its issue count. Use before creating issues to learn what a team expects, or to check if it has cycles. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    team_id: Property.ShortText({ displayName: 'Team ID', description: 'UUID of the team. Get it from List Teams.', required: true }),
  },
  outputSchema: atomicTeamDetailsOutputSchema,
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{ team: LinearTeamNode | null }>({
      auth,
      query: TEAM_GET_QUERY,
      variables: { id: propsValue.team_id.trim() },
    });
    if (!data.team) {
      throw new Error(`No Linear team found for ${propsValue.team_id}.`);
    }
    return atomicMappers.flattenTeamDetails(data.team);
  },
});
