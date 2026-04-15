import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';

export const updateIssueCommentAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'update_issue_comment',
	displayName: 'Update Issue Comment',
	description: 'Updates a comment to a specific issue.',
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		commentId: Property.Dropdown({
			auth: jiraDataCenterAuth,
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
					},
				});

				return {
					disabled: false,
					options: (response.body as { comments: Array<{ id: string; body: string }> }).comments.map(
						(comment) => {
							return {
								label: comment.body?.substring(0, 100) ?? comment.id,
								value: comment.id,
							};
						},
					),
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

		const response = await sendJiraRequest({
			method: HttpMethod.PUT,
			url: `issue/${issueId}/comment/${commentId}`,
			auth: context.auth,
			body: {
				body: comment,
			},
		});
		return response.body;
	},
});
