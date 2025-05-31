import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

export const crawlWebsite = createAction({
	name: 'crawl_website',
	auth: dumplingAuth,
	displayName: 'Crawl Website',
	description: 'Crawl a website and return structured content from multiple pages.',
	props: {
		url: Property.ShortText({
			displayName: 'URL',
			required: true,
			description: 'The website URL to crawl.',
		}),
		limit: Property.Number({
			displayName: 'Page Limit',
			required: false,
			defaultValue: 5,
			description: 'Maximum number of pages to crawl.',
		}),
		depth: Property.Number({
			displayName: 'Crawl Depth',
			required: false,
			defaultValue: 2,
			description: 'Depth of crawling (distance between base URL path and sub paths).',
		}),
		format: Property.StaticDropdown({
			displayName: 'Output Format',
			required: false,
			defaultValue: 'markdown',
			options: {
				options: [
					{ label: 'Markdown', value: 'markdown' },
					{ label: 'Text', value: 'text' },
					{ label: 'Raw', value: 'raw' },
				],
			},
			description: 'Format of the output content.',
		}),
	},
	async run(context) {
		const { url, limit, depth, format } = context.propsValue;

		const requestBody: Record<string, any> = {
			url,
		};

		// Add optional parameters if provided
		if (limit !== undefined) requestBody['limit'] = limit;
		if (depth !== undefined) requestBody['depth'] = depth;
		if (format) requestBody['format'] = format;

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://app.dumplingai.com/api/v1/crawl',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${context.auth}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
