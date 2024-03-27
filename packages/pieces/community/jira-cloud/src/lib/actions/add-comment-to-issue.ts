import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';

export const addCommentToIssueAction = createAction({
	auth: jiraCloudAuth,
	name: 'add_issue_comment',
	displayName: 'Add Issue Comment',
	description: 'Adds a comment to an issue.',
	props: {
		issueId: Property.ShortText({
			displayName: 'Issue ID or Key',
			required: true,
		}),
		comment: Property.LongText({
			displayName: 'Comment Body',
			required: true,
		}),
	},
	async run(context) {
		const { issueId, comment } = context.propsValue;
		const commentBody = {
			version: 1,
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: comment,
						},
					],
				},
			],
		};
		const response = await sendJiraRequest({
			method: HttpMethod.POST,
			url: `issue/${issueId}/comment`,
			auth: context.auth,
			body: {
				body: commentBody,
			},
		});
		return response.body;
	},
});
