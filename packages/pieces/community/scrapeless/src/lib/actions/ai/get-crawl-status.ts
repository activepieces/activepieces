import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getCrawlStatusAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_crawl_status',
  displayName: 'Get Crawl Status',
  description: 'Gets the progress and pages of a crawl.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Checks a crawl started by Start Crawl once and returns its status, completed and total counts, and the pages scraped so far. Call again later while it is still scraping.',
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
    return await scrapelessApi.getCrawl({ auth, id: propsValue.id });
  },
});
