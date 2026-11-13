import { createAction } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiAiProps } from '../../common/ai-props';
import { webscrapingAiApi } from '../../common/api';
import { selectedMultipleOutputSchema } from '../../output-schemas';

export const getSelectedMultipleAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_get_selected_multiple',
	outputSchema: selectedMultipleOutputSchema,
	displayName: 'Get Multiple Selected HTML',
	description:
		'Returns the HTML of every element matching each of several CSS selectors on a web page.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches a web page once and returns results with the inner HTML of every element matching any of the selectors. The API currently returns all matches in one combined list rather than one list per selector, so do not rely on the position of a list to know which selector matched. Use it instead of several Get Selected HTML calls. Read-only on the target site.',
		idempotent: true,
	},
	props: {
		selectors: webscrapingAiAiProps.selectors(),
		...webscrapingAiAiProps.scrapePage(),
	},
	async run({ auth, propsValue }) {
		const { selectors, ...page } = propsValue;
		if (!selectors.every((item): item is string => typeof item === 'string' && item !== '')) {
			throw new Error('Selectors must be a list of non-empty CSS selector strings.');
		}
		return await webscrapingAiApi.scrapeSelectedMultiple({ auth, ...page, selectors });
	},
});
