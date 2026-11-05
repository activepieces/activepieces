import { createAction } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessAiProps } from '../../common/ai-props';
import { scrapelessApi } from '../../common/api';

export const searchGoogleImagesAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_search_google_images',
  displayName: 'Search Google Images',
  description:
    'Runs a Google Images search and returns the structured results.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Runs a live Google Images search and returns image results (thumbnails, source pages, titles). If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    query: scrapelessAiProps.query({ required: true }),
    googleDomain: scrapelessAiProps.googleDomain({ required: false }),
    country: scrapelessAiProps.country({ required: false }),
    language: scrapelessAiProps.language({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.google.search',
      input: {
        q: propsValue.query,
        tbm: 'isch',
        google_domain: propsValue.googleDomain,
        gl: propsValue.country,
        hl: propsValue.language,
      },
    });
  },
});
