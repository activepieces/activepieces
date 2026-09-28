import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tavilyAuth } from '../../auth';
import { tavilyCommon } from '../../common/client';
import { tavilyCrawlWebsiteOutputSchema } from '../../output-schemas';

export const crawlWebsiteAction = createAction({
	name: 'tavily_crawl_website',
	outputSchema: tavilyCrawlWebsiteOutputSchema,
	classification: 'SEARCH',
	displayName: 'Crawl Website',
	description: 'Crawl a website starting from a root URL and return the content of the pages found.',
	audience: 'ai',
	aiMetadata: {
		description:
			"Explore a website starting from a root URL, following links up to a depth and breadth limit, and return the extracted content of each page visited. Use to gather content across a whole site or section rather than a single page. Use `tavily_map_website` instead when only the URL structure is needed, not page content. Not idempotent: page content and the set of URLs discovered can change between runs.",
		idempotent: false,
	},
	auth: tavilyAuth,
	props: {
		url: Property.ShortText({
			displayName: 'Root URL',
			description: 'The root URL to begin the crawl from.',
			required: true,
		}),
		instructions: Property.LongText({
			displayName: 'Instructions',
			description: 'Natural language instructions describing what the crawler should look for.',
			required: false,
		}),
		max_depth: Property.Number({
			displayName: 'Max Depth',
			description: 'How far from the root URL the crawler can explore. Range: 1-5.',
			required: false,
			defaultValue: 1,
		}),
		max_breadth: Property.Number({
			displayName: 'Max Breadth',
			description: 'Maximum number of links to follow per level of the tree. Range: 1-500.',
			required: false,
			defaultValue: 20,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Total number of links the crawler will process before stopping.',
			required: false,
			defaultValue: 50,
		}),
		select_paths: Property.Array({
			displayName: 'Select Paths',
			description: 'Regex patterns selecting only URLs with these path patterns.',
			required: false,
		}),
		select_domains: Property.Array({
			displayName: 'Select Domains',
			description: 'Regex patterns selecting only specific domains or subdomains.',
			required: false,
		}),
		exclude_paths: Property.Array({
			displayName: 'Exclude Paths',
			description: 'Regex patterns excluding URLs with these path patterns.',
			required: false,
		}),
		exclude_domains: Property.Array({
			displayName: 'Exclude Domains',
			description: 'Regex patterns excluding specific domains or subdomains.',
			required: false,
		}),
		allow_external: Property.Checkbox({
			displayName: 'Allow External Links',
			description: 'Include external domain links in the final results list.',
			required: false,
			defaultValue: true,
		}),
		include_images: Property.Checkbox({
			displayName: 'Include Images',
			description: 'Include images found on the crawled pages.',
			required: false,
			defaultValue: false,
		}),
		extract_depth: Property.StaticDropdown({
			displayName: 'Extract Depth',
			description: 'The depth of content extraction per page.',
			required: false,
			defaultValue: 'basic',
			options: {
				options: [
					{ label: 'Basic', value: 'basic' },
					{ label: 'Advanced', value: 'advanced' },
				],
			},
		}),
		format: Property.StaticDropdown({
			displayName: 'Format',
			description: 'The format of the extracted page content.',
			required: false,
			defaultValue: 'markdown',
			options: {
				options: [
					{ label: 'Markdown', value: 'markdown' },
					{ label: 'Text', value: 'text' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		return tavilyCommon.request({
			apiKey: auth.secret_text,
			method: HttpMethod.POST,
			path: '/crawl',
			body: {
				url: propsValue.url,
				instructions: propsValue.instructions,
				max_depth: propsValue.max_depth,
				max_breadth: propsValue.max_breadth,
				limit: propsValue.limit,
				select_paths: propsValue.select_paths,
				select_domains: propsValue.select_domains,
				exclude_paths: propsValue.exclude_paths,
				exclude_domains: propsValue.exclude_domains,
				allow_external: propsValue.allow_external,
				include_images: propsValue.include_images,
				extract_depth: propsValue.extract_depth,
				format: propsValue.format,
			},
		});
	},
});
