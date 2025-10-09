import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { randomUUID } from 'crypto';
import { SEARCH_ENGINE_OPTIONS } from '../../common/search-engines';
import { serpstatApiCall } from '../../common/client';

export const getSuggestions = createAction({
  name: 'get_suggestions',
  displayName: 'Get Suggestions',
  description: 'Get keyword suggestions from Serpstat > Keyword Analysis.',
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'The keyword to get suggestions for.',
      required: true,
    }),
    se: Property.StaticDropdown({
      displayName: 'Search Engine',
      description: 'Search engine to use for suggestions.',
      required: true,
      defaultValue: 'g_us',
      options: {
        options: SEARCH_ENGINE_OPTIONS,
      },
    }),
    filters: Property.Json({
      displayName: 'Filters',
      description: 'See the docs for syntax - https://api-docs.serpstat.com/docs/serpstat-public-api/mmd9zlcqjaoe4-get-suggestions',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number in response.',
      required: false,
      defaultValue: 1,
    }),
    size: Property.Number({
      displayName: 'Size',
      description: 'Number of results per page in response.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth as string;
    const id = randomUUID();

    // Build params object
    const params: Record<string, any> = {
      keyword: propsValue['keyword'],
      se: propsValue['se'],
      page: propsValue['page'],
      size: propsValue['size'],
    };
    if (propsValue['filters']) params['filters'] = propsValue['filters'];

    const body = {
      id,
      method: 'SerpstatKeywordProcedure.getSuggestions',
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