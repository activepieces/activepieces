import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

export const searchNews = createAction({
	name: 'search_news',
	auth: dumplingAuth,
	displayName: 'Search News',
	description: 'Search for news articles using Google News.',
	props: {
		query: Property.ShortText({
			displayName: 'Search Query',
			required: true,
			description: 'The search query for Google News.',
		}),
		country: Property.ShortText({
			displayName: 'Country',
			required: false,
			description: 'Country code for location bias (e.g., "US" for United States).',
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
	},
	async run(context) {
		const { query, country, location, language, dateRange, page } = context.propsValue;

		const requestBody: Record<string, any> = {
			query,
		};

		// Add optional parameters if provided
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
				Authorization: `Bearer ${context.auth}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
