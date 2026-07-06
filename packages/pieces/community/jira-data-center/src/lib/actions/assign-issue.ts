import { createAction } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown, getUsersDropdown } from '../common/props';

export const assignIssueAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'assign_issue',
	displayName: 'Assign Issue',
	description: 'Assigns an issue to a user.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sets the assignee of a Jira Data Center/Server issue to a chosen user. Use to (re)assign an issue to a specific person; the assignee is provided as a Jira username. Idempotent — assigning the same user repeatedly leaves the issue on that assignee.',
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
				name: assignee,
			},
		});
		return response.body;
	},
});
