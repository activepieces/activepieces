import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegraphaiUtils } from '../../common/utils';
import { scrapegrapghaiScrapePageOutputSchema } from '../../output-schemas';

export const scrapePageAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_scrape_page',
	outputSchema: scrapegrapghaiScrapePageOutputSchema,
	displayName: 'Scrape Page',
	description: 'Fetches a URL and returns its content in one or more formats.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches one public URL and returns it in every selected format in a single call: markdown, HTML, links, images, an AI summary, an AI JSON extraction (with JSON Prompt), branding or a screenshot URL. Pick it for the raw page content; use Extract Data when you only need prompt-driven structured fields. Each format costs credits.',
		idempotent: true,
	},
	props: {
		url: scrapegraphaiAiProps.url({ required: true }),
		formats: scrapegraphaiAiProps.formats({ required: true }),
		mode: scrapegraphaiAiProps.formatMode({ required: false }),
		jsonPrompt: scrapegraphaiAiProps.jsonPrompt({ required: false }),
		jsonSchema: scrapegraphaiAiProps.jsonSchema({ required: false }),
		fetchConfig: scrapegraphaiAiProps.fetchConfig({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.scrape({
			auth,
			url: propsValue.url,
			formats: scrapegraphaiUtils.buildFormats({
				types: propsValue.formats,
				mode: propsValue.mode,
				jsonPrompt: propsValue.jsonPrompt,
				jsonSchema: propsValue.jsonSchema,
			}),
			fetchConfig: propsValue.fetchConfig,
		});
	},
});
