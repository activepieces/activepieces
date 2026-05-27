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
