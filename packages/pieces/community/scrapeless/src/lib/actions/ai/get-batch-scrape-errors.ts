import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getBatchScrapeErrorsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_batch_scrape_errors',
  displayName: 'Get Batch Scrape Errors',
  description: 'Gets the failed pages of a batch scrape.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the pages a batch from Batch Scrape URLs failed to scrape, with error messages, and the URLs blocked by robots.txt.',
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
    return await scrapelessApi.getBatchScrapeErrors({
      auth,
      id: propsValue.id,
    });
  },
});
