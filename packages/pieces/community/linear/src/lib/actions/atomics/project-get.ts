import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearProjectNode } from './common';
import { PROJECT_GET_QUERY } from './queries';
import { atomicProjectDetailsOutputSchema } from './output-schemas';

export const linearProjectGetAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_get',
  classification: 'READ',
  displayName: 'Get Project (AI)',
  description: 'Get one project with its teams, lead, status and milestones.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Linear project by ID with status, health, progress, dates, lead, teams and its milestones (the Milestone IDs Create Issue accepts). Use when the project is known; use List Projects to find it by name or team. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'UUID of the project (from List Projects).', required: true }),
  },
  outputSchema: atomicProjectDetailsOutputSchema,
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{ project: LinearProjectNode | null }>({
      auth,
      query: PROJECT_GET_QUERY,
      variables: { id: propsValue.project_id.trim() },
    });
    if (!data.project) {
      throw new Error(`No Linear project found for ${propsValue.project_id}.`);
    }
    return atomicMappers.flattenProjectWithMilestones(data.project);
  },
});
