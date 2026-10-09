import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';

export const listCrawlPagesAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_list_crawl_pages',
	displayName: 'List Crawl Pages',
	description: 'Lists the pages of a crawl job with their scraped content.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Returns one slice of a crawl job's pages with each page's scraped content resolved under `scrape`. Pass `pagination.nextCursor` from the previous call as Cursor to get the next slice; it is null when there are no more.",
		idempotent: true,
	},
	props: {
		crawlId: scrapegraphaiAiProps.crawlId({ required: true }),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Pages to return, 1-100. Defaults to 50.',
			required: false,
		}),
		cursor: Property.Number({
			displayName: 'Cursor',
			description:
				'Zero-based page index to start from, from `pagination.nextCursor`. Defaults to 0.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.listCrawlPages({
			auth,
			crawlId: propsValue.crawlId,
			limit: propsValue.limit,
			cursor: propsValue.cursor,
		});
	},
});
