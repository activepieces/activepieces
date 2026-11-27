import { createAction, Property } from '@activepieces/pieces-framework';
import { cloroAuth } from '../auth';
import { BING_PROMPT_LIMIT, cloroApi } from '../common/client';
import { countryProp } from '../common/props';

export const searchBingAction = createAction({
  auth: cloroAuth,
  name: 'search_bing',
  classification: 'SEARCH',
  displayName: 'Search Bing',
  description: 'Get the live Bing organic results for a search query in a country.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a live Bing search for a query in one country and returns the organic results of the first page: position, title, URL, displayed link, snippet and date. Use Search Google for Google results, and Get AI Answer for the Bing AI Overview or Bing AI Mode. Uses 5 cloro credits per call; safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'What to search for, as you would type it into Bing. At most 3,500 characters after URL encoding.',
      required: true,
    }),
    country: countryProp,
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'The maximum number of organic results to return, from 1 to 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const query = context.propsValue.query.trim();
    if (cloroApi.encodedPromptLength(query) > BING_PROMPT_LIMIT) {
      throw new Error(
        'The search query is too long for Bing: at most 3,500 characters after URL encoding. Non-Latin scripts allow fewer characters.'
      );
    }
    const result = await cloroApi.monitor({
      apiKey: context.auth.secret_text,
      path: '/v1/monitor/bing',
      body: {
        query,
        country: context.propsValue.country,
      },
    });
    return cloroApi.organicResults({
      items: result['organicResults'],
      maxResults: context.propsValue.max_results,
    });
  },
});
