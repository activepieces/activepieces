import { createAction } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessAiProps } from '../../common/ai-props';
import { scrapelessApi } from '../../common/api';

export const searchGoogleLocalAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_search_google_local',
  displayName: 'Search Google Local',
  description: 'Runs a Google Local search and returns the structured results.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Runs a live Google Local search and returns local business listings (name, address, rating, place ids). If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    query: scrapelessAiProps.query({ required: true }),
    googleDomain: scrapelessAiProps.googleDomain({ required: false }),
    country: scrapelessAiProps.country({ required: false }),
    language: scrapelessAiProps.language({ required: false }),
    location: scrapelessAiProps.location({ required: false }),
    start: scrapelessAiProps.start({
      required: false,
      description:
        'Number of results to skip, for paging: 0 is the first page, 20 the second. Defaults to 0.',
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.google.search',
      input: {
        q: propsValue.query,
        tbm: 'lcl',
        google_domain: propsValue.googleDomain,
        gl: propsValue.country,
        hl: propsValue.language,
        location: propsValue.location,
        start: propsValue.start,
      },
    });
  },
});
