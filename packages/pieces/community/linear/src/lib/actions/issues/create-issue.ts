import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { makeClient } from '../../common/client';
import { LinearDocument } from '@linear/sdk';

export const linearCreateIssue = createAction({
  auth: linearAuth,
  name: 'linear_create_issue',
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
    template_id: props.template_id()
  },
  async run({ auth, propsValue }) {
    const issue: LinearDocument.IssueCreateInput = {
      teamId: propsValue.team_id!,
      title: propsValue.title,
      description: propsValue.description,
      assigneeId: propsValue.assignee_id,
      stateId: propsValue.state_id,
      priority: propsValue.priority_id,
      labelIds: propsValue.labels?.length ? propsValue.labels : undefined,
      templateId: propsValue.template_id
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
