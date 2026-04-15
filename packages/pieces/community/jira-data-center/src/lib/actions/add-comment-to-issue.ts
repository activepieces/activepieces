import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';

export const addCommentToIssueAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'add_issue_comment',
	displayName: 'Add Issue Comment',
	description: 'Adds a comment to an issue.',
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		comment: Property.LongText({
			displayName: 'Comment Body',
			required: true,
		}),
	},
	async run(context) {
		const { issueId, comment } = context.propsValue;

		const response = await sendJiraRequest({
			method: HttpMethod.POST,
			url: `issue/${issueId}/comment`,
			auth: context.auth,
			body: {
				body: comment,
			},
		});
		return response.body;
	},
});
