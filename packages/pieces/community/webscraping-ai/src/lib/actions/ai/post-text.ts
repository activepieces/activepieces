import { createAction } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiAiProps } from '../../common/ai-props';
import { webscrapingAiApi } from '../../common/api';
import { pageTextOutputSchema } from '../../output-schemas';

export const postTextAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_post_text',
	outputSchema: pageTextOutputSchema,
	displayName: 'POST to Page and Get Text',
	description: 'Sends a POST request to a web page and returns the response text as Markdown.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sends Request Body to the target URL as a POST and returns the response page's visible text as Markdown in content, plus title, description and optional links. Use Get Page Text for a plain GET. The body is sent to the target site as a POST, so it can change state there (log in, submit a form); not idempotent.",
		idempotent: false,
	},
	props: {
		...webscrapingAiAiProps.scrapePage(),
		returnLinks: webscrapingAiAiProps.returnLinks(),
		...webscrapingAiAiProps.postRequest(),
	},
	async run({ auth, propsValue }) {
		const { body, contentType, ...page } = propsValue;
		return await webscrapingAiApi.scrapeText({ auth, ...page, post: { body, contentType } });
	},
});
