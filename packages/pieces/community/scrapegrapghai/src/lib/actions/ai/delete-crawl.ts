import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';

export const deleteCrawlAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_delete_crawl',
	displayName: 'Delete Crawl',
	description: 'Permanently deletes a crawl job and its stored pages.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a crawl job and all its stored pages; this cannot be undone. Use Stop Crawl instead to only halt it.',
		idempotent: false,
	},
	props: {
		crawlId: scrapegraphaiAiProps.crawlId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.deleteCrawl({ auth, crawlId: propsValue.crawlId });
	},
});
