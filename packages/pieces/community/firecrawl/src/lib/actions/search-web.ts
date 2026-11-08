import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL, FIRECRAWL_ORIGIN } from '../common/common';
import { searchWebActionOutputSchema } from '../output-schemas';

export const searchWeb = createAction({
  auth: firecrawlAuth,
  name: 'search_web',
  classification: 'SEARCH',
  displayName: 'Search Web',
  description: 'Search the web, news, or images for a query. Optionally include each result page as markdown.',
  audience: 'ai',
  outputSchema: searchWebActionOutputSchema,
  aiMetadata: {
    description:
      'Searches the web, and optionally news and images, for a query; the entry point when you have a query but no URL yet. Set includePageContent to true to also get each result page as markdown in the same call instead of following up with Scrape URL (each page uses scrape credits). Read-only, so repeating the call is safe.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query (keywords, like a Google search).',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return for each source (max 100).',
      required: false,
      defaultValue: 5,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'Optional ISO language code to bias results (e.g. "en").',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Optional ISO country code to bias results (e.g. "us").',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (ms)',
      description: 'Maximum time to wait for the search, in milliseconds. Allow more time when Include Page Content is on.',
      required: false,
    }),
    sources: Property.StaticMultiSelectDropdown({
      displayName: 'Sources',
      description: 'Where to search: "web", "news" or "images". Defaults to web only.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Web', value: 'web' },
          { label: 'News', value: 'news' },
          { label: 'Images', value: 'images' },
        ],
      },
    }),
    timeFilter: Property.StaticDropdown({
      displayName: 'Time Filter',
      description: 'Only return results from this time range: qdr:h (past hour), qdr:d (past day), qdr:w (past week), qdr:m (past month) or qdr:y (past year). Leave empty for any time.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Past hour', value: 'qdr:h' },
          { label: 'Past day', value: 'qdr:d' },
          { label: 'Past week', value: 'qdr:w' },
          { label: 'Past month', value: 'qdr:m' },
          { label: 'Past year', value: 'qdr:y' },
        ],
      },
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Optional location to search from (e.g. "San Francisco,California,United States").',
      required: false,
    }),
    includePageContent: Property.Checkbox({
      displayName: 'Include Page Content',
      description: 'Also return each result page as markdown (for image results, the page the image is on). Each result with page content uses scrape credits.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, any> = {
      query: propsValue.query,
      origin: FIRECRAWL_ORIGIN,
    };
    if (propsValue.limit !== undefined) {
      body['limit'] = propsValue.limit;
    }
    if (propsValue.lang) {
      body['lang'] = propsValue.lang;
    }
    if (propsValue.country) {
      body['country'] = propsValue.country;
    }
    if (propsValue.timeout !== undefined) {
      body['timeout'] = propsValue.timeout;
    }
    if (propsValue.sources && propsValue.sources.length > 0) {
      body['sources'] = propsValue.sources.map((type) => ({ type }));
    }
    if (propsValue.timeFilter) {
      body['tbs'] = propsValue.timeFilter;
    }
    if (propsValue.location) {
      body['location'] = propsValue.location;
    }
    if (propsValue.includePageContent) {
      body['scrapeOptions'] = { formats: ['markdown'], onlyMainContent: true };
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${FIRECRAWL_API_BASE_URL}/search`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.secret_text}`,
        },
        body,
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        throw new Error('Invalid Firecrawl API key (401): check the key on your connection.');
      }
      if (status === 402) {
        throw new Error(`Firecrawl could not run this search (402): ${error?.response?.body?.error ?? 'not enough credits'}. Lower Limit or turn off Include Page Content, or top up at https://www.firecrawl.dev/pricing?utm_source=activepieces&utm_medium=integration.`);
      }
      if (status === 403) {
        throw new Error(`Firecrawl denied the request (403): ${error?.response?.body?.error ?? 'this API key is not allowed to run this search'}`);
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
