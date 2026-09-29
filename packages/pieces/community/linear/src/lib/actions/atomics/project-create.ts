import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, atomicProps, LinearProjectNode } from './common';
import { PROJECT_CREATE_MUTATION } from './queries';
import { atomicProjectOutputSchema } from './output-schemas';

export const linearProjectCreateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_create',
  classification: 'WRITE',
  displayName: 'Create Project (AI)',
  description: 'Create a project for one or more teams.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Linear project shared by one or more teams, with optional description, lead, priority, status, start and target dates (YYYY-MM-DD), icon and color. Use to set up a new body of work; check List Projects first to avoid a duplicate, and use Create Project Milestone and Post Project Status Update afterwards. Not idempotent: each call creates a new project.',
    idempotent: false,
  },
  props: {
    team_ids: Property.Array({ displayName: 'Team IDs', description: 'UUIDs of the teams the project belongs to (from List Teams). At least one.', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Project name, for example "Website relaunch".', required: true }),
    description: Property.ShortText({ displayName: 'Summary', description: 'Short one-line summary shown under the project name.', required: false }),
    lead_id: Property.ShortText({ displayName: 'Lead ID', description: 'UUID of the project lead (from List Users).', required: false }),
    priority: Property.Number({ displayName: 'Priority', description: '0 none, 1 urgent, 2 high, 3 medium, 4 low.', required: false }),
    status_id: Property.ShortText({ displayName: 'Status ID', description: 'UUID of a project status. Leave empty for the default status.', required: false }),
    start_date: Property.ShortText({ displayName: 'Start Date', description: 'YYYY-MM-DD, for example 2026-10-01.', required: false }),
    target_date: Property.ShortText({ displayName: 'Target Date', description: 'YYYY-MM-DD, for example 2026-12-15.', required: false }),
    icon: Property.ShortText({ displayName: 'Icon', description: 'Linear icon name, for example "Rocket".', required: false }),
    color: Property.ShortText({ displayName: 'Color', description: 'Hex color, for example #5E6AD2.', required: false }),
  },
  outputSchema: atomicProjectOutputSchema,
  async run({ auth, propsValue }) {
    const teamIds = linearGraphql.toStringArray(propsValue.team_ids);
    if (!teamIds) {
      throw new Error('Team IDs needs at least one team UUID.');
    }
    const input = linearGraphql.definedOnly({
      teamIds,
      name: propsValue.name,
      description: propsValue.description,
      leadId: propsValue.lead_id,
      priority: atomicProps.priorityValue(propsValue.priority),
      statusId: propsValue.status_id,
      startDate: linearGraphql.toTimelessDate({ value: propsValue.start_date, fieldName: 'Start Date' }),
      targetDate: linearGraphql.toTimelessDate({ value: propsValue.target_date, fieldName: 'Target Date' }),
      icon: propsValue.icon,
      color: propsValue.color,
    });
    const data = await linearGraphql.request<{
      projectCreate: { success: boolean; project: LinearProjectNode | null };
    }>({ auth, query: PROJECT_CREATE_MUTATION, variables: { input } });
    const payload = linearGraphql.requireSuccess({ payload: data.projectCreate, what: 'project creation' });
    if (!payload.project) {
      throw new Error('Linear did not return the created project.');
    }
    return atomicMappers.flattenProject(payload.project);
  },
});
