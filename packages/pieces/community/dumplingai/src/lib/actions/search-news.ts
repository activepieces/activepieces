import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingaiAuth } from '../../index';
import { BASE_URL, apiHeaders } from '../common/common';

export const searchNews = createAction({
  name: 'search_news',
  displayName: 'Search News',
  description: 'Find recent news articles on a company or keyword',
  auth: dumplingaiAuth,
  props: {
    query: Property.LongText({
      displayName: 'Search Query',
      required: true,
      description: 'The search query to find news about',
    }),
    max_results: Property.Number({
      displayName: 'Maximum Results',
      required: false,
      description: 'The maximum number of results to return',
      defaultValue: 5,
    }),
    days_back: Property.Number({
      displayName: 'Days Back',
      required: false,
      description: 'How many days back to search for news',
      defaultValue: 7,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/search/news`,
      headers: apiHeaders(auth),
      body: {
        query: propsValue.query,
        max_results: propsValue.max_results,
        days_back: propsValue.days_back,
      },
    });

    return response.body;
  },
}); 