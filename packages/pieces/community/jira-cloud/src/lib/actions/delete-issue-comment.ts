import { createAction, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';

export const deleteIssueCommentAction = createAction({
	auth: jiraCloudAuth,
	name: 'delete_issue_comment',
	displayName: 'Delete Issue Comment',
	description: 'Deletes a comment on a specific issue.',
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
	},
	async run(context) {
		const { issueId, commentId } = context.propsValue;
		const response = await sendJiraRequest({
			method: HttpMethod.DELETE,
			url: `issue/${issueId}/comment/${commentId}`,
			auth: context.auth,
		});
		return response.body;
	},
});
