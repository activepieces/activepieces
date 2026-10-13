import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { filterListOutputSchema } from '../../output-schemas';
export const getFavoriteFiltersAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_favorite_filters',
	classification: 'SEARCH',
	displayName: 'Get Favorite Filters',
	description: 'Lists the filters the user has starred.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the saved filters the connected user has starred as favourites, with each filter ID, name and JQL. A quick way to find the searches the user relies on; use Search Filters to search all visible filters. Read-only.',
		idempotent: true,
	},
	outputSchema: filterListOutputSchema,
	props: {},
	async run({ auth }) {
		const filters = await jiraApiCall<JiraRecord[]>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/filter/favourite',
		});
		return jiraAiHelpers.toList({ items: filters });
	},
});
