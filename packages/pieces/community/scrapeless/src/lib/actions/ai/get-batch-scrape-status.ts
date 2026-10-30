import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getBatchScrapeStatusAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_batch_scrape_status',
  displayName: 'Get Batch Scrape Status',
  description: 'Gets the progress and pages of a batch scrape.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Checks a batch started by Batch Scrape URLs once and returns its status, completed and total counts, and the pages scraped so far. Call again later while it is still scraping.',
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
    return await scrapelessApi.getBatchScrape({ auth, id: propsValue.id });
  },
});
