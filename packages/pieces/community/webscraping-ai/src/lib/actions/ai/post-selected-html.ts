import { createAction } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiAiProps } from '../../common/ai-props';
import { webscrapingAiApi } from '../../common/api';
import { pageHtmlOutputSchema } from '../../output-schemas';

export const postSelectedHtmlAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_post_selected_html',
	outputSchema: pageHtmlOutputSchema,
	displayName: 'POST to Page and Get Selected HTML',
	description:
		'Sends a POST request to a web page and returns the HTML of the element matching a CSS selector in the response.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends Request Body to the target URL as a POST and returns, in result, the HTML of the element matching one CSS selector in the response page. Use Get Selected HTML for a plain GET. The body is sent to the target site as a POST, so it can change state there (log in, submit a form); not idempotent.',
		idempotent: false,
	},
	props: {
		selector: webscrapingAiAiProps.selector(),
		...webscrapingAiAiProps.scrapePage(),
		...webscrapingAiAiProps.postRequest(),
	},
	async run({ auth, propsValue }) {
		const { body, contentType, ...page } = propsValue;
		return await webscrapingAiApi.scrapeSelected({ auth, ...page, post: { body, contentType } });
	},
});
