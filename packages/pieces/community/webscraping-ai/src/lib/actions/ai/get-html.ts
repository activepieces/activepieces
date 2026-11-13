import { createAction } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiAiProps } from '../../common/ai-props';
import { webscrapingAiApi } from '../../common/api';
import { pageHtmlOutputSchema } from '../../output-schemas';

export const getHtmlAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_get_html',
	outputSchema: pageHtmlOutputSchema,
	displayName: 'Get Page HTML',
	description: 'Returns the rendered HTML of a web page.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Fetches a web page through a headless browser and returns its rendered HTML in result. Use it when you need the raw markup; prefer Get Page Text for readable content, or Get Selected HTML for one element. Optional JavaScript Code runs on the page first, and Return Script Result returns that script's value instead of the HTML. Read-only on the target site.",
		idempotent: true,
	},
	props: {
		...webscrapingAiAiProps.scrapePage(),
		...webscrapingAiAiProps.pageScript(),
	},
	async run({ auth, propsValue }) {
		return await webscrapingAiApi.scrapeHtml({ auth, ...propsValue });
	},
});
