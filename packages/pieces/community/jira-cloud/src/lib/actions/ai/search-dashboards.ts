import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraPageBean, JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { dashboardsOutputSchema } from '../../output-schemas';
export const searchDashboardsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'search_dashboards',
	classification: 'SEARCH',
	displayName: 'Search Dashboards',
	description: 'Searches the dashboards visible to the user.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Search the dashboards visible to the connected user by name or owner, returning each dashboard ID, name, owner and view URL. Read-only.',
		idempotent: true,
	},
	outputSchema: dashboardsOutputSchema,
	props: {
		dashboardName: Property.ShortText({
			displayName: 'Dashboard Name',
			description: 'Only return dashboards whose name contains this text (case-insensitive).',
			required: false,
		}),
		ownerAccountId: Property.ShortText({
			displayName: 'Owner Account ID',
			description: 'Only return dashboards owned by this user. Resolve it with Find Users.',
			required: false,
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults({ max: 100 }),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<JiraPageBean<JiraRecord>>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/dashboard/search',
			query: {
				dashboardName: propsValue.dashboardName,
				accountId: propsValue.ownerAccountId,
				startAt: propsValue.startAt,
				maxResults: propsValue.maxResults,
				expand: 'description,owner,viewUrl,favourite',
			},
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
