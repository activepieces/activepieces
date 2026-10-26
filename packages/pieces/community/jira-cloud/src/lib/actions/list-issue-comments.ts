import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getProjectIdDropdown, getIssueIdDropdown } from '../common/props';

import { legacyCommentPageOutputSchema } from '../output-schemas';
export const listIssueCommentsAction = createAction({
	auth: jiraCloudAuth,
	name: 'list_issue_comments',
	classification: 'SEARCH',
	displayName: 'List Issue Comments',
	description: "Lists an issue's comments, newest or oldest first.",
	audience: 'human',
	aiMetadata: {
		description:
			'List comments on a Jira issue, ordered by creation date (ascending or descending) and capped at a configurable limit, including rendered HTML bodies. Use to read an issue\'s discussion before replying or summarizing. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: legacyCommentPageOutputSchema,
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		orderBy: Property.StaticDropdown({
			displayName: 'Order By',
			required: true,
			defaultValue: '-created',
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{
						label: 'Newest First',
						value: '-created',
						icon: 'calendar',
					},
					{
						label: 'Oldest First',
						value: '+created',
						icon: 'calendar',
					},
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Max Results',
			description: 'Most comments to return.',
			required: true,
			defaultValue: 10,
			display: 'stepper',
			min: 1,
			max: 5000,
			step: 1,
		}),
	},
	propertyGroups: [
		{
			key: 'issue',
			display: 'section',
			label: 'Issue',
			icon: 'inbox',
			props: ['projectId', 'issueId'],
		},
		{
			key: 'results',
			display: 'section',
			label: 'Results',
			icon: 'sliders',
			props: ['orderBy', 'limit'],
		},
	],
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
