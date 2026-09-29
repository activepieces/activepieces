import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearIssueNode, linearMappers } from '../../common/mappers';
import { atomicProps } from './common';
import { ISSUE_CREATE_MUTATION } from './queries';
import { atomicIssueOutputSchema } from './output-schemas';

export const linearIssueCreateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_create',
  classification: 'WRITE',
  displayName: 'Create Issue (AI)',
  description: 'Create an issue from IDs, with optional project, cycle, parent, due date and estimate.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Linear issue in a team from plain IDs: title plus optional description (markdown), assignee, status, priority, labels, project, milestone, cycle, parent (making it a sub-issue), due date, estimate and template. Resolve IDs first with List Teams, List Workflow States, List Users, List Issue Labels, List Projects and List Cycles, and check for duplicates with Search Issues. Not idempotent: each call creates a new issue.',
    idempotent: false,
  },
  props: {
    team_id: Property.ShortText({
      displayName: 'Team ID',
      description: 'UUID of the team that owns the issue. Get it from List Teams.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Issue title, for example "Login page times out on Safari".',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Issue body in Markdown.',
      required: false,
    }),
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'UUID of the user to assign. Get it from List Users or Get Current User.',
      required: false,
    }),
    state_id: Property.ShortText({
      displayName: 'Status ID',
      description: "UUID of a workflow state of this team. Get it from List Workflow States. Leave empty for the team's default status.",
      required: false,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description: '0 none, 1 urgent, 2 high, 3 medium, 4 low.',
      required: false,
    }),
    label_ids: Property.Array({
      displayName: 'Label IDs',
      description: 'UUIDs of team or workspace labels. Get them from List Issue Labels.',
      required: false,
    }),
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'UUID of a project the team belongs to. Get it from List Projects.',
      required: false,
    }),
    project_milestone_id: Property.ShortText({
      displayName: 'Project Milestone ID',
      description: 'UUID of a milestone of that project. Get it from Get Project.',
      required: false,
    }),
    cycle_id: Property.ShortText({
      displayName: 'Cycle ID',
      description: 'UUID of a cycle of this team. Get it from List Cycles.',
      required: false,
    }),
    parent_id: Property.ShortText({
      displayName: 'Parent Issue',
      description: 'UUID or identifier (for example ENG-123) of the parent issue, to create a sub-issue.',
      required: false,
    }),
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'Date in YYYY-MM-DD format, for example 2026-10-15.',
      required: false,
    }),
    estimate: Property.Number({
      displayName: 'Estimate',
      description: "Whole number of estimate points in the team's scale, for example 3.",
      required: false,
    }),
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'UUID of an issue template of this team. Leave empty for none.',
      required: false,
    }),
  },
  outputSchema: atomicIssueOutputSchema,
  async run({ auth, propsValue }) {
    const parentId = propsValue.parent_id
      ? await linearGraphql.resolveIssueId({ auth, value: propsValue.parent_id })
      : undefined;
    const input = linearGraphql.definedOnly({
      teamId: propsValue.team_id.trim(),
      title: propsValue.title,
      description: propsValue.description,
      assigneeId: propsValue.assignee_id,
      stateId: propsValue.state_id,
      priority: atomicProps.priorityValue(propsValue.priority),
      labelIds: linearGraphql.toStringArray(propsValue.label_ids),
      projectId: propsValue.project_id,
      projectMilestoneId: propsValue.project_milestone_id,
      cycleId: propsValue.cycle_id,
      parentId,
      dueDate: linearGraphql.toTimelessDate({ value: propsValue.due_date, fieldName: 'Due Date' }),
      estimate: linearGraphql.toOptionalInteger({ value: propsValue.estimate, fieldName: 'Estimate' }),
      templateId: propsValue.template_id,
    });
    const data = await linearGraphql.request<{
      issueCreate: { success: boolean; issue: LinearIssueNode | null };
    }>({ auth, query: ISSUE_CREATE_MUTATION, variables: { input } });
    const payload = linearGraphql.requireSuccess({ payload: data.issueCreate, what: 'issue creation' });
    if (!payload.issue) {
      throw new Error('Linear did not return the created issue.');
    }
    return linearMappers.flattenIssue(payload.issue);
  },
});
