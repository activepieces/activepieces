import { createAction } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown, getUsersDropdown } from '../common/props';

export const assignIssueAction = createAction({
	auth: jiraCloudAuth,
	name: 'assign_issue',
	displayName: 'Assign Issue',
	description: 'Assigns an issue to a user.',
	audience: 'both',
	aiMetadata: {
		description:
			'Set the assignee of an existing Jira issue to a chosen user, replacing any current assignee. Use to route ownership of an issue; it changes only the assignee field, nothing else. Idempotent: assigning the same user again leaves the issue unchanged.',
		idempotent: true,
	},
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		assignee: getUsersDropdown({
			displayName: 'Assignee',
			refreshers: ['projectId'],
			required: true,
		}),
	},
	async run(context) {
		const { issueId, assignee } = context.propsValue;
		const response = await sendJiraRequest({
			method: HttpMethod.PUT,
			url: `issue/${issueId}/assignee`,
			auth: context.auth,
			body: {
				accountId: assignee,
			},
		});
		return response.body;
	},
});
