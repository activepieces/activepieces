import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiExtractOutputSchema } from '../../output-schemas';

export const extractDataAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_extract_data',
	outputSchema: scrapegrapghaiExtractOutputSchema,
	displayName: 'Extract Data',
	description:
		'Extracts structured data from a URL, HTML or markdown using a natural-language prompt.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Uses AI to extract the data described in a prompt from exactly one source: a public URL (fetched server-side), raw HTML or markdown you already have (max 2 MB). Pass a JSON Schema to force the output shape. Returns the result under `json`; use Scrape Page instead for whole-page content.',
		idempotent: true,
	},
	props: {
		url: scrapegraphaiAiProps.url({
			required: false,
			description:
				'Public page URL to fetch and extract from. Provide exactly one of URL, HTML or Markdown.',
		}),
		html: Property.LongText({
			displayName: 'HTML',
			description:
				'Raw HTML to extract from (max 2 MB). Provide exactly one of URL, HTML or Markdown.',
			required: false,
		}),
		markdown: Property.LongText({
			displayName: 'Markdown',
			description:
				'Markdown text to extract from (max 2 MB). Provide exactly one of URL, HTML or Markdown.',
			required: false,
		}),
		prompt: Property.LongText({
			displayName: 'Prompt',
			description:
				'Natural-language description of what to extract, e.g. "the product name and price".',
			required: true,
		}),
		schema: scrapegraphaiAiProps.jsonSchema({
			required: false,
			displayName: 'Schema',
			description: 'Optional JSON Schema object the output must match.',
		}),
		mode: scrapegraphaiAiProps.formatMode({
			required: false,
			displayName: 'HTML Mode',
			description:
				'Pre-processing of the source: normal, reader (main article only) or prune (strip boilerplate). Defaults to normal.',
		}),
		fetchConfig: scrapegraphaiAiProps.fetchConfig({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.extract({
			auth,
			url: propsValue.url,
			html: propsValue.html,
			markdown: propsValue.markdown,
			prompt: propsValue.prompt,
			schema: propsValue.schema,
			mode: propsValue.mode,
			fetchConfig: propsValue.fetchConfig,
		});
	},
});
