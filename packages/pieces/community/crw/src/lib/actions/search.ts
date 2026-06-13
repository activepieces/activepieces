import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { crwAuth } from '../auth';
import { CRW_API_BASE_URL } from '../common/common';

export const search = createAction({
  auth: crwAuth,
  name: 'search',
  displayName: 'Search the Web',
  description: 'Search the web and get results, optionally with page content.',
  audience: 'both',
  aiMetadata: { description: 'Runs a web search for a query and returns a ranked list of results (title, URL, description, and optionally page markdown), bounded by a result limit and source filter. Choose this to find relevant pages when you do not already have URLs; follow with Scrape, Crawl, or Extract to fetch full content. Read-only, so repeating the same query is safe. Cloud-only.', idempotent: true },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return.',
      required: false,
      defaultValue: 5,
    }),
    sources: Property.StaticMultiSelectDropdown({
      displayName: 'Sources',
      description: 'Which sources to search.',
      required: false,
      defaultValue: ['web'],
      options: {
        disabled: false,
        options: [
          { label: 'Web', value: 'web' },
          { label: 'Images', value: 'images' },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const body: Record<string, any> = {
      query: propsValue.query,
    };

    if (propsValue.limit !== undefined) {
      body['limit'] = propsValue.limit;
    }

    if (propsValue.sources && Array.isArray(propsValue.sources) && propsValue.sources.length > 0) {
      body['sources'] = propsValue.sources;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${CRW_API_BASE_URL}/search`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.secret_text}`,
      },
      body: body,
    });

    return response.body;
  },
});
