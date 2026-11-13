import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiOkOutputSchema } from '../../output-schemas';

export const resumeCrawlAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_resume_crawl',
	outputSchema: scrapegrapghaiOkOutputSchema,
	displayName: 'Resume Crawl',
	description: 'Resumes a stopped crawl job.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Resumes a crawl stopped with Stop Crawl from where it left off.',
		idempotent: true,
	},
	props: {
		crawlId: scrapegraphaiAiProps.crawlId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.resumeCrawl({ auth, crawlId: propsValue.crawlId });
	},
});
