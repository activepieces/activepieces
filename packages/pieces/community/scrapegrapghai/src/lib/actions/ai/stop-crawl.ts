import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiOkOutputSchema } from '../../output-schemas';

export const stopCrawlAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_stop_crawl',
	outputSchema: scrapegrapghaiOkOutputSchema,
	displayName: 'Stop Crawl',
	description: 'Stops a running crawl job.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stops a running crawl from Start Crawl; its status becomes "paused", pages already fetched stay available and no new URLs are followed. Resume it with Resume Crawl. A crawl that already finished returns a 410 "Crawl session expired" error.',
		idempotent: true,
	},
	props: {
		crawlId: scrapegraphaiAiProps.crawlId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.stopCrawl({ auth, crawlId: propsValue.crawlId });
	},
});
