import { createAction } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';
import { jiraCommentProps } from '../common/comment-props';

export const deleteIssueCommentAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'delete_issue_comment',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Issue Comment',
	description: 'Deletes a comment from an issue.',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently deletes a specific comment from a Jira Data Center/Server issue, identified by issue and comment ID. Use to remove a comment that was posted in error. Idempotent on its target — once the comment is gone, the end state is unchanged by repeating.',
		idempotent: true,
	},
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		commentId: jiraCommentProps.commentId(),
	},
	propertyGroups: [
		{
			key: 'target',
			display: 'section',
			label: 'Comment to Delete',
			icon: 'trash',
			props: ['projectId', 'issueId', 'commentId'],
		},
	],
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
