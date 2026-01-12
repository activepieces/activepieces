import { createAction, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';

export const updateIssueCommentAction = createAction({
	auth: jiraCloudAuth,
	name: 'update_issue_comment',
	displayName: 'Update Issue Comment',
	description: 'Updates a comment to a specific issue.',
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		commentId: Property.Dropdown({
			auth: jiraCloudAuth,
			displayName: 'Comment ID',
			refreshers: ['issueId'],
			required: true,
			options: async ({ auth, issueId }) => {
				if (!auth || !issueId) {
					return {
						disabled: true,
						placeholder: 'Please connect your account and select issue.',
						options: [],
					};
				}
				const response = await sendJiraRequest({
					method: HttpMethod.GET,
					url: `issue/${issueId}/comment`,
					auth: auth,
					queryParams: {
						orderBy: '-created',
						expand: 'renderedBody',
					},
				});

				return {
					disabled: false,
					options: response.body.comments.map((comment: { id: string; renderedBody: string }) => {
						return {
							label: comment.renderedBody,
							value: comment.id,
						};
					}),
				};
			},
		}),
		comment: Property.LongText({
			displayName: 'Comment Body',
			required: true,
		}),
		isADF: Property.Checkbox({
      displayName: 'Comment is in JSON Atlassian Document Format',
			description: 'https://developer.atlassian.com/cloud/jira/platform/apis/document/structure',
      required: false,
      defaultValue: false,
    }),
	},
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
