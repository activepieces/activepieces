import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';
import { searchWebActionOutputSchema } from '../output-schemas';

export const searchWeb = createAction({
  auth: firecrawlAuth,
  name: 'search_web',
  displayName: 'Search Web',
  description: 'Search the web for a keyword query and return matching result URLs.',
  audience: 'ai',
  outputSchema: searchWebActionOutputSchema,
  aiMetadata: {
    description:
      'Runs a keyword web search (a SERP wrapper, not semantic/embedding search) and returns the matching result URLs and snippets. Pick this as the entry point when you have a query but no URL yet; then feed a chosen URL into Scrape URL, Crawl Website, Map Website, or Extract Data. Read-only, so repeating the call is safe.',
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
      description: 'Maximum number of results to return.',
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
      description: 'Maximum time to wait for the search, in milliseconds.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, any> = {
      query: propsValue.query,
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
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): your API key plan does not permit search or has insufficient credits.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
