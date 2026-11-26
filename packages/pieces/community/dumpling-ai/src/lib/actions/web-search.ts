import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../auth';

export const webSearch = createAction({
	name: 'web_search',
	classification: 'SEARCH',
	auth: dumplingAuth,
	displayName: 'Web Search',
	description: 'Search the web and optionally retrieve content from top results.',
	audience: 'both',
	aiMetadata: { description: 'Runs a live web search on Dumpling AI for a query, with optional country/location/language and date-range filtering. Can operate in two modes: results-only, or with "Scrape Results" enabled it also fetches and returns the page content of the top N results (markdown, HTML, or screenshot). Use to find current web pages or grab their content in one step. Not idempotent: each call is a fresh billed search whose results reflect live web state.', idempotent: false },
	propertyGroups: [
		{ key: 'search', display: 'section', label: 'Search', icon: 'filter', props: ['query', 'dateRange'] },
		{ key: 'region', display: 'section', label: 'Region and Language', icon: 'location', props: ['country', 'language', 'location'] },
		{ key: 'content', display: 'section', label: 'Page Content', icon: 'file', props: ['scrapeResults', 'scrapeInfo', 'numResultsToScrape', 'scrapeFormat', 'cleanedOutput'] },
	],
	props: {
		query: Property.ShortText({
			displayName: 'Search Query',
			required: true,
			placeholder: 'best project management tools',
		}),
		dateRange: Property.StaticDropdown({
			displayName: 'Date Range',
			required: false,
			options: {
				options: [
					{ label: 'Any Time', value: 'anyTime' },
					{ label: 'Past Hour', value: 'pastHour' },
					{ label: 'Past Day', value: 'pastDay' },
					{ label: 'Past Week', value: 'pastWeek' },
					{ label: 'Past Month', value: 'pastMonth' },
					{ label: 'Past Year', value: 'pastYear' },
				],
			},
			description: 'Only return results from this period.',
		}),
		country: Property.ShortText({
			displayName: 'Country',
			required: false,
			description: 'Two-letter country code to favour results from.',
			placeholder: 'US',
			width: 'half',
		}),
		language: Property.ShortText({
			displayName: 'Language',
			required: false,
			description: 'Language code for the results.',
			placeholder: 'en',
			width: 'half',
		}),
		location: Property.ShortText({
			displayName: 'Location',
			required: false,
			description: 'City or region to focus the search on.',
			placeholder: 'New York, NY',
		}),
		scrapeResults: Property.Checkbox({
			displayName: 'Scrape Results',
			required: false,
			defaultValue: false,
			description: 'Also fetch the content of the top results.',
		}),
		scrapeInfo: Property.MarkDown({
			value: 'Results to Scrape, Scrape Format and Clean Output apply only when Scrape Results is on.',
			variant: MarkdownVariant.INFO,
		}),
		numResultsToScrape: Property.Number({
			displayName: 'Results to Scrape',
			required: false,
			defaultValue: 3,
			description: 'How many top results to fetch, from 1 to 10.',
		}),
		scrapeFormat: Property.StaticDropdown({
			displayName: 'Scrape Format',
			required: false,
			defaultValue: 'markdown',
			options: {
				options: [
					{ label: 'Markdown', value: 'markdown' },
					{ label: 'HTML', value: 'html' },
					{ label: 'Screenshot', value: 'screenshot' },
				],
			},
			description: 'Screenshot returns an image of each page instead of text.',
		}),
		cleanedOutput: Property.Checkbox({
			displayName: 'Clean Output',
			required: false,
			defaultValue: true,
			description: 'Return a cleaned-up version of the page content.',
		}),
		page: Property.Number({
			displayName: 'Page Number',
			required: false,
			description: 'Results page to return. Empty returns the first page.',
			advanced: true,
		}),
	},
	async run(context) {
		const {
			query,
			country,
			location,
			language,
			dateRange,
			page,
			scrapeResults,
			numResultsToScrape,
			scrapeFormat,
			cleanedOutput,
		} = context.propsValue;

		const requestBody: Record<string, unknown> = {
			query,
		};

		if (country) requestBody['country'] = country;
		if (location) requestBody['location'] = location;
		if (language) requestBody['language'] = language;
		if (dateRange) requestBody['dateRange'] = dateRange;
		if (page) requestBody['page'] = page;
		if (scrapeResults !== undefined) requestBody['scrapeResults'] = scrapeResults;
		if (numResultsToScrape) requestBody['numResultsToScrape'] = numResultsToScrape;

		if (scrapeResults) {
			const scrapeOptions: Record<string, unknown> = {};
			if (scrapeFormat) scrapeOptions['format'] = scrapeFormat;
			if (cleanedOutput !== undefined) scrapeOptions['cleaned'] = cleanedOutput;
			requestBody['scrapeOptions'] = scrapeOptions;
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://app.dumplingai.com/api/v1/search',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${context.auth.secret_text}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
