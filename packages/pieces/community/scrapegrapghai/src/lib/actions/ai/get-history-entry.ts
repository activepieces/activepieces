import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiGetHistoryEntryOutputSchema } from '../../output-schemas';

export const getHistoryEntryAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_get_history_entry',
	outputSchema: scrapegrapghaiGetHistoryEntryOutputSchema,
	displayName: 'Get History Entry',
	description: 'Gets one past request and its full result by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one past request with its params, status and full result. The ID is the `id` returned by Scrape Page, Extract Data or Search the Web, a page `scrapeRefId` from Get Crawl, or a run `id` from List Monitor Activity.',
		idempotent: true,
	},
	props: {
		requestId: Property.ShortText({
			displayName: 'Request ID',
			description:
				'UUID of the request: `id` from Scrape Page, Extract Data or Search the Web, `scrapeRefId` from Get Crawl, or a run `id` from List Monitor Activity.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.getHistoryEntry({ auth, requestId: propsValue.requestId });
	},
});
