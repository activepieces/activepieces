import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { makeClient } from '../../common/client';
import { LinearDocument } from '@linear/sdk';
import { linearGraphql } from '../../common/graphql';
import { issueMutationOutputSchema } from '../../output-schemas';

export const linearCreateIssue = createAction({
  auth: linearAuth,
  name: 'linear_create_issue',
  classification: 'WRITE',
  displayName: 'Create Issue',
  description: 'Create an issue in a Linear team.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a new issue in a Linear team, with optional assignee, status, labels, priority, template, project, cycle, parent issue (its identifier such as ENG-123, its ID, or its exact title), due date (YYYY-MM-DD) and estimate (points). Use to file a task, bug, or work item. Requires a team ID and title; not idempotent, each call creates a distinct issue.',
    idempotent: false,
  },
  props: {
    team_id: props.team_id(true, 'The team the issue is created in.'),
    title: Property.ShortText({
      displayName: 'Title',
      placeholder: 'Fix login timeout on Safari',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Markdown is supported.',
      required: false,
    }),
    state_id: props.status_id(),
    labels: props.labels(),
    assignee_id: props.assignee_id(),
    priority_id: props.priority_id(),
    template_id: { ...props.template_id(), advanced: true },
    project_id: { ...props.project_id(false), description: 'The project to add the issue to.' },
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
    const issue: LinearDocument.IssueCreateInput = {
      teamId: propsValue.team_id!,
      title: propsValue.title,
      description: propsValue.description,
      assigneeId: propsValue.assignee_id,
      stateId: propsValue.state_id,
      priority: propsValue.priority_id,
      labelIds: propsValue.labels?.length ? propsValue.labels : undefined,
      templateId: propsValue.template_id,
      ...optionalIssueFields(propsValue),
      ...(parentId ? { parentId } : {}),
    };
    const client = makeClient(auth);
    const result = await client.createIssue(issue);
    if (result.success) {
      const createdIssue = await result.issue;
      return {
        success: result.success,
        lastSyncId: result.lastSyncId,
        issue: createdIssue,
      };
    } else {
      throw new Error('Linear did not create the issue.')
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
