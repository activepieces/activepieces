import { createAction } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiAiProps } from '../../common/ai-props';
import { webscrapingAiApi } from '../../common/api';
import { selectedMultipleOutputSchema } from '../../output-schemas';

export const postSelectedMultipleAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_post_selected_multiple',
	outputSchema: selectedMultipleOutputSchema,
	displayName: 'POST to Page and Get Multiple Selected HTML',
	description:
		'Sends a POST request to a web page and returns the HTML of every element matching each of several CSS selectors in the response.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends Request Body to the target URL as a POST and returns results with the inner HTML of every element in the response page matching any of the selectors. The API currently returns all matches in one combined list rather than one list per selector. Use Get Multiple Selected HTML for a plain GET. The body is sent to the target site as a POST, so it can change state there (log in, submit a form); not idempotent.',
		idempotent: false,
	},
	props: {
		selectors: webscrapingAiAiProps.selectors(),
		...webscrapingAiAiProps.scrapePage(),
		...webscrapingAiAiProps.postRequest(),
	},
	async run({ auth, propsValue }) {
		const { selectors, body, contentType, ...page } = propsValue;
		if (!selectors.every((item): item is string => typeof item === 'string' && item !== '')) {
			throw new Error('Selectors must be a list of non-empty CSS selector strings.');
		}
		return await webscrapingAiApi.scrapeSelectedMultiple({
			auth,
			...page,
			selectors,
			post: { body, contentType },
		});
	},
});
