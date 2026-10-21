import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiListHistoryOutputSchema } from '../../output-schemas';

export const listHistoryAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_list_history',
	outputSchema: scrapegrapghaiListHistoryOutputSchema,
	displayName: 'List History',
	description: 'Lists past API requests, newest first.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists past requests on the account, newest first, with their params, status and full result. Filter by service or by session ID (partial, case-insensitive). Page through with Page; `pagination.total` is the total match count.',
		idempotent: true,
	},
	props: {
		service: Property.StaticDropdown({
			displayName: 'Service',
			description: 'Only return requests from this service. Defaults to all.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Scrape', value: 'scrape' },
					{ label: 'Extract', value: 'extract' },
					{ label: 'Search', value: 'search' },
					{ label: 'Monitor', value: 'monitor' },
					{ label: 'Crawl', value: 'crawl' },
				],
			},
		}),
		sessionId: Property.ShortText({
			displayName: 'Session ID',
			description: 'Only return requests whose session ID contains this text (case-insensitive).',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number, starting at 1. Defaults to 1.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Entries per page. Defaults to 20.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.listHistory({
			auth,
			service: propsValue.service,
			sessionId: propsValue.sessionId,
			page: propsValue.page,
			limit: propsValue.limit,
		});
	},
});
