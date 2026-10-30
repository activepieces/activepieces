import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const cancelBatchScrapeAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_cancel_batch_scrape',
  displayName: 'Cancel Batch Scrape',
  description: 'Cancels a running batch scrape.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Stops a running batch started by Batch Scrape URLs; pages already scraped stay available through Get Batch Scrape Status.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'Batch ID',
      description: 'The batch id returned by Batch Scrape URLs.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.cancelBatchScrape({ auth, id: propsValue.id });
  },
});
