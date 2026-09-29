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
  description: 'Create a new issue in Linear workspace',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a new issue in a Linear team, with optional assignee, status, labels, priority, and template. Use to file a task, bug, or work item. Requires a team ID and title; not idempotent, each call creates a distinct issue.',
    idempotent: false,
  },
  props: {
    team_id: props.team_id(),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    state_id: props.status_id(),
    labels: props.labels(),
    assignee_id: props.assignee_id(),
    priority_id: props.priority_id(),
    template_id: props.template_id(),
    project_id: props.project_id(false),
    cycle_id: props.cycle_id(false),
    parent_id: props.parent_issue_id(),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'Only the date part is used, for example 2026-10-15.',
      required: false,
    }),
    estimate: Property.Number({
      displayName: 'Estimate',
      description: "Estimate in the team's estimation points, for example 3. The team must have estimates enabled.",
      required: false,
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
      throw new Error(`Unexpected error: ${result}`)
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
