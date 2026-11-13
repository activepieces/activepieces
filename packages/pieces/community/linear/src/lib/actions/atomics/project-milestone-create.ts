import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearMilestoneNode } from './common';
import { PROJECT_MILESTONE_CREATE_MUTATION } from './queries';
import { atomicMilestoneOutputSchema } from './output-schemas';

export const linearProjectMilestoneCreateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_milestone_create',
  classification: 'WRITE',
  displayName: 'Create Project Milestone (AI)',
  description: 'Add a milestone to a project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a milestone (a named checkpoint with an optional target date) to a Linear project; issues can then be assigned to it with Create Issue or Update Issue. Check Get Project first, which lists existing milestones, to avoid a duplicate. Not idempotent: each call adds a milestone.',
    idempotent: false,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'UUID of the project (from List Projects).', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Milestone name, for example "Beta".', required: true }),
    description: Property.LongText({ displayName: 'Description', description: 'Markdown description.', required: false }),
    target_date: Property.ShortText({ displayName: 'Target Date', description: 'YYYY-MM-DD, for example 2026-11-30.', required: false }),
  },
  outputSchema: atomicMilestoneOutputSchema,
  async run({ auth, propsValue }) {
    const input = linearGraphql.definedOnly({
      projectId: propsValue.project_id.trim(),
      name: propsValue.name,
      description: propsValue.description,
      targetDate: linearGraphql.toTimelessDate({ value: propsValue.target_date, fieldName: 'Target Date' }),
    });
    const data = await linearGraphql.request<{
      projectMilestoneCreate: { success: boolean; projectMilestone: LinearMilestoneNode };
    }>({ auth, query: PROJECT_MILESTONE_CREATE_MUTATION, variables: { input } });
    const payload = linearGraphql.requireSuccess({ payload: data.projectMilestoneCreate, what: 'milestone creation' });
    return atomicMappers.flattenMilestone(payload.projectMilestone);
  },
});
