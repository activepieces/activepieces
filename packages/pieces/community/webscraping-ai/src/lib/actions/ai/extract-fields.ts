import { createAction, Property } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiAiProps } from '../../common/ai-props';
import { webscrapingAiApi } from '../../common/api';
import { extractedFieldsOutputSchema } from '../../output-schemas';

export const extractFieldsAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_extract_fields',
	outputSchema: extractedFieldsOutputSchema,
	displayName: 'Extract Fields From a Page',
	description: 'Extracts named fields from a web page using an LLM.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches a web page and has an LLM extract the requested fields, returned in result keyed by field name (null when the page lacks one). Use it for several structured values in one call; use Ask a Question for a single free-text answer. Read-only on the target site.',
		idempotent: true,
	},
	props: {
		fields: Property.Object({
			displayName: 'Fields',
			description:
				'Fields to extract, as field name → what to extract, e.g. {"title": "Product title", "price": "Product price"}.',
			required: true,
		}),
		...webscrapingAiAiProps.scrapePage(),
	},
	async run({ auth, propsValue }) {
		return await webscrapingAiApi.extractFields({ auth, ...propsValue });
	},
});
