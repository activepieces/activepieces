import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegraphaiUtils } from '../../common/utils';
import { scrapegrapghaiStartCrawlOutputSchema } from '../../output-schemas';

export const startCrawlAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_start_crawl',
	outputSchema: scrapegrapghaiStartCrawlOutputSchema,
	displayName: 'Start Crawl',
	description: 'Starts an asynchronous multi-page crawl and returns its job ID.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Starts an asynchronous crawl from a URL and returns the job `id` immediately, without waiting. Poll it with Get Crawl until status is completed or failed (a crawl halted with Stop Crawl reads paused), then read content with List Crawl Pages. Uses one of the plan's crawl job slots and 2 credits plus the per-page scrape cost.",
		idempotent: false,
	},
	props: {
		url: scrapegraphaiAiProps.url({
			required: true,
			description: 'Starting URL of the crawl, including the scheme.',
		}),
		formats: scrapegraphaiAiProps.formats({ required: false }),
		mode: scrapegraphaiAiProps.formatMode({ required: false }),
		jsonPrompt: scrapegraphaiAiProps.jsonPrompt({ required: false }),
		jsonSchema: scrapegraphaiAiProps.jsonSchema({ required: false }),
		maxPages: Property.Number({
			displayName: 'Max Pages',
			description: 'Maximum number of pages to crawl.',
			required: false,
		}),
		maxDepth: Property.Number({
			displayName: 'Max Depth',
			description: 'How many levels of links to follow from the starting URL.',
			required: false,
		}),
		maxLinksPerPage: Property.Number({
			displayName: 'Max Links per Page',
			description: 'Cap on links followed from each page.',
			required: false,
		}),
		allowExternal: Property.Checkbox({
			displayName: 'Allow External Links',
			description: 'Follow links to other domains. Defaults to false.',
			required: false,
		}),
		includePatterns: Property.Array({
			displayName: 'Include Patterns',
			description: 'Glob URL patterns to include, e.g. ["/blog/*"].',
			required: false,
		}),
		excludePatterns: Property.Array({
			displayName: 'Exclude Patterns',
			description: 'Glob URL patterns to skip, e.g. ["/admin/*"].',
			required: false,
		}),
		fetchConfig: scrapegraphaiAiProps.fetchConfig({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.startCrawl({
			auth,
			url: propsValue.url,
			formats: scrapegraphaiUtils.buildFormats({
				types: propsValue.formats,
				mode: propsValue.mode,
				jsonPrompt: propsValue.jsonPrompt,
				jsonSchema: propsValue.jsonSchema,
			}),
			maxPages: propsValue.maxPages,
			maxDepth: propsValue.maxDepth,
			maxLinksPerPage: propsValue.maxLinksPerPage,
			allowExternal: propsValue.allowExternal,
			includePatterns: propsValue.includePatterns,
			excludePatterns: propsValue.excludePatterns,
			fetchConfig: propsValue.fetchConfig,
		});
	},
});
