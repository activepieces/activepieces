import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';
import { jiraCommentProps } from '../common/comment-props';

export const updateIssueCommentAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'update_issue_comment',
	classification: 'WRITE',
	displayName: 'Update Issue Comment',
	description: 'Updates a comment on an issue.',
	audience: 'both',
	aiMetadata: {
		description:
			'Replaces the body of an existing comment on a Jira Data Center/Server issue, identified by issue and comment ID. Use to edit a previously posted comment rather than add a new one. Idempotent — re-running with the same body leaves the comment unchanged.',
		idempotent: true,
	},
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		commentId: jiraCommentProps.commentId(),
		comment: Property.LongText({
			displayName: 'Comment Body',
			description: 'Replaces the whole comment. Plain text or Jira wiki markup.',
			required: true,
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
			props: ['comment'],
		},
	],
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
