import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraPageBean, JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { filterPageOutputSchema } from '../../output-schemas';
export const searchFiltersAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'search_filters',
	classification: 'SEARCH',
	displayName: 'Search Filters',
	description: 'Searches the saved filters visible to the user.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Search the saved filters visible to the connected user by name or owner, returning each filter ID, name, owner, JQL and view URL. Use the returned JQL with Search Issues by JQL, or the filter ID with Create Board; for only the user\'s starred filters use Get Favorite Filters. Read-only.',
		idempotent: true,
	},
	outputSchema: filterPageOutputSchema,
	props: {
		filterName: Property.ShortText({
			displayName: 'Filter Name',
			description: 'Only return filters whose name contains this text (case-insensitive).',
			required: false,
		}),
		ownerAccountId: Property.ShortText({
			displayName: 'Owner Account ID',
			description: 'Only return filters owned by this user. Resolve it with Find Users.',
			required: false,
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults({ max: 100 }),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<JiraPageBean<JiraRecord>>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/filter/search',
			query: {
				filterName: propsValue.filterName,
				accountId: propsValue.ownerAccountId,
				startAt: propsValue.startAt,
				maxResults: propsValue.maxResults,
				expand: 'description,owner,jql,viewUrl,favourite',
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
