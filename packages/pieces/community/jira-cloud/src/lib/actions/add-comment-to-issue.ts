import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';

import { commentOutputSchema } from '../output-schemas';
export const addCommentToIssueAction = createAction({
	auth: jiraCloudAuth,
	name: 'add_issue_comment',
	classification: 'WRITE',
	displayName: 'Add Issue Comment',
	description: 'Adds a comment to an issue.',
	audience: 'human',
	aiMetadata: {
		description:
			'Post a new comment on an existing Jira issue. Accepts plain text by default, or raw Atlassian Document Format (ADF) JSON when the ADF flag is set — use the Markdown to Jira Format action to produce ADF from markdown. Not idempotent: each run appends another comment.',
		idempotent: false,
	},
	outputSchema: commentOutputSchema,
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		comment: Property.LongText({
			displayName: 'Comment Body',
			required: true,
		}),
		isADF: Property.Checkbox({
			displayName: 'Body Is ADF JSON',
			description: 'Turn on if the body is Atlassian Document Format JSON.',
			required: false,
			defaultValue: false,
		}),
	},
	propertyGroups: [
		{
			key: 'issue',
			display: 'section',
			label: 'Issue',
			icon: 'inbox',
			props: ['projectId', 'issueId'],
		},
		{
			key: 'comment',
			display: 'section',
			label: 'Comment',
			icon: 'text',
			props: ['comment', 'isADF'],
		},
	],
	async run(context) {
		const { issueId, comment, isADF } = context.propsValue;

		let commentBody = {}

		if (isADF) {
			commentBody = JSON.parse(comment);
		} else {
			commentBody = {
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
		}

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
