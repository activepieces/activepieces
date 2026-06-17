import { createAction, Property } from '@activepieces/pieces-framework';
import { dataFuelAuth } from '../common/auth';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/constants';
import { ListScrapesResponse } from '../common/types';

export const getScrapeAction = createAction({
	name: 'get-scrape',
	auth: dataFuelAuth,
	displayName: 'Get Scrape Result',
	description: 'Retrieves the deatils about scrape.',
	audience: 'both',
	aiMetadata: {
		description: 'Looks up the result of a previously submitted scrape or crawl job by its job ID, optionally including the markdown content and the AI-extracted JSON result. Use to fetch the output of a job started by Crawl Website or Scrape Website. Requires a valid job ID; this is a read-only lookup and is idempotent.',
		idempotent: true,
	},
	props: {
		jobId: Property.ShortText({
			displayName: 'Job ID',
			required: true,
		}),
		aiResponse: Property.Checkbox({
			displayName: 'AI JSON Result',
			required: true,
		}),
		markdownResponse: Property.Checkbox({
			displayName: 'Markdown Result',
			required: true,
		}),
	},
	async run(context) {
		const { jobId, aiResponse, markdownResponse } = context.propsValue;

		const response = await httpClient.sendRequest<Array<ListScrapesResponse>>({
			method: HttpMethod.GET,
			url: BASE_URL + '/list_scrapes',

			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.secret_text,
			},
			queryParams: {
				job_id: jobId,
				markdown: markdownResponse ? 'true' : 'false',
				ai_response: aiResponse ? 'true' : 'false',
			},
		});

		return response.body;
	},
});
