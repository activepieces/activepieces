import { createAction, Property } from '@activepieces/pieces-framework';
import { dataFuelAuth } from '../common/auth';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/constants';
import { CrawlWebsiteResponse, ListScrapesResponse } from '../common/types';

export const crawlWebsiteAction = createAction({
	name: 'crawl-website',
	auth: dataFuelAuth,
	displayName: 'Crawl Website',
	description: 'Crawl a website into a markdown format.',
	props: {
		url: Property.ShortText({
			displayName: 'URL',
			required: true,
		}),
		prompt: Property.LongText({
			displayName: 'AI Prompt',
			description: 'Prompt to crawl data',
			required: false,
		}),
		depth: Property.Number({
			displayName: 'Depth',
			description:
				'The depth of the crawl 1 depth mean only the first level of links will be scraped',
			required: true,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'The maximum number of pages to scrape',
			required: true,
		}),
		jsonSchema: Property.Json({
			displayName: 'JSON Schema',
			required: false,
			description: `JSON schema definition for structured data extraction.Format should follow OpenAI's function calling schema format (https://platform.openai.com/docs/guides/structured-outputs)`,
		}),
	},
	async run(context) {
		const { url, prompt, depth, limit, jsonSchema } = context.propsValue;

		const response = await httpClient.sendRequest<CrawlWebsiteResponse>({
			method: HttpMethod.POST,
			url: BASE_URL + '/crawl',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.secret_text,
			},
			body: {
				url,
				ai_prompt: prompt,
				json_schema: jsonSchema,
				depth,
				limit,
			},
		});

		const jobId = response.body.job_id;
		let status = 'pending';
		const timeoutAt = Date.now() + 5 * 60 * 1000;

		while (status !== 'finished' && Date.now() < timeoutAt) {
			await new Promise((resolve) => setTimeout(resolve, 5000)); // wait 5 seconds

			const pollResponse = await httpClient.sendRequest<Array<ListScrapesResponse>>({
				method: HttpMethod.GET,
				url: BASE_URL + '/list_scrapes',
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: context.auth.secret_text,
				},
				queryParams: {
					job_id: jobId,
					markdown: 'true',
				},
			});

			status = pollResponse.body[0].job_status;

			if (status === 'finished') return pollResponse.body;
		}
		throw new Error('Crawl Job timed out or failed.');
	},
});
