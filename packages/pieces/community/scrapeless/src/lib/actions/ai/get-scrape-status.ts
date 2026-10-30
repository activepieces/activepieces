import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getScrapeStatusAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_scrape_status',
  displayName: 'Get Scrape Status',
  description: 'Gets the status and content of a single-page scrape.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Checks a scrape started by Scrape URL once and returns its status and, when completed, the page content in the requested formats. Call again later while it is still scraping.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'Scrape ID',
      description: 'The scrape id returned by Scrape URL.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.getScrape({ auth, id: propsValue.id });
  },
});
