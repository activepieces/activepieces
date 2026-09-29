import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, linearMappers } from '../../common/mappers';
import { atomicMappers, atomicRelations, atomicProps, LinearProjectNode } from './common';
import { PROJECTS_LIST_QUERY } from './queries';
import { atomicProjectsPageOutputSchema } from './output-schemas';

export const linearProjectsListAtomic = createAction({
  auth: linearAuth,
  name: 'linear_projects_list',
  classification: 'SEARCH',
  displayName: 'List Projects (AI)',
  description: 'List projects, optionally of one team, with a status type or a name fragment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Linear projects with status, lead, dates, progress and teams, optionally only those of one team, of one status type (backlog, planned, started, paused, completed, canceled) or whose name contains a text. Use to resolve a project name to its ID or to review active work. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    team_id: Property.ShortText({ displayName: 'Team ID', description: 'Only projects of this team (UUID from List Teams).', required: false }),
    status_type: Property.StaticDropdown({
      displayName: 'Status Type',
      required: false,
      options: {
        options: [
          { label: 'Backlog', value: 'backlog' },
          { label: 'Planned', value: 'planned' },
          { label: 'In progress', value: 'started' },
          { label: 'Paused', value: 'paused' },
          { label: 'Completed', value: 'completed' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
    name_contains: Property.ShortText({ displayName: 'Name Contains', description: 'Case-insensitive name fragment.', required: false }),
    include_archived: Property.Checkbox({ displayName: 'Include Archived', required: false, defaultValue: false }),
    limit: atomicProps.limitProp({ fallback: 50, max: 250 }),
    cursor: atomicProps.cursorProp(),
  },
  outputSchema: atomicProjectsPageOutputSchema,
  async run({ auth, propsValue }) {
    const teamId = propsValue.team_id?.trim();
    const nameContains = propsValue.name_contains?.trim();
    const filter = linearGraphql.definedOnly({
      accessibleTeams: teamId ? { some: { id: { eq: teamId } } } : undefined,
      status: propsValue.status_type ? { type: { eq: propsValue.status_type } } : undefined,
      name: nameContains ? { containsIgnoreCase: nameContains } : undefined,
    });
    const data = await linearGraphql.request<{ projects: LinearConnection<LinearProjectNode> }>({
      auth,
      query: PROJECTS_LIST_QUERY,
      variables: {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 50, max: 250 }),
        after: propsValue.cursor || undefined,
        includeArchived: propsValue.include_archived === true,
      },
    });
    const nodes = await atomicRelations.withAllProjectsTeams({ auth, projects: data.projects.nodes });
    return linearMappers.toPage({ connection: { ...data.projects, nodes }, map: atomicMappers.flattenProject });
  },
});
