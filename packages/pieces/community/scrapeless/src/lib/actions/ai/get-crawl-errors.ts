import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getCrawlErrorsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_crawl_errors',
  displayName: 'Get Crawl Errors',
  description: 'Gets the failed pages of a crawl.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the pages a crawl from Start Crawl failed to scrape, with error messages, and the URLs blocked by robots.txt.',
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
    return await scrapelessApi.getCrawlErrors({ auth, id: propsValue.id });
  },
});
