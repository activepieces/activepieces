import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { LinearAuth, linearGraphql } from '../../common/graphql';
import { LinearIssueNode, linearMappers } from '../../common/mappers';
import { atomicProps } from './common';
import { ISSUE_UPDATE_MUTATION } from './queries';
import { atomicIssueOutputSchema } from './output-schemas';

export const linearIssueUpdateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_update',
  classification: 'WRITE',
  displayName: 'Update Issue (AI)',
  description: 'Change only the fields you pass on an issue; labels can be replaced, added or removed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Partially updates one Linear issue (UUID or identifier like ENG-123): only the fields you pass change and everything else is left as it is. Labels have three modes: Label IDs replaces the whole set, Add Label IDs and Remove Label IDs change it incrementally; to empty a field such as the assignee, due date or project, list it in Clear Fields. Idempotent: repeating the same update leaves the issue in the same state. labels_complete is false when Linear did not return every label page; label_ids and label_names then hold only the labels read.',
    idempotent: true,
  },
  props: {
    issue_id: Property.ShortText({
      displayName: 'Issue',
      description: 'UUID or identifier of the issue, for example ENG-123.',
      required: true,
    }),
    title: Property.ShortText({ displayName: 'Title', description: 'New title.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'New body in Markdown. Replaces the current description.', required: false }),
    assignee_id: Property.ShortText({ displayName: 'Assignee ID', description: 'UUID of the new assignee. Get it from List Users.', required: false }),
    state_id: Property.ShortText({ displayName: 'Status ID', description: "UUID of a workflow state of the issue's team. Get it from List Workflow States.", required: false }),
    priority: Property.Number({ displayName: 'Priority', description: '0 none, 1 urgent, 2 high, 3 medium, 4 low.', required: false }),
    label_ids: Property.Array({ displayName: 'Label IDs (replace all)', description: 'Replaces every label on the issue with exactly these label UUIDs. Cannot be combined with Add or Remove Label IDs.', required: false }),
    add_label_ids: Property.Array({ displayName: 'Add Label IDs', description: 'Label UUIDs to add, keeping the current labels.', required: false }),
    remove_label_ids: Property.Array({ displayName: 'Remove Label IDs', description: 'Label UUIDs to remove, keeping the other labels.', required: false }),
    team_id: Property.ShortText({ displayName: 'Move to Team ID', description: 'UUID of another team to move the issue to. Leave empty to keep the team.', required: false }),
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'UUID of the project to move the issue into.', required: false }),
    project_milestone_id: Property.ShortText({ displayName: 'Project Milestone ID', description: 'UUID of a milestone of the project.', required: false }),
    cycle_id: Property.ShortText({ displayName: 'Cycle ID', description: 'UUID of a cycle of the team. Get it from List Cycles.', required: false }),
    parent_id: Property.ShortText({ displayName: 'Parent Issue', description: 'UUID or identifier of the new parent issue.', required: false }),
    due_date: Property.ShortText({ displayName: 'Due Date', description: 'Date in YYYY-MM-DD format, for example 2026-10-15.', required: false }),
    estimate: Property.Number({ displayName: 'Estimate', description: 'Whole number of estimate points.', required: false }),
    clear_fields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to empty on the issue. A field listed here must not also be given a new value.',
      required: false,
      options: {
        options: [
          { label: 'Assignee', value: 'assigneeId' },
          { label: 'Description', value: 'description' },
          { label: 'Due date', value: 'dueDate' },
          { label: 'Estimate', value: 'estimate' },
          { label: 'Project', value: 'projectId' },
          { label: 'Project milestone', value: 'projectMilestoneId' },
          { label: 'Cycle', value: 'cycleId' },
          { label: 'Parent issue', value: 'parentId' },
          { label: 'All labels', value: 'labelIds' },
        ],
      },
    }),
  },
  outputSchema: atomicIssueOutputSchema,
  async run({ auth, propsValue }) {
    const id = await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id });
    const input = await buildIssueUpdateInput({ auth, values: propsValue });
    const data = await linearGraphql.request<{
      issueUpdate: { success: boolean; issue: LinearIssueNode | null };
    }>({ auth, query: ISSUE_UPDATE_MUTATION, variables: { id, input } });
    const payload = linearGraphql.requireSuccess({ payload: data.issueUpdate, what: 'issue update' });
    if (!payload.issue) {
      throw new Error('Linear did not return the updated issue.');
    }
    return linearMappers.flattenIssue(await linearGraphql.withAllIssueLabels({ auth, issue: payload.issue }));
  },
});

export async function buildIssueUpdateInput({
  auth,
  values,
}: {
  auth: LinearAuth;
  values: IssueUpdateValues;
}): Promise<Record<string, unknown>> {
  const labelIds = linearGraphql.toStringArray(values.label_ids);
  const addedLabelIds = linearGraphql.toStringArray(values.add_label_ids);
  const removedLabelIds = linearGraphql.toStringArray(values.remove_label_ids);
  if (labelIds && (addedLabelIds || removedLabelIds)) {
    throw new Error('Use either Label IDs (replace all) or Add/Remove Label IDs, not both.');
  }
  const parentId = values.parent_id
    ? await linearGraphql.resolveIssueId({ auth, value: values.parent_id })
    : undefined;
  const set = linearGraphql.definedOnly({
    title: values.title,
    description: values.description,
    assigneeId: values.assignee_id,
    stateId: values.state_id,
    priority: atomicProps.priorityValue(values.priority),
    labelIds,
    addedLabelIds,
    removedLabelIds,
    teamId: values.team_id,
    projectId: values.project_id,
    projectMilestoneId: values.project_milestone_id,
    cycleId: values.cycle_id,
    parentId,
    dueDate: linearGraphql.toTimelessDate({ value: values.due_date, fieldName: 'Due Date' }),
    estimate: linearGraphql.toOptionalInteger({ value: values.estimate, fieldName: 'Estimate' }),
  });
  const cleared = linearGraphql.toStringArray(values.clear_fields) ?? [];
  const conflicts = cleared.filter((field) => field in set || (field === 'labelIds' && (addedLabelIds || removedLabelIds)));
  if (conflicts.length > 0) {
    throw new Error(`These fields are both set and cleared: ${conflicts.join(', ')}. Pick one.`);
  }
  const clears = Object.fromEntries(cleared.map((field) => [field, field === 'labelIds' ? [] : null]));
  const input = { ...set, ...clears };
  if (Object.keys(input).length === 0) {
    throw new Error('Nothing to update: pass at least one field to change or clear.');
  }
  return input;
}

type IssueUpdateValues = {
  title?: string;
  description?: string;
  assignee_id?: string;
  state_id?: string;
  priority?: number;
  label_ids?: unknown[];
  add_label_ids?: unknown[];
  remove_label_ids?: unknown[];
  team_id?: string;
  project_id?: string;
  project_milestone_id?: string;
  cycle_id?: string;
  parent_id?: string;
  due_date?: string;
  estimate?: number;
  clear_fields?: string[];
};
