import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord } from '../../common/ai-helpers';

import { filterOutputSchema } from '../../output-schemas';
export const getFilterAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_filter',
	classification: 'READ',
	displayName: 'Get Filter',
	description: 'Gets a saved filter, including its JQL.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetch one saved filter by ID, including its name, owner, JQL, sharing permissions and view URL. Use it to reuse the filter JQL in Search Issues by JQL or Count Issues. Read-only.',
		idempotent: true,
	},
	outputSchema: filterOutputSchema,
	props: {
		filterId: Property.ShortText({
			displayName: 'Filter ID',
			description: 'The numeric filter ID. Find it with Search Filters or Get Favorite Filters.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/filter/${encodeURIComponent(propsValue.filterId.trim())}`,
		});
	},
});
