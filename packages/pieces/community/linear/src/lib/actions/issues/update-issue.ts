import { createAction, Property } from '@activepieces/pieces-framework';
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
  description: 'Update a issue in Linear Workspace',
  audience: 'human',
  aiMetadata: {
    description: 'Updates an existing Linear issue identified by its issue ID, changing fields such as title, description, assignee, status, labels, priority, project, cycle, parent issue (its identifier such as ENG-123, its ID, or its exact title), due date (YYYY-MM-DD) or estimate (points). Use to modify an issue already created. Only the provided fields are changed; repeating the same update is idempotent.',
    idempotent: true,
  },
  props: {
    team_id: props.team_id(),
    issue_id: props.issue_id(),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    state_id: props.status_id(),
    labels: props.labels(),
    assignee_id: props.assignee_id(),
    priority_id: props.priority_id(),
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
