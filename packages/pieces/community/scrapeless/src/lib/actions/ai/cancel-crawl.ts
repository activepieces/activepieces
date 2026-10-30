import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const cancelCrawlAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_cancel_crawl',
  displayName: 'Cancel Crawl',
  description: 'Cancels a running crawl.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Stops a running crawl started by Start Crawl; pages already scraped stay available through Get Crawl Status.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'Crawl ID',
      description: 'The crawl id returned by Start Crawl.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.cancelCrawl({ auth, id: propsValue.id });
  },
});
