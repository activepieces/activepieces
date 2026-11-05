import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessAiProps } from '../../common/ai-props';
import { scrapelessApi } from '../../common/api';

export const searchGoogleAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_search_google',
  displayName: 'Search Google',
  description:
    'Runs a Google web search and returns the structured results page.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Runs a live Google web search and returns the parsed results page (organic results, knowledge graph, related questions and more). Use the image, local, video or shopping search actions for those verticals. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    query: scrapelessAiProps.query({ required: true }),
    location: scrapelessAiProps.location({ required: false }),
    googleDomain: scrapelessAiProps.googleDomain({ required: false }),
    country: scrapelessAiProps.country({ required: false }),
    language: scrapelessAiProps.language({ required: false }),
    countryRestrict: Property.ShortText({
      displayName: 'Restrict to Countries',
      description:
        'Only return pages from these countries, e.g. "countryFR|countryDE".',
      required: false,
    }),
    languageRestrict: Property.ShortText({
      displayName: 'Restrict to Languages',
      description:
        'Only return pages in these languages, e.g. "lang_fr|lang_de".',
      required: false,
    }),
    tbs: Property.ShortText({
      displayName: 'Advanced Filters (tbs)',
      description:
        'Google tbs filter, e.g. "qdr:d" for the past day or "qdr:w" for the past week.',
      required: false,
    }),
    safeSearch: Property.StaticDropdown({
      displayName: 'Safe Search',
      description:
        'Adult-content filtering. Leave empty for Google’s default (blur).',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Off', value: 'off' },
        ],
      },
    }),
    start: scrapelessAiProps.start({ required: false }),
    num: scrapelessAiProps.num({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.google.search',
      input: {
        q: propsValue.query,
        location: propsValue.location,
        google_domain: propsValue.googleDomain,
        gl: propsValue.country,
        hl: propsValue.language,
        cr: propsValue.countryRestrict,
        lr: propsValue.languageRestrict,
        tbs: propsValue.tbs,
        safe: propsValue.safeSearch,
        start: propsValue.start,
        num: propsValue.num,
      },
    });
  },
});
