import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getProjectIdDropdown, getIssueIdDropdown } from '../common/props';

export const listIssueCommentsAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'list_issue_comments',
	classification: 'SEARCH',
	displayName: 'List Issue Comments',
	description: "Lists an issue's comments, newest or oldest first.",
	audience: 'both',
	aiMetadata: {
		description:
			'Returns the comments on a Jira Data Center/Server issue, ordered by creation date (ascending or descending) and capped by a limit. Use to read the discussion history of an issue. Read-only and idempotent.',
		idempotent: true,
	},
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
			description: 'Most comments to return, up to 1,000.',
			required: true,
			defaultValue: 10,
			display: 'stepper',
			min: 1,
			max: 1000,
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
			},
		});
		return response.body;
	},
});
