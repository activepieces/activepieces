import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../auth';

export const scrapeWebsite = createAction({
	name: 'scrape_website',
	classification: 'READ',
	auth: dumplingAuth,
	displayName: 'Scrape Website',
	description: 'Scrapes data from a specified URL and format the result.',
	audience: 'both',
	aiMetadata: { description: 'Fetches the content of a single given URL via Dumpling AI and returns it as markdown, HTML, or a screenshot, with optional content cleaning and JavaScript rendering. Use to read one specific page; use Crawl Website instead to follow links across many pages. Not idempotent: each call is a fresh billed fetch reflecting the live page.', idempotent: false },
	propertyGroups: [
		{ key: 'page', display: 'section', label: 'Page', icon: 'file', props: ['url'] },
		{ key: 'output', display: 'section', label: 'Output', icon: 'sliders', props: ['format', 'cleaned', 'renderJs'] },
	],
	props: {
		url: Property.ShortText({
			displayName: 'URL',
			required: true,
			description: 'The page to read.',
			placeholder: 'https://example.com/pricing',
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
			description: 'Screenshot returns an image of the page instead of text.',
		}),
		cleaned: Property.Checkbox({
			displayName: 'Clean Output',
			required: false,
			defaultValue: true,
			description: 'Return a cleaned-up version of the page content.',
		}),
		renderJs: Property.Checkbox({
			displayName: 'Render JavaScript',
			required: false,
			defaultValue: true,
			description: 'Needed for pages that build their content in the browser.',
		}),
	},
	async run(context) {
		const { url, format, cleaned, renderJs } = context.propsValue;

		const requestBody: Record<string, unknown> = {
			url,
		};

		if (format) requestBody['format'] = format;
		if (cleaned !== undefined) requestBody['cleaned'] = cleaned;
		if (renderJs !== undefined) requestBody['renderJs'] = renderJs;

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://app.dumplingai.com/api/v1/scrape',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${context.auth.secret_text}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
