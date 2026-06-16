import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { jiraCloudAuth } from '../../auth';
import { jiraApiCall } from '../common';
import {
  getIssueIdDropdown,
  getProjectIdDropdown,
  issueStatusIdProp,
} from '../common/props';

export const transitionIssueAction = createAction({
  auth: jiraCloudAuth,
  name: 'transition_issue',
  displayName: 'Transition Issue',
  description:
    'Moves an issue to a new status by executing a workflow transition.',
  audience: 'both',
  aiMetadata: {
    description:
      'Execute a workflow transition on a Jira issue to move it to a new status (e.g. In Progress to Done), returning the refreshed issue. The transition must be valid from the issue\'s current status under its workflow, so it is not idempotent: re-running after the move succeeds fails because the transition is no longer available.',
    idempotent: false,
  },
  props: {
    projectId: getProjectIdDropdown(),
    issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
    transitionId: issueStatusIdProp('Transition', true),
  },
  async run(context) {
    const { issueId, transitionId } = context.propsValue;

    if (isNil(issueId) || isNil(transitionId)) {
      throw new Error('Issue and Transition are required');
    }

    const body: Record<string, unknown> = {
      transition: { id: transitionId },
    };

    await jiraApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/issue/${issueId}/transitions`,
      body,
    });

    const issue = await jiraApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `/issue/${issueId}`,
    });

    return { success: true, issue };
  },
});
