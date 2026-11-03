import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, atomicRelations, atomicProps, LinearProjectNode } from './common';
import { PROJECT_UPDATE_MUTATION } from './queries';
import { atomicProjectOutputSchema } from './output-schemas';

export const linearProjectUpdateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_update',
  classification: 'WRITE',
  displayName: 'Update Project (AI)',
  description: 'Change only the project fields you pass. Teams are only changed when Team IDs is given.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Partially edits a Linear project (name, summary, lead, priority, status, dates, icon, color): only the fields you pass change. The team list is only touched when Team IDs is given, and then it replaces the whole list. To post a progress report use Post Project Status Update instead; to empty the lead or a date list it in Clear Fields. Idempotent: repeating the same update leaves the project in the same state. teams_complete is false when Linear did not return every team page; team_ids and team_names then hold only the teams read.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'UUID of the project (from List Projects).', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.ShortText({ displayName: 'Summary', description: 'Short one-line summary.', required: false }),
    lead_id: Property.ShortText({ displayName: 'Lead ID', description: 'UUID of the new lead (from List Users).', required: false }),
    priority: Property.Number({ displayName: 'Priority', description: '0 none, 1 urgent, 2 high, 3 medium, 4 low.', required: false }),
    status_id: Property.ShortText({ displayName: 'Status ID', description: 'UUID of a project status.', required: false }),
    start_date: Property.ShortText({ displayName: 'Start Date', description: 'YYYY-MM-DD.', required: false }),
    target_date: Property.ShortText({ displayName: 'Target Date', description: 'YYYY-MM-DD.', required: false }),
    icon: Property.ShortText({ displayName: 'Icon', required: false }),
    color: Property.ShortText({ displayName: 'Color', description: 'Hex color, for example #5E6AD2.', required: false }),
    team_ids: Property.Array({ displayName: 'Team IDs (replace all)', description: 'Replaces the teams of the project with exactly these team UUIDs. Leave empty to keep the current teams.', required: false }),
    clear_fields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to empty on the project. A field listed here must not also be given a value.',
      required: false,
      options: {
        options: [
          { label: 'Lead', value: 'leadId' },
          { label: 'Start date', value: 'startDate' },
          { label: 'Target date', value: 'targetDate' },
        ],
      },
    }),
  },
  outputSchema: atomicProjectOutputSchema,
  async run({ auth, propsValue }) {
    const set = linearGraphql.definedOnly({
      name: propsValue.name,
      description: propsValue.description,
      leadId: propsValue.lead_id,
      priority: atomicProps.priorityValue(propsValue.priority),
      statusId: propsValue.status_id,
      startDate: linearGraphql.toTimelessDate({ value: propsValue.start_date, fieldName: 'Start Date' }),
      targetDate: linearGraphql.toTimelessDate({ value: propsValue.target_date, fieldName: 'Target Date' }),
      icon: propsValue.icon,
      color: propsValue.color,
      teamIds: linearGraphql.toStringArray(propsValue.team_ids),
    });
    const cleared = linearGraphql.toStringArray(propsValue.clear_fields) ?? [];
    const conflicts = cleared.filter((field) => field in set);
    if (conflicts.length > 0) {
      throw new Error(`These fields are both set and cleared: ${conflicts.join(', ')}. Pick one.`);
    }
    const input = { ...set, ...Object.fromEntries(cleared.map((field) => [field, null])) };
    if (Object.keys(input).length === 0) {
      throw new Error('Nothing to update: pass at least one field to change or clear.');
    }
    const data = await linearGraphql.request<{
      projectUpdate: { success: boolean; project: LinearProjectNode | null };
    }>({ auth, query: PROJECT_UPDATE_MUTATION, variables: { id: propsValue.project_id.trim(), input } });
    const payload = linearGraphql.requireSuccess({ payload: data.projectUpdate, what: 'project update' });
    if (!payload.project) {
      throw new Error('Linear did not return the updated project.');
    }
    return atomicMappers.flattenProject(await atomicRelations.withAllProjectTeams({ auth, project: payload.project }));
  },
});
