import { createAction, Property } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiAiProps } from '../../common/ai-props';
import { webscrapingAiApi } from '../../common/api';
import { answerOutputSchema } from '../../output-schemas';

export const askQuestionAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_ask_question',
	outputSchema: answerOutputSchema,
	displayName: 'Ask a Question About a Page',
	description: 'Answers a question about a web page using an LLM.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches a web page and has an LLM answer a natural-language question about its content, returned in result. Use it for one fact or a summary; use Extract Fields for several named values, or Get Page Text to read the page yourself. Read-only on the target site.',
		idempotent: true,
	},
	props: {
		question: Property.LongText({
			displayName: 'Question',
			description:
				'Question or instructions for the LLM about the page, e.g. "What is the price of the Pro plan?".',
			required: true,
		}),
		...webscrapingAiAiProps.scrapePage(),
	},
	async run({ auth, propsValue }) {
		return await webscrapingAiApi.answerQuestion({ auth, ...propsValue });
	},
});
