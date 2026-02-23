import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { braveSearchAuth } from '../../index';

export const braveWebSearchAction = createAction({
  auth: braveSearchAuth,
  name: 'web_search',
  displayName: 'Web Search',
  description: 'Search the web using Brave Search',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query',
      required: true,
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of results (1-20)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const query = context.propsValue.query;
    const count = context.propsValue.count;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.search.brave.com/res/v1/web/search',
      headers: {
        'X-Subscription-Token': context.auth.secret_text,
        Accept: 'application/json',
      },
      queryParams: {
        q: query,
        count: count as unknown as string,
      },
    });

    return response.body;
  },
});
