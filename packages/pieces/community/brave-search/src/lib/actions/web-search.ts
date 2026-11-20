import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { braveSearchAuth } from '../auth';
import { braveSearchCommon } from '../common';

export const braveWebSearchAction = createAction({
  auth: braveSearchAuth,
  name: 'web_search',
  classification: 'SEARCH',
  displayName: 'Web Search',
  description: 'Search the web using Brave Search',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a web search query against the Brave Search API and returns the matching web results. Use it to retrieve current information from the public web for a given text query; set the optional count (1-20) to control how many results come back. Read-only lookup that returns the same results for the same query.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'What to search for, up to 400 characters.',
      placeholder: 'best open source workflow automation tools',
      required: true,
    }),
    count: Property.Number({
      displayName: 'Number of Results',
      description:
        'How many results to return, up to 20. Brave may return fewer.',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 20,
      step: 1,
    }),
  },
  async run(context) {
    const { query, count } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${braveSearchCommon.baseUrl}/web/search`,
      headers: {
        'X-Subscription-Token': context.auth.secret_text,
        Accept: 'application/json',
      },
      queryParams: {
        q: query,
        ...(typeof count === 'number' && Number.isFinite(count)
          ? { count: String(Math.min(20, Math.max(1, Math.round(count)))) }
          : {}),
      },
    });

    return response.body;
  },
});
