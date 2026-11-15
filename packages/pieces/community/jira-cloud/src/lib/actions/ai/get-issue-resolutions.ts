import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraPageBean, JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { resolutionsOutputSchema } from '../../output-schemas';
export const getIssueResolutionsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_issue_resolutions',
	classification: 'SEARCH',
	displayName: 'Get Issue Resolutions',
	description: 'Lists the issue resolutions configured in Jira.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the issue resolutions configured on the site (e.g. Done, Won\'t Do, Duplicate) with their IDs. Use it to find the resolution ID a transition screen requires when closing an issue with Transition Issue Status. Read-only.',
		idempotent: true,
	},
	outputSchema: resolutionsOutputSchema,
	props: {
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults(),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<JiraPageBean<JiraRecord>>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/resolution/search',
			query: { startAt: propsValue.startAt, maxResults: propsValue.maxResults },
		});
		return jiraAiHelpers.toPage({
			items: response.values ?? [],
			startAt: response.startAt,
			maxResults: response.maxResults,
			total: response.total,
			isLast: response.isLast,
		});
	},
});
