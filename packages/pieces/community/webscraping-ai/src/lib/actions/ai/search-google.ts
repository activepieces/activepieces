import { createAction, Property } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiApi } from '../../common/api';
import { googleSearchOutputSchema } from '../../output-schemas';

export const searchGoogleAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_search_google',
	outputSchema: googleSearchOutputSchema,
	displayName: 'Search Google',
	description: 'Returns parsed Google search results for a query.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Runs a Google search and returns parsed organic results, related searches and pagination, 10 results per page. Use it to find pages, then pass a result link to Get Page Text or Ask a Question. Costs 15 credits per search.',
		idempotent: true,
	},
	props: {
		query: Property.ShortText({
			displayName: 'Query',
			description: 'Search query, e.g. "coffee machines".',
			required: true,
		}),
		countryCode: Property.ShortText({
			displayName: 'Country Code',
			description:
				'Two-letter country code for the search location (Google gl), e.g. "us". Defaults to "us".',
			required: false,
		}),
		languageCode: Property.ShortText({
			displayName: 'Language Code',
			description:
				'Two-letter language code for the results (Google hl), e.g. "en". Defaults to "en".',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Results page number, a whole number from 1 to 100. Defaults to 1.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await webscrapingAiApi.searchGoogle({ auth, ...propsValue });
	},
});
