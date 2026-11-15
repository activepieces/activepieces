import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';
import { jiraCommentProps } from '../common/comment-props';

import { commentOutputSchema } from '../output-schemas';
export const updateIssueCommentAction = createAction({
	auth: jiraCloudAuth,
	name: 'update_issue_comment',
	classification: 'WRITE',
	displayName: 'Update Issue Comment',
	description: 'Updates a comment on an issue.',
	audience: 'human',
	aiMetadata: {
		description:
			'Replace the body of an existing comment (by comment ID) on a Jira issue, in plain text or raw ADF JSON when the ADF flag is set. Use to correct or extend an earlier comment instead of posting a new one with Add Issue Comment. Idempotent: re-running with the same body leaves the comment unchanged.',
		idempotent: true,
	},
	outputSchema: commentOutputSchema,
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		commentId: jiraCommentProps.commentId(),
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
			key: 'target',
			display: 'section',
			label: 'Comment to Edit',
			icon: 'inbox',
			props: ['projectId', 'issueId', 'commentId'],
		},
		{
			key: 'content',
			display: 'section',
			label: 'New Text',
			icon: 'text',
			props: ['comment', 'isADF'],
		},
	],
	async run(context) {
		const { issueId, comment, commentId, isADF } = context.propsValue;

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
			method: HttpMethod.PUT,
			url: `issue/${issueId}/comment/${commentId}`,
			auth: context.auth,
			body: {
				body: commentBody,
			},
		});
		return response.body;
	},
});
