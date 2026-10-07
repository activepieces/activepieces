import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, linearMappers } from '../../common/mappers';
import { atomicMappers, atomicProps, LinearTeamNode } from './common';
import { TEAMS_LIST_QUERY } from './queries';
import { atomicTeamsPageOutputSchema } from './output-schemas';

export const linearTeamsListAtomic = createAction({
  auth: linearAuth,
  name: 'linear_teams_list',
  classification: 'SEARCH',
  displayName: 'List Teams (AI)',
  description: 'List the teams the connected user can access, with IDs and keys.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Linear teams the API key can access, with ID, key (the ENG in ENG-123) and settings such as cycles and triage. This is the first call to resolve a team name or key to the Team ID that most other actions need. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    include_archived: Property.Checkbox({ displayName: 'Include Archived Teams', required: false, defaultValue: false }),
    limit: atomicProps.limitProp({ fallback: 100, max: 250 }),
    cursor: atomicProps.cursorProp(),
  },
  outputSchema: atomicTeamsPageOutputSchema,
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{ teams: LinearConnection<LinearTeamNode> }>({
      auth,
      query: TEAMS_LIST_QUERY,
      variables: {
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 100, max: 250 }),
        after: propsValue.cursor || undefined,
        includeArchived: propsValue.include_archived === true,
      },
    });
    return linearMappers.toPage({ connection: data.teams, map: atomicMappers.flattenTeam });
  },
});
