import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { randomUUID } from 'crypto';
import { SEARCH_ENGINE_OPTIONS } from '../../common/search-engines';
import { serpstatApiCall } from '../../common/client';

export const getKeywords = createAction({
  name: 'get_keywords',
  displayName: 'Get Keywords',
  description: 'Get keywords data from Serpstat > Keyword Analysis.',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query to find keywords for',
      required: true,
    }),
    se: Property.StaticDropdown({
      displayName: 'Search Engine',
      description: 'Search engine to use for keyword analysis',
      required: true,
      defaultValue: 'g_us',
      options: {
        options: SEARCH_ENGINE_OPTIONS,
      },
    }),
    minusKeywords: Property.Array({
      displayName: 'Minus Keywords',
      description: 'List of keywords to exclude from the search',
      required: false,
    }),
    withIntents: Property.Checkbox({
      displayName: 'With Intents',
      description: 'Include keyword intent (works for g_au and g_us only)',
      required: false,
    }),
    sortField: Property.StaticDropdown({
      displayName: 'Sort Field',
      description: 'Field to sort by (any numeric fields in response data)',
      required: false,
      defaultValue: 'region_queries_count',
      options: {
        options: [
          { label: 'Region Queries Count', value: 'region_queries_count' },
          { label: 'Search Volume', value: 'search_volume' },
          { label: 'CPC', value: 'cpc' },
          { label: 'Competition', value: 'competition' },
          { label: 'Results Count', value: 'results_count' },
        ],
      },
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort direction',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
    size: Property.Number({
      displayName: 'Size',
      description: 'Number of results to return (max 100)',
      required: false,
      defaultValue: 10,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination',
      required: false,
      defaultValue: 1,
    }),
    filters: Property.Json({
      displayName: 'Filters',
      description: 'See the docs for syntax - https://api-docs.serpstat.com/docs/serpstat-public-api/w7jh5sk9kc0cm-get-keywords',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth as string;
    const id = randomUUID();

    // Build params object
    const params: Record<string, any> = {
      keyword: propsValue['query'],
      se: propsValue['se'],
      page: propsValue['page'],
      size: propsValue['size'],
    };
    if (propsValue['minusKeywords']) params['minusKeywords'] = propsValue['minusKeywords'];
    if (propsValue['withIntents'] !== undefined) params['withIntents'] = propsValue['withIntents'];
    if (propsValue['sortField'] && propsValue['sortOrder']) {
      params['sort'] = { [propsValue['sortField']]: propsValue['sortOrder'] };
    }
    if (propsValue['filters']) params['filters'] = propsValue['filters'];

    const body = {
      id,
      method: 'SerpstatKeywordProcedure.getKeywords',
      params,
    };

    return await serpstatApiCall({
      apiToken: token,
      method: HttpMethod.POST,
      resourceUri: '/',
      body,
    });
  },
});