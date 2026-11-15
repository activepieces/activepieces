import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';

import { countIssuesOutputSchema } from '../../output-schemas';
export const countIssuesAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'count_issues',
	classification: 'SEARCH',
	displayName: 'Count Issues',
	description: 'Returns an approximate count of issues matching a JQL query.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Return an approximate count of the issues matching a JQL query without fetching them. Use it for totals and reporting; to read the issues use Search Issues by JQL. The JQL must be bounded by at least one restriction such as a project, assignee or date clause, otherwise Jira rejects it. Read-only.',
		idempotent: true,
	},
	outputSchema: countIssuesOutputSchema,
	props: {
		jql: Property.LongText({
			displayName: 'JQL',
			description: 'A bounded JQL query, e.g. project = PROJ AND status = "In Progress".',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<{ count: number }>({
			auth,
			method: HttpMethod.POST,
			resourceUri: '/search/approximate-count',
			body: { jql: propsValue.jql },
		});
		return { count: response.count, jql: propsValue.jql };
	},
});
