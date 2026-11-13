import { createAction } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';
import { jiraCommentProps } from '../common/comment-props';

export const deleteIssueCommentAction = createAction({
	auth: jiraCloudAuth,
	name: 'delete_issue_comment',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Issue Comment',
	description: 'Deletes a comment on a specific issue.',
	audience: 'human',
	aiMetadata: {
		description:
			'Permanently remove a specific comment (by comment ID) from a Jira issue. Use to clean up an outdated or incorrect comment; the deletion cannot be undone. Idempotent in effect — the comment ends up gone either way — though a repeat call on an already-deleted comment returns a not-found error.',
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
