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
					auth: auth as PiecePropValueSchema<typeof jiraCloudAuth>,
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
	},
	async run(context) {
		const { issueId, comment, commentId } = context.propsValue;
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
