import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

export const scrapeWebsite = createAction({
	name: 'scrape_website',
	auth: dumplingAuth,
	displayName: 'Scrape Website',
	description: 'Scrapes data from a specified URL and format the result.',
	props: {
		url: Property.ShortText({
			displayName: 'URL',
			required: true,
		}),
		format: Property.StaticDropdown({
			displayName: 'Output Format',
			required: false,
			defaultValue: 'markdown',
			options: {
				options: [
					{ label: 'Markdown', value: 'markdown' },
					{ label: 'HTML', value: 'html' },
					{ label: 'Screenshot', value: 'screenshot' },
				],
			},
			description: 'The format of the output',
		}),
		cleaned: Property.Checkbox({
			displayName: 'Clean Output ?',
			required: false,
			defaultValue: true,
			description: 'Whether the output should be cleaned.',
		}),
		renderJs: Property.Checkbox({
			displayName: 'Render JavaScript ?',
			required: false,
			defaultValue: true,
			description: 'Whether to render JavaScript before scraping.',
		}),
	},
	async run(context) {
		const { url, format, cleaned, renderJs } = context.propsValue;

		const requestBody: Record<string, any> = {
			url,
		};

		// Add optional parameters if provided
		if (format) requestBody['format'] = format;
		if (cleaned !== undefined) requestBody['cleaned'] = cleaned;
		if (renderJs !== undefined) requestBody['renderJs'] = renderJs;

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://app.dumplingai.com/api/v1/scrape',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${context.auth}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
