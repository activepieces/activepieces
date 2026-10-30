import { createAction } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessAiProps } from '../../common/ai-props';
import { scrapelessApi } from '../../common/api';

export const searchGoogleShoppingAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_search_google_shopping',
  displayName: 'Search Google Shopping',
  description:
    'Runs a Google Shopping search and returns the structured results.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Runs a live Google Shopping search and returns shopping results (product, price, merchant). If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    query: scrapelessAiProps.query({ required: true }),
    googleDomain: scrapelessAiProps.googleDomain({ required: false }),
    country: scrapelessAiProps.country({ required: false }),
    language: scrapelessAiProps.language({ required: false }),
    start: scrapelessAiProps.start({ required: false }),
    num: scrapelessAiProps.num({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.google.search',
      input: {
        q: propsValue.query,
        tbm: 'shop',
        google_domain: propsValue.googleDomain,
        gl: propsValue.country,
        hl: propsValue.language,
        start: propsValue.start,
        num: propsValue.num,
      },
    });
  },
});
