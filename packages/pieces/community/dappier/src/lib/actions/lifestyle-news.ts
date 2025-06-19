import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dappierAuth } from '../..';
import { dappierCommon } from '../common';

export const lifestyleNewsSearch = createAction({
  name: 'lifestyle_news_search',
  auth: dappierAuth,
  displayName: 'Lifestyle News',
  description:
    'Real-time updates, analysis, and personalized content from top sources like The Mix, Snipdaily, Nerdable, and Familyproof.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Enter a natural language query or URL',
      required: true,
    }),
    similarity_top_k: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of articles to return (default is 9)',
      required: false,
    }),
    ref: Property.ShortText({
      displayName: 'Preferred Domain',
      description: 'Restrict results to a domain (e.g., familyproof.com)',
      required: false,
    }),
    num_articles_ref: Property.Number({
      displayName: 'Guaranteed Articles from Domain',
      description: 'Minimum number of articles to match the preferred domain',
      required: false,
    }),
    search_algorithm: Property.StaticDropdown({
      displayName: 'Search Algorithm',
      description: 'Choose how to match articles',
      required: false,
      options: {
        options: [
          { label: 'Semantic (Contextual)', value: 'semantic' },
          { label: 'Most Recent', value: 'most_recent' },
          { label: 'Most Recent + Semantic', value: 'most_recent_semantic' },
          { label: 'Trending', value: 'trending' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${dappierCommon.baseUrl}/app/v2/search?data_model_id=dm_01j0q82s4bfjmsqkhs3ywm3x6y`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        query: propsValue.query,
        similarity_top_k: propsValue.similarity_top_k,
        ref: propsValue.ref,
        num_articles_ref: propsValue.num_articles_ref,
        search_algorithm: propsValue.search_algorithm,
      },
    });

    return res.body;
  },
});
