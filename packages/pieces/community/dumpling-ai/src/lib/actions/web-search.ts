import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

export const webSearch = createAction({
	name: 'web_search',
	auth: dumplingAuth,
	displayName: 'Web Search',
	description: 'Search the web and optionally retrieve content from top results.',
	props: {
		query: Property.ShortText({
			displayName: 'Search Query',
			required: true,
		}),
		country: Property.ShortText({
			displayName: 'Country',
			required: false,
			description: 'Two-letter country code for location bias (e.g., "US" for United States).',
		}),
		location: Property.ShortText({
			displayName: 'Location',
			required: false,
			description: 'Specific location to focus the search (e.g., "New York, NY").',
		}),
		language: Property.ShortText({
			displayName: 'Language',
			required: false,
			description: 'Language code for the search results (e.g., "en" for English).',
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
			description: 'Filter results by date.',
		}),
		page: Property.Number({
			displayName: 'Page Number',
			required: false,
			description: 'Page number for paginated results.',
		}),
		scrapeResults: Property.Checkbox({
			displayName: 'Scrape Results',
			required: false,
			defaultValue: false,
			description: 'Whether to scrape top search results.',
		}),
		numResultsToScrape: Property.Number({
			displayName: 'Number of Results to Scrape',
			required: false,
			defaultValue: 3,
			description: 'Number of top results to scrape (max: 10).',
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
			description: 'Format of scraped content',
		}),
		cleanedOutput: Property.Checkbox({
			displayName: 'Clean Output',
			required: false,
			defaultValue: true,
			description: 'Whether the scraped output should be cleaned.',
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

		const requestBody: Record<string, any> = {
			query,
		};

		// Add optional parameters if provided
		if (country) requestBody['country'] = country;
		if (location) requestBody['location'] = location;
		if (language) requestBody['language'] = language;
		if (dateRange) requestBody['dateRange'] = dateRange;
		if (page) requestBody['page'] = page;
		if (scrapeResults !== undefined) requestBody['scrapeResults'] = scrapeResults;
		if (numResultsToScrape) requestBody['numResultsToScrape'] = numResultsToScrape;

		// Add scrape options if scraping is enabled
		if (scrapeResults) {
			requestBody['scrapeOptions'] = {};
			if (scrapeFormat) requestBody['scrapeOptions']['format'] = scrapeFormat;
			if (cleanedOutput !== undefined) requestBody['scrapeOptions']['cleaned'] = cleanedOutput;
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://app.dumplingai.com/api/v1/search',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${context.auth}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
