import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingaiAuth } from '../../index';
import { BASE_URL, apiHeaders } from '../common/common';

export const searchWeb = createAction({
  name: 'search_web',
  displayName: 'Search Web',
  description: 'Perform a Google search for a topic and extract top results',
  auth: dumplingaiAuth,
  props: {
    query: Property.LongText({
      displayName: 'Search Query',
      required: true,
      description: 'The search query to look for on the web',
    }),
    max_results: Property.Number({
      displayName: 'Maximum Results',
      required: false,
      description: 'The maximum number of results to return',
      defaultValue: 5,
    }),
    scrape_results: Property.Checkbox({
      displayName: 'Scrape Results',
      required: false,
      description: 'Whether to scrape and include content from the search results',
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/search`,
      headers: apiHeaders(auth),
      body: {
        query: propsValue.query,
        max_results: propsValue.max_results,
        scrape_results: propsValue.scrape_results,
      },
    });

    return response.body;
  },
}); 