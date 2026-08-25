import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getProjectIdDropdown, getIssueIdDropdown } from '../common/props';

export const listIssueCommentsAction = createAction({
	auth: jiraCloudAuth,
	name: 'list_issue_comments',
	displayName: 'List Issue Comments',
	description: 'Returns all comments for an issue.',
	audience: 'both',
	aiMetadata: {
		description:
			'List comments on a Jira issue, ordered by creation date (ascending or descending) and capped at a configurable limit, including rendered HTML bodies. Use to read an issue\'s discussion before replying or summarizing. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		orderBy: Property.StaticDropdown({
			displayName: 'Order By',
			required: true,
			defaultValue: '-created',
			options: {
				disabled: false,
				options: [
					{
						label: 'Created (Descending)',
						value: '-created',
					},
					{
						label: 'Created (Ascending)',
						value: '+created',
					},
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of results',
			required: true,
			defaultValue: 10,
		}),
	},
	async run(context) {
		const { issueId, orderBy, limit } = context.propsValue;

		const response = await sendJiraRequest({
			method: HttpMethod.GET,
			url: `issue/${issueId}/comment`,
			auth: context.auth,
			queryParams: {
				orderBy: orderBy,
				maxResults: limit.toString(),
				expand: 'renderedBody',
			},
		});
		return response.body;
	},
});
