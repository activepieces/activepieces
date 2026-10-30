import { createAction } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiAiProps } from '../../common/ai-props';
import { webscrapingAiApi } from '../../common/api';
import { pageHtmlOutputSchema } from '../../output-schemas';

export const getSelectedHtmlAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_get_selected_html',
	outputSchema: pageHtmlOutputSchema,
	displayName: 'Get Selected HTML',
	description: 'Returns the HTML of the first element matching a CSS selector on a web page.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches a web page and returns, in result, the HTML of the element matching one CSS selector. Use it to grab one part of a page (a price, a table, an article body) without the full HTML; use Get Multiple Selected HTML for several selectors in one call. Read-only on the target site.',
		idempotent: true,
	},
	props: {
		selector: webscrapingAiAiProps.selector(),
		...webscrapingAiAiProps.scrapePage(),
	},
	async run({ auth, propsValue }) {
		return await webscrapingAiApi.scrapeSelected({ auth, ...propsValue });
	},
});
