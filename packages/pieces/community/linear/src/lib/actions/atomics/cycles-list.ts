import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, linearMappers } from '../../common/mappers';
import { atomicMappers, atomicProps, LinearCycleNode } from './common';
import { CYCLES_LIST_QUERY } from './queries';
import { atomicCyclesPageOutputSchema } from './output-schemas';

export const linearCyclesListAtomic = createAction({
  auth: linearAuth,
  name: 'linear_cycles_list',
  classification: 'SEARCH',
  displayName: 'List Cycles (AI)',
  description: 'List cycles (sprints), optionally for one team and only the current, next or previous one.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Linear cycles (time-boxed sprints) with number, dates and progress, for one team or all teams, optionally only the current, next or previous cycle. Use to find the Cycle ID for Create Issue or Update Issue, for example "put this in the next cycle". Teams without cycles enabled return none. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    team_id: Property.ShortText({ displayName: 'Team ID', description: 'UUID of the team (from List Teams). Leave empty for every team.', required: false }),
    which: Property.StaticDropdown({
      displayName: 'Which Cycles',
      description: 'Leave empty for all cycles.',
      required: false,
      options: {
        options: [
          { label: 'Current cycle', value: 'isActive' },
          { label: 'Next cycle', value: 'isNext' },
          { label: 'Previous cycle', value: 'isPrevious' },
        ],
      },
    }),
    limit: atomicProps.limitProp({ fallback: 50, max: 250 }),
    cursor: atomicProps.cursorProp(),
  },
  outputSchema: atomicCyclesPageOutputSchema,
  async run({ auth, propsValue }) {
    const which = propsValue.which;
    if (which && !CYCLE_FLAGS.includes(which)) {
      throw new Error('Which Cycles must be isActive, isNext or isPrevious.');
    }
    const filter = linearGraphql.definedOnly({
      team: atomicProps.idFilter(propsValue.team_id?.trim()),
      ...(which ? { [which]: { eq: true } } : {}),
    });
    const data = await linearGraphql.request<{ cycles: LinearConnection<LinearCycleNode> }>({
      auth,
      query: CYCLES_LIST_QUERY,
      variables: {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 50, max: 250 }),
        after: propsValue.cursor || undefined,
      },
    });
    return linearMappers.toPage({ connection: data.cycles, map: atomicMappers.flattenCycle });
  },
});

const CYCLE_FLAGS = ['isActive', 'isNext', 'isPrevious'];
