import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, linearMappers } from '../../common/mappers';
import { atomicMappers, atomicProps, LinearWorkflowStateNode } from './common';
import { WORKFLOW_STATES_LIST_QUERY } from './queries';
import { atomicWorkflowStatesPageOutputSchema } from './output-schemas';

export const linearWorkflowStatesListAtomic = createAction({
  auth: linearAuth,
  name: 'linear_workflow_states_list',
  classification: 'SEARCH',
  displayName: 'List Workflow States (AI)',
  description: 'List the issue statuses (Backlog, Todo, In Progress, Done...) of a team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists issue workflow states (statuses such as Backlog, Todo, In Progress, Done, Canceled) with IDs and type, for one team or all teams. Statuses belong to a team, so filter by the issue\'s team to get a valid Status ID for Create Issue or Update Issue. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    team_id: Property.ShortText({ displayName: 'Team ID', description: 'UUID of the team (from List Teams). Leave empty for every team.', required: false }),
    limit: atomicProps.limitProp({ fallback: 100, max: 250 }),
    cursor: atomicProps.cursorProp(),
  },
  outputSchema: atomicWorkflowStatesPageOutputSchema,
  async run({ auth, propsValue }) {
    const team = atomicProps.idFilter(propsValue.team_id?.trim());
    const data = await linearGraphql.request<{ workflowStates: LinearConnection<LinearWorkflowStateNode> }>({
      auth,
      query: WORKFLOW_STATES_LIST_QUERY,
      variables: {
        filter: team ? { team } : undefined,
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 100, max: 250 }),
        after: propsValue.cursor || undefined,
      },
    });
    return linearMappers.toPage({ connection: data.workflowStates, map: atomicMappers.flattenWorkflowState });
  },
});
