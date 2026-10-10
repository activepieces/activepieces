import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiCrawlOutputSchema } from '../../output-schemas';

export const getCrawlAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_get_crawl',
	outputSchema: scrapegrapghaiCrawlOutputSchema,
	displayName: 'Get Crawl',
	description: 'Gets the status and progress of a crawl job.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Reads a crawl job once: status (running, completed, failed or stopped), page counters and lightweight per-page metadata with each page's `scrapeRefId`. Call it repeatedly to poll a job from Start Crawl; it never waits. Page content comes from List Crawl Pages.",
		idempotent: true,
	},
	props: {
		crawlId: scrapegraphaiAiProps.crawlId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.getCrawl({ auth, crawlId: propsValue.crawlId });
	},
});
