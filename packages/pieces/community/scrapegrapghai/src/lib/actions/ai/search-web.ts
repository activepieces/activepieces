import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiSearchWebOutputSchema } from '../../output-schemas';

export const searchWebAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_search_web',
	outputSchema: scrapegrapghaiSearchWebOutputSchema,
	displayName: 'Search the Web',
	description: 'Runs a web search and returns the top results with their page content.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Runs a web search and returns the top results (1-20, default 3) with each page's content inline. Add a prompt (and optional schema) to also get one AI extraction across all results under `json`. Costs 2 credits per result, or 5 with a prompt.",
		idempotent: true,
	},
	props: {
		query: Property.ShortText({
			displayName: 'Query',
			description: 'The search query, e.g. "scrapegraphai pricing".',
			required: true,
		}),
		numResults: Property.Number({
			displayName: 'Number of Results',
			description: 'How many results to fetch, 1-20. Defaults to 3.',
			required: false,
		}),
		prompt: Property.LongText({
			displayName: 'Prompt',
			description:
				'Optional extraction prompt run across all fetched results; the answer is returned under `json`.',
			required: false,
		}),
		schema: scrapegraphaiAiProps.jsonSchema({
			required: false,
			displayName: 'Schema',
			description: 'Optional JSON Schema object for the extraction output. Requires Prompt.',
		}),
		format: Property.StaticDropdown({
			displayName: 'Content Format',
			description: "Format of each result's inline content. Defaults to markdown.",
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Markdown', value: 'markdown' },
					{ label: 'HTML', value: 'html' },
				],
			},
		}),
		timeRange: Property.StaticDropdown({
			displayName: 'Time Range',
			description: 'Only return results published within this window. Defaults to any time.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Past hour', value: 'past_hour' },
					{ label: 'Past 24 hours', value: 'past_24_hours' },
					{ label: 'Past week', value: 'past_week' },
					{ label: 'Past month', value: 'past_month' },
					{ label: 'Past year', value: 'past_year' },
				],
			},
		}),
		locationGeoCode: Property.ShortText({
			displayName: 'Country',
			description: 'ISO 3166-1 alpha-2 country code for localized results, e.g. "us" or "it".',
			required: false,
		}),
		fetchConfig: scrapegraphaiAiProps.fetchConfig({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.search({
			auth,
			query: propsValue.query,
			numResults: propsValue.numResults,
			prompt: propsValue.prompt,
			schema: propsValue.schema,
			format: propsValue.format,
			timeRange: propsValue.timeRange,
			locationGeoCode: propsValue.locationGeoCode,
			fetchConfig: propsValue.fetchConfig,
		});
	},
});
