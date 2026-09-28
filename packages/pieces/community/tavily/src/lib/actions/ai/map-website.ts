import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tavilyAuth } from '../../auth';
import { tavilyCommon } from '../../common/client';
import { tavilyMapWebsiteOutputSchema } from '../../output-schemas';

export const mapWebsiteAction = createAction({
	name: 'tavily_map_website',
	outputSchema: tavilyMapWebsiteOutputSchema,
	classification: 'SEARCH',
	displayName: 'Map Website',
	description: 'Crawl a website starting from a root URL and return the URL structure discovered, without page content.',
	audience: 'ai',
	aiMetadata: {
		description:
			"Explore a website starting from a root URL, following links up to a depth and breadth limit, and return the list of URLs discovered — no page content. Use to discover a site's structure or find candidate URLs to pass to `tavily_extract` or `tavily_crawl_website`. Not idempotent: the set of URLs discovered can change between runs.",
		idempotent: false,
	},
	auth: tavilyAuth,
	props: {
		url: Property.ShortText({
			displayName: 'Root URL',
			description: 'The root URL to begin the mapping from.',
			required: true,
		}),
		instructions: Property.LongText({
			displayName: 'Instructions',
			description: 'Natural language instructions guiding the crawler.',
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
	},
	async run({ auth, propsValue }) {
		return tavilyCommon.request({
			apiKey: auth.secret_text,
			method: HttpMethod.POST,
			path: '/map',
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
			},
		});
	},
});
