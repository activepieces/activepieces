import { createAction } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiAiProps } from '../../common/ai-props';
import { webscrapingAiApi } from '../../common/api';
import { pageTextOutputSchema } from '../../output-schemas';

export const getTextAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_get_text',
	outputSchema: pageTextOutputSchema,
	displayName: 'Get Page Text',
	description:
		'Returns the visible text of a web page as Markdown, with its title and description.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Fetches a web page and returns its visible text as Markdown in content, plus title, description and, with Return Links, the page's links. Use it to read or summarize a page; prefer Ask a Question or Extract Fields when you want an LLM to pull specific facts. Read-only on the target site.",
		idempotent: true,
	},
	props: {
		...webscrapingAiAiProps.scrapePage(),
		returnLinks: webscrapingAiAiProps.returnLinks(),
	},
	async run({ auth, propsValue }) {
		return await webscrapingAiApi.scrapeText({ auth, ...propsValue });
	},
});
