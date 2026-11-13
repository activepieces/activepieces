import { createAction } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiAiProps } from '../../common/ai-props';
import { webscrapingAiApi } from '../../common/api';
import { pageHtmlOutputSchema } from '../../output-schemas';

export const postHtmlAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_post_html',
	outputSchema: pageHtmlOutputSchema,
	displayName: 'POST to Page and Get HTML',
	description: 'Sends a POST request to a web page and returns the rendered HTML response.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends Request Body to the target URL as a POST (form submission, login, POST API) and returns the rendered HTML response in result. Use Get Page HTML for a plain GET. Optional JavaScript Code runs on the response page. The body is sent to the target site as a POST, so it can change state there (log in, submit a form); not idempotent.',
		idempotent: false,
	},
	props: {
		...webscrapingAiAiProps.scrapePage(),
		...webscrapingAiAiProps.pageScript(),
		...webscrapingAiAiProps.postRequest(),
	},
	async run({ auth, propsValue }) {
		const { body, contentType, ...page } = propsValue;
		return await webscrapingAiApi.scrapeHtml({ auth, ...page, post: { body, contentType } });
	},
});
