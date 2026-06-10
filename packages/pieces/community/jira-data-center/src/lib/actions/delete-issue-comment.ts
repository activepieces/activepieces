import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { JiraDataCenterAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';

export const deleteIssueCommentAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'delete_issue_comment',
	displayName: 'Delete Issue Comment',
	description: 'Deletes a comment on a specific issue.',
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
					auth: auth as JiraDataCenterAuth,
					queryParams: {
						orderBy: '-created',
					},
				});

				return {
					disabled: false,
					options: response.body.comments.map((comment: { id: string; body: string }) => {
						return {
							label: comment.body?.substring(0, 100) ?? comment.id,
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
