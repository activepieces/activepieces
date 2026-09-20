import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { webzAuth } from '../auth';

export const searchNewsAction = createAction({
	name: 'search_news',
	classification: 'SEARCH',
	displayName: 'Search News',
	description: 'Search for news articles and discussions with rich metadata using Webz.io.',
	audience: 'both',
	aiMetadata: {
		description:
			'Search global news and articles via the Webz.io News Search API for current-affairs research, sentiment monitoring, company tracking, and risk analysis. Read-only and idempotent.',
		idempotent: true,
	},
	auth: webzAuth,
	props: {
		query: Property.LongText({
			displayName: 'Search Query',
			description: 'Natural language search query or keywords (supports boolean expressions e.g. AND, OR).',
			required: true,
		}),
		size: Property.Number({
			displayName: 'Maximum Results',
			description: 'The maximum number of news articles to return (default is 10, maximum is 100).',
			required: false,
			defaultValue: 10,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Language code filter (e.g. "english", "spanish", "french").',
			required: false,
		}),
		country: Property.ShortText({
			displayName: 'Country',
			description: 'Two-letter country code filter (e.g. "US", "GB", "DE").',
			required: false,
		}),
		sentiment: Property.StaticDropdown({
			displayName: 'Sentiment',
			description: 'Filter articles by detected sentiment.',
			required: false,
			options: {
				options: [
					{ label: 'Positive', value: 'positive' },
					{ label: 'Neutral', value: 'neutral' },
					{ label: 'Negative', value: 'negative' },
				],
			},
		}),
		category: Property.ShortText({
			displayName: 'Category',
			description: 'Topic or section category (e.g. "business", "technology", "politics", "health").',
			required: false,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort Order',
			description: 'Sort articles by relevancy or publication date.',
			required: false,
			defaultValue: 'relevancy',
			options: {
				options: [
					{ label: 'Relevancy', value: 'relevancy' },
					{ label: 'Published Date', value: 'crawled' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const queryParams: Record<string, string> = {
			token: auth,
			q: propsValue.query,
			size: String(propsValue.size ?? 10),
			sort: propsValue.sort ?? 'relevancy',
		};

		if (propsValue.language) {
			queryParams['language'] = propsValue.language;
		}
		if (propsValue.country) {
			queryParams['country'] = propsValue.country;
		}
		if (propsValue.sentiment) {
			queryParams['sentiment'] = propsValue.sentiment;
		}
		if (propsValue.category) {
			queryParams['category'] = propsValue.category;
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: 'https://api.webz.io/newsApiLite',
			queryParams,
		});

		return response.body;
	},
});
