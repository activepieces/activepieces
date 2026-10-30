import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessAiProps } from '../../common/ai-props';
import { scrapelessApi } from '../../common/api';

export const searchGoogleScholarAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_search_google_scholar',
  displayName: 'Search Google Scholar',
  description: 'Searches Google Scholar for academic articles.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Searches Google Scholar and returns articles with titles, authors, snippets, citation counts and the cites/cluster ids used for follow-up searches. Set Query, Cited By (optionally with Query) or All Versions alone. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'What to search for. Supports helpers such as author: and source:.',
      required: false,
    }),
    citedBy: Property.ShortText({
      displayName: 'Cited By',
      description:
        'Article cites id from an earlier result; lists the documents that cite it.',
      required: false,
    }),
    allVersions: Property.ShortText({
      displayName: 'All Versions',
      description:
        'Article cluster id from an earlier result; lists all versions of it. Use on its own.',
      required: false,
    }),
    yearFrom: Property.Number({
      displayName: 'From Year',
      description: 'Only results published from this year.',
      required: false,
    }),
    yearTo: Property.Number({
      displayName: 'To Year',
      description: 'Only results published up to this year.',
      required: false,
    }),
    language: scrapelessAiProps.language({ required: false }),
    start: scrapelessAiProps.start({ required: false }),
    num: scrapelessAiProps.num({
      required: false,
      description:
        'Maximum number of results to return, 1 to 20. Defaults to 10.',
    }),
  },
  async run({ auth, propsValue }) {
    const { query, citedBy, allVersions } = propsValue;
    if (!query && !citedBy && !allVersions) {
      throw new Error('Set Query, Cited By or All Versions.');
    }
    if (allVersions && (query || citedBy)) {
      throw new Error('All Versions can’t be combined with Query or Cited By.');
    }
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.google.scholar',
      input: {
        engine: 'google_scholar',
        q: query,
        cites: citedBy,
        cluster: allVersions,
        as_ylo: propsValue.yearFrom,
        as_yhi: propsValue.yearTo,
        hl: propsValue.language,
        start: propsValue.start,
        num: propsValue.num,
      },
    });
  },
});
