import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../auth';

export const searchNews = createAction({
	name: 'search_news',
	classification: 'SEARCH',
	auth: dumplingAuth,
	displayName: 'Search News',
	description: 'Search for news articles using Google News.',
	audience: 'both',
	aiMetadata: { description: 'Searches Google News via Dumpling AI for a query, with optional country/location/language and date-range filtering plus pagination. Choose this over the general web search when the agent needs news articles specifically. Not idempotent: each call is a fresh billed search reflecting live news at request time.', idempotent: false },
	propertyGroups: [
		{ key: 'search', display: 'section', label: 'Search', icon: 'filter', props: ['query', 'dateRange'] },
		{ key: 'region', display: 'section', label: 'Region and Language', icon: 'location', props: ['country', 'language', 'location'] },
	],
	props: {
		query: Property.ShortText({
			displayName: 'Search Query',
			required: true,
			placeholder: 'electric vehicle sales',
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
		page: Property.Number({
			displayName: 'Page Number',
			required: false,
			description: 'Results page to return. Empty returns the first page.',
			advanced: true,
		}),
	},
	async run(context) {
		const { query, country, location, language, dateRange, page } = context.propsValue;

		const requestBody: Record<string, unknown> = {
			query,
		};

		if (country) requestBody['country'] = country;
		if (location) requestBody['location'] = location;
		if (language) requestBody['language'] = language;
		if (dateRange) requestBody['dateRange'] = dateRange;
		if (page) requestBody['page'] = page;

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://app.dumplingai.com/api/v1/search-news',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${context.auth.secret_text}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
