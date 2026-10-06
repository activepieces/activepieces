import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { makeClient } from '../../common/client';
import { LinearDocument } from '@linear/sdk';
import { linearGraphql } from '../../common/graphql';
import { issueMutationOutputSchema } from '../../output-schemas';

export const linearUpdateIssue = createAction({
  auth: linearAuth,
  name: 'linear_update_issue',
  classification: 'WRITE',
  displayName: 'Update Issue',
  description: 'Change an issue. Only the fields you fill in are changed.',
  audience: 'human',
  aiMetadata: {
    description: 'Updates an existing Linear issue identified by its issue ID, changing fields such as title, description, assignee, status, labels, priority, project, cycle, parent issue (its identifier such as ENG-123, its ID, or its exact title), due date (YYYY-MM-DD) or estimate (points). Use to modify an issue already created. Only the provided fields are changed; repeating the same update is idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'target', display: 'section', label: 'Issue to update', icon: 'file', props: ['team_id', 'issue_id'] },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: ['changes_info', 'title', 'description', 'state_id', 'priority_id', 'assignee_id', 'labels', 'project_id', 'due_date'],
    },
  ],
  props: {
    team_id: props.team_id(true, "The issue's team. Its issues, statuses and labels are listed."),
    issue_id: props.issue_id(),
    changes_info: Property.MarkDown({
      value: 'Empty fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    state_id: props.status_id(),
    priority_id: props.priority_id(),
    assignee_id: props.assignee_id(),
    labels: { ...props.labels(), description: "Replaces all of the issue's current labels." },
    project_id: { ...props.project_id(false), description: 'The project to move the issue to.' },
    cycle_id: { ...props.cycle_id(false), advanced: true },
    parent_id: { ...props.parent_issue_id(), advanced: true },
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'Only the day is used; the time is ignored.',
      placeholder: '2026-10-15',
      required: false,
    }),
    estimate: Property.Number({
      displayName: 'Estimate',
      description: "Points on the team's estimate scale. Needs estimates turned on.",
      required: false,
      advanced: true,
    }),
  },
  outputSchema: issueMutationOutputSchema,
  async run({ auth, propsValue }) {
    const parentId = propsValue.parent_id?.trim()
      ? await linearGraphql.resolveParentIssueId({ auth, value: propsValue.parent_id, teamId: propsValue.team_id })
      : undefined;
    const issueId = propsValue.issue_id!;
    const issue: LinearDocument.IssueUpdateInput = {
      title: propsValue.title,
      description: propsValue.description,
      assigneeId: propsValue.assignee_id,
      stateId: propsValue.state_id,
      priority: propsValue.priority_id,
      labelIds: propsValue.labels?.length ? propsValue.labels : undefined,
      ...optionalIssueFields(propsValue),
      ...(parentId ? { parentId } : {}),
    };
    const client = makeClient(auth);
    const result = await client.updateIssue(issueId, issue);
    if (result.success) {
      const updatedIssue = await result.issue;
      return {
        success: result.success,
        lastSyncId: result.lastSyncId,
        issue: updatedIssue,
      };
    } else {
      throw new Error('Linear did not update the issue.')
    }
  },
});

function optionalIssueFields(values: {
  project_id?: string;
  cycle_id?: string;
  due_date?: string;
  estimate?: number;
}) {
  return linearGraphql.definedOnly({
    projectId: values.project_id,
    cycleId: values.cycle_id,
    dueDate: linearGraphql.toTimelessDate({ value: values.due_date, fieldName: 'Due Date' }),
    estimate: linearGraphql.toOptionalInteger({ value: values.estimate, fieldName: 'Estimate' }),
  });
}
